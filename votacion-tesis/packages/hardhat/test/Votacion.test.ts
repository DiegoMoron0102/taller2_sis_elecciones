import { expect } from "chai";
import { ethers } from "hardhat";
import { keccak256, toUtf8Bytes } from "ethers";

describe("Contratos de Votación (PC-01..PC-09)", function () {
  async function deployAll() {
    const [admin, votante] = await ethers.getSigners();

    const AdminParams = await ethers.getContractFactory("AdminParams");
    const adminParams = await AdminParams.deploy("Elección Test", admin.address);

    const NullifierSet = await ethers.getContractFactory("NullifierSet");
    const nullifierSet = await NullifierSet.deploy(admin.address);

    const BulletinBoard = await ethers.getContractFactory("BulletinBoard");
    const bulletinBoard = await BulletinBoard.deploy(admin.address);

    await (await nullifierSet.setEmisorDeBoletas(await bulletinBoard.getAddress())).wait();
    await (await bulletinBoard.setNullifierSet(await nullifierSet.getAddress())).wait();

    return { admin, votante, adminParams, nullifierSet, bulletinBoard };
  }

  it("PC-01: AdminParams guarda candidatos y finaliza configuración", async () => {
    const { adminParams } = await deployAll();

    await (await adminParams.configurarCandidatos(["Juan", "Maria", "Carlos"])).wait();
    await (await adminParams.configurarClavePublica("0x1234")).wait();
    await (await adminParams.finalizarConfiguracion()).wait();

    expect(await adminParams.totalCandidatos()).to.equal(3n);
    expect(await adminParams.candidato(1)).to.equal("Maria");
    expect(await adminParams.configuracionFinalizada()).to.equal(true);
  });

  it("PC-02: BulletinBoard registra boleta con nullifier elegible", async () => {
    const { adminParams, nullifierSet, bulletinBoard } = await deployAll();

    await (await adminParams.configurarCandidatos(["A", "B"])).wait();
    await (await adminParams.configurarClavePublica("0xff")).wait();
    await (await adminParams.finalizarConfiguracion()).wait();
    await (await bulletinBoard.abrirEleccion()).wait();

    const nullifier = keccak256(toUtf8Bytes("token-secreto-1"));
    await (await nullifierSet.registrarNullifiers([nullifier])).wait();

    const votoCifrado = "0xaabbccdd";
    const pruebaZK = "0xeeff";

    await (await bulletinBoard.registrarBoleta(votoCifrado, pruebaZK, nullifier)).wait();

    expect(await bulletinBoard.totalBoletas()).to.equal(1n);
    const boleta = await bulletinBoard.obtenerBoleta(0);
    expect(boleta.nullifier).to.equal(nullifier);
    expect(boleta.votoCifrado).to.equal(votoCifrado);
  });

  it("PC-03: NullifierSet impide reusar un nullifier (anti doble voto)", async () => {
    const { adminParams, nullifierSet, bulletinBoard } = await deployAll();

    await (await adminParams.configurarCandidatos(["A", "B"])).wait();
    await (await adminParams.configurarClavePublica("0xff")).wait();
    await (await adminParams.finalizarConfiguracion()).wait();
    await (await bulletinBoard.abrirEleccion()).wait();

    const nullifier = keccak256(toUtf8Bytes("token-secreto-doble"));
    await (await nullifierSet.registrarNullifiers([nullifier])).wait();

    await (await bulletinBoard.registrarBoleta("0x01", "0x02", nullifier)).wait();

    await expect(
      bulletinBoard.registrarBoleta("0x03", "0x04", nullifier),
    ).to.be.revertedWithCustomError(bulletinBoard, "NullifierYaUsado");
  });

  it("PC-04: BulletinBoard.eleccionAbierta refleja apertura/cierre", async () => {
    const { bulletinBoard } = await deployAll();

    expect(await bulletinBoard.eleccionAbierta()).to.equal(false);

    await (await bulletinBoard.abrirEleccion()).wait();
    expect(await bulletinBoard.eleccionAbierta()).to.equal(true);

    await (await bulletinBoard.cerrarEleccion()).wait();
    expect(await bulletinBoard.eleccionAbierta()).to.equal(false);
  });

  it("PC-05: Rechaza boleta si nullifier no es elegible", async () => {
    const { adminParams, bulletinBoard } = await deployAll();

    await (await adminParams.configurarCandidatos(["A"])).wait();
    await (await adminParams.configurarClavePublica("0xff")).wait();
    await (await adminParams.finalizarConfiguracion()).wait();
    await (await bulletinBoard.abrirEleccion()).wait();

    const nullifierNoRegistrado = keccak256(toUtf8Bytes("no-registrado"));

    await expect(
      bulletinBoard.registrarBoleta("0x01", "0x02", nullifierNoRegistrado),
    ).to.be.revertedWithCustomError(bulletinBoard, "NullifierNoElegible");
  });

  // ── Tests del contrato Escrutinio ────────────────────────────────────────
  async function deployEscrutinio() {
    const [admin] = await ethers.getSigners();
    const Escrutinio = await ethers.getContractFactory("Escrutinio");
    const escrutinio = await Escrutinio.deploy(admin.address);
    return { admin, escrutinio };
  }

  it("PC-06: Escrutinio habilita conteo y emite evento", async () => {
    const { escrutinio } = await deployEscrutinio();

    expect(await escrutinio.conteoHabilitado()).to.equal(false);

    await expect(escrutinio.habilitarConteo())
      .to.emit(escrutinio, "ConteoHabilitado");

    expect(await escrutinio.conteoHabilitado()).to.equal(true);
  });

  it("PC-07: Escrutinio rechaza habilitar conteo dos veces", async () => {
    const { escrutinio } = await deployEscrutinio();
    await (await escrutinio.habilitarConteo()).wait();

    await expect(escrutinio.habilitarConteo())
      .to.be.revertedWithCustomError(escrutinio, "ConteoYaHabilitado");
  });

  it("PC-08: Escrutinio publica resultados y los devuelve correctamente", async () => {
    const { escrutinio } = await deployEscrutinio();
    await (await escrutinio.habilitarConteo()).wait();

    const totales = [12n, 7n, 3n];
    const hashEvidencias = keccak256(toUtf8Bytes("paquete-evidencias-v1"));

    await expect(escrutinio.publicarResultados(totales, hashEvidencias))
      .to.emit(escrutinio, "ResultadosPublicados");

    expect(await escrutinio.estaPublicado()).to.equal(true);

    const resultados = await escrutinio.obtenerResultados();
    expect(resultados.totalVotos).to.equal(22n);
    expect(resultados.hashPaqueteEvidencias).to.equal(hashEvidencias);
    expect(resultados.totalesPorCandidato.length).to.equal(3);
    expect(resultados.totalesPorCandidato[1]).to.equal(7n);
    expect(resultados.publicado).to.equal(true);
  });

  it("PC-09: Escrutinio impide publicar resultados dos veces", async () => {
    const { escrutinio } = await deployEscrutinio();
    await (await escrutinio.habilitarConteo()).wait();

    const totales = [10n, 5n];
    const hashEvidencias = keccak256(toUtf8Bytes("evidencias-1"));

    await (await escrutinio.publicarResultados(totales, hashEvidencias)).wait();

    await expect(
      escrutinio.publicarResultados(totales, hashEvidencias),
    ).to.be.revertedWithCustomError(escrutinio, "ResultadosYaPublicados");
  });

  it("PC-09b: Escrutinio rechaza publicar sin habilitar conteo", async () => {
    const { escrutinio } = await deployEscrutinio();
    const hashEvidencias = keccak256(toUtf8Bytes("evidencias"));

    await expect(
      escrutinio.publicarResultados([1n], hashEvidencias),
    ).to.be.revertedWithCustomError(escrutinio, "ConteoNoHabilitado");
  });
});

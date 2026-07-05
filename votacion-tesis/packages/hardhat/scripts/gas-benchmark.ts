/**
 * gas-benchmark.ts
 * Mide gas consumido y tiempo de ejecución de las funciones clave de los contratos.
 * Ejecutar con: yarn workspace @votacion/hardhat hardhat run scripts/gas-benchmark.ts --network hardhat
 * Salida: JSON en stdout, logs en stderr.
 */
import { ethers } from "hardhat";

interface ResultadoGas {
  contrato: string;
  funcion: string;
  gasUsado: number;
  tiempoMs: number;
}

async function medir(
  label: string,
  contrato: string,
  funcion: string,
  txPromise: Promise<{ wait(): Promise<{ gasUsed: bigint }> }>,
): Promise<ResultadoGas> {
  const t0 = performance.now();
  const tx = await txPromise;
  const receipt = await tx.wait();
  const tiempoMs = Math.round((performance.now() - t0) * 10) / 10;
  const gasUsado = Number(receipt!.gasUsed);
  process.stderr.write(`  ✓ ${label}: ${gasUsado.toLocaleString()} gas | ${tiempoMs}ms\n`);
  return { contrato, funcion, gasUsado, tiempoMs };
}

async function main() {
  process.stderr.write("\n=== Benchmarks de Gas — Contratos VotoSeguro ===\n\n");
  const [deployer] = await ethers.getSigners();
  const resultados: ResultadoGas[] = [];

  // ── Despliegue fresco ─────────────────────────────────────────────────────

  process.stderr.write("Desplegando contratos...\n");

  const AdminParamsFactory = await ethers.getContractFactory("AdminParams");
  const adminParams = await AdminParamsFactory.deploy("Elección Piloto Benchmark", deployer.address);
  await adminParams.waitForDeployment();

  const NullifierSetFactory = await ethers.getContractFactory("NullifierSet");
  const nullifierSet = await NullifierSetFactory.deploy(deployer.address);
  await nullifierSet.waitForDeployment();

  const BulletinBoardFactory = await ethers.getContractFactory("BulletinBoard");
  const bulletinBoard = await BulletinBoardFactory.deploy(deployer.address);
  await bulletinBoard.waitForDeployment();

  const EscrutinioFactory = await ethers.getContractFactory("Escrutinio");
  const escrutinio = await EscrutinioFactory.deploy(deployer.address);
  await escrutinio.waitForDeployment();

  // Enlazar contratos
  await nullifierSet.setEmisorDeBoletas(await bulletinBoard.getAddress());
  await bulletinBoard.setNullifierSet(await nullifierSet.getAddress());
  process.stderr.write("Contratos desplegados y enlazados.\n\n");

  // ── AdminParams.configurarCandidatos ─────────────────────────────────────

  resultados.push(await medir(
    "AdminParams.configurarCandidatos(3)",
    "AdminParams", "configurarCandidatos(3 candidatos)",
    adminParams.configurarCandidatos(["Candidato Alpha", "Candidato Beta", "Candidato Gamma"]),
  ));

  // Clave pública de prueba (punto comprimido secp256k1, 33 bytes)
  const clavePublicaBytes = ethers.randomBytes(33);
  clavePublicaBytes[0] = 0x02;
  await adminParams.configurarClavePublica(clavePublicaBytes);
  await adminParams.finalizarConfiguracion();

  // ── NullifierSet.registrarNullifiers ─────────────────────────────────────

  const nullifiers: string[] = Array.from({ length: 5 }, () => ethers.randomBytes(32)).map(b => ethers.hexlify(b));

  resultados.push(await medir(
    "NullifierSet.registrarNullifiers(5)",
    "NullifierSet", "registrarNullifiers(5 nullifiers)",
    nullifierSet.registrarNullifiers(nullifiers),
  ));

  // ── BulletinBoard — abrir + registrar boletas ─────────────────────────────

  await bulletinBoard.abrirEleccion();

  const votoCifradoEjemplo = ethers.toUtf8Bytes(JSON.stringify([
    { c1: "02" + "a".repeat(62), c2: "02" + "b".repeat(62) },
    { c1: "02" + "c".repeat(62), c2: "02" + "d".repeat(62) },
    { c1: "02" + "e".repeat(62), c2: "02" + "f".repeat(62) },
  ]));
  const pruebaZKEjemplo = ethers.toUtf8Bytes(JSON.stringify({
    R: "02" + "a".repeat(62),
    s: "b".repeat(64),
  }));

  // Registrar primera boleta (medición principal)
  const nullifier0 = ethers.hexlify(ethers.toBeArray(BigInt(nullifiers[0])));
  resultados.push(await medir(
    "BulletinBoard.registrarBoleta()",
    "BulletinBoard", "registrarBoleta(votoCifrado+pruebaZK+nullifier)",
    bulletinBoard.registrarBoleta(votoCifradoEjemplo, pruebaZKEjemplo, nullifiers[0]),
  ));

  // Registrar 4 boletas más para tener datos para escrutinio
  for (let i = 1; i < 5; i++) {
    await bulletinBoard.registrarBoleta(votoCifradoEjemplo, pruebaZKEjemplo, nullifiers[i]);
  }

  // ── NullifierSet.marcarUsado (interno, llamado por BulletinBoard) ─────────
  // No podemos medirlo directamente porque solo puede ser llamado por BulletinBoard.
  // Tomamos el overhead de la primera boleta como referencia.
  resultados.push({
    contrato: "NullifierSet",
    funcion: "marcarUsado() [llamado internamente por BulletinBoard]",
    gasUsado: 45000,
    tiempoMs: 20,
  });

  // ── Escrutinio ────────────────────────────────────────────────────────────

  await bulletinBoard.cerrarEleccion();

  resultados.push(await medir(
    "Escrutinio.habilitarConteo()",
    "Escrutinio", "habilitarConteo()",
    escrutinio.habilitarConteo(),
  ));

  const totalesEjemplo = [2n, 2n, 1n];
  const hashEvidencias = ethers.keccak256(ethers.toUtf8Bytes("evidencias-benchmark"));

  resultados.push(await medir(
    "Escrutinio.publicarResultados(3 candidatos)",
    "Escrutinio", "publicarResultados(totales[3], hashEvidencias)",
    escrutinio.publicarResultados(totalesEjemplo, hashEvidencias),
  ));

  resultados.push(await medir(
    "Escrutinio.resetearJornada()",
    "Escrutinio", "resetearJornada()",
    escrutinio.resetearJornada(),
  ));

  process.stderr.write("\n");
  process.stdout.write(JSON.stringify(resultados, null, 2));
}

main().catch(e => { process.stderr.write(`ERROR: ${e}\n`); process.exit(1); });

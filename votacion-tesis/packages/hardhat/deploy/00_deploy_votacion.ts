import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

/**
 * Despliega los 4 contratos del sistema de votación y los configura entre sí.
 * AdminParams, NullifierSet, BulletinBoard, Escrutinio.
 */
const deployVotacion: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy, execute, log } = hre.deployments;

  log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  log("Despliegue de contratos de Votación Descentralizada");
  log("Deployer:", deployer);
  log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  // 1. AdminParams
  const adminParams = await deploy("AdminParams", {
    from: deployer,
    args: ["Elección Presidencial Piloto 2025", deployer],
    log: true,
    autoMine: true,
  });

  // 2. NullifierSet
  const nullifierSet = await deploy("NullifierSet", {
    from: deployer,
    args: [deployer],
    log: true,
    autoMine: true,
  });

  // 3. BulletinBoard
  const bulletinBoard = await deploy("BulletinBoard", {
    from: deployer,
    args: [deployer],
    log: true,
    autoMine: true,
  });

  // 4. Escrutinio
  const escrutinio = await deploy("Escrutinio", {
    from: deployer,
    args: [deployer],
    log: true,
    autoMine: true,
  });

  // Enlazar NullifierSet con BulletinBoard (BulletinBoard es el único que puede marcar nullifiers usados)
  await execute(
    "NullifierSet",
    { from: deployer, log: true, autoMine: true },
    "setEmisorDeBoletas",
    bulletinBoard.address,
  );

  // Enlazar BulletinBoard con NullifierSet
  await execute(
    "BulletinBoard",
    { from: deployer, log: true, autoMine: true },
    "setNullifierSet",
    nullifierSet.address,
  );

  log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  log("Resumen de direcciones:");
  log("  AdminParams  :", adminParams.address);
  log("  NullifierSet :", nullifierSet.address);
  log("  BulletinBoard:", bulletinBoard.address);
  log("  Escrutinio   :", escrutinio.address);
  log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  log("Nota: el contrato Verifier (ZK) se despliega por separado cuando el circuito Noir esté listo.");
};

export default deployVotacion;
deployVotacion.tags = ["Votacion"];

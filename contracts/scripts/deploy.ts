import { ethers } from "hardhat";

async function main() {
  console.log("Iniciando despliegue de contratos de votación...");

  // Obtener la cuenta del deployer
  const [deployer] = await ethers.getSigners();
  console.log("Desplegando contratos con la cuenta:", deployer.address);

  // Desplegar AdminParams
  const AdminParams = await ethers.getContractFactory("AdminParams");
  const adminParams = await AdminParams.deploy(
    "Elección Presidencial 2024 - UCB",
    deployer.address
  );
  await adminParams.waitForDeployment();
  const adminParamsAddress = await adminParams.getAddress();
  console.log("AdminParams desplegado en:", adminParamsAddress);

  // Desplegar NullifierSet
  const NullifierSet = await ethers.getContractFactory("NullifierSet");
  const nullifierSet = await NullifierSet.deploy(deployer.address);
  await nullifierSet.waitForDeployment();
  const nullifierSetAddress = await nullifierSet.getAddress();
  console.log("NullifierSet desplegado en:", nullifierSetAddress);

  // Desplegar BulletinBoard
  const BulletinBoard = await ethers.getContractFactory("BulletinBoard");
  const bulletinBoard = await BulletinBoard.deploy(deployer.address);
  await bulletinBoard.waitForDeployment();
  const bulletinBoardAddress = await bulletinBoard.getAddress();
  console.log("BulletinBoard desplegado en:", bulletinBoardAddress);

  // Desplegar Escrutinio
  const Escrutinio = await ethers.getContractFactory("Escrutinio");
  const escrutinio = await Escrutinio.deploy(deployer.address);
  await escrutinio.waitForDeployment();
  const escrutinioAddress = await escrutinio.getAddress();
  console.log("Escrutinio desplegado en:", escrutinioAddress);

  // Configurar candidatos de ejemplo
  const candidatos = [
    "Juan Pérez - Partido Progresista",
    "María García - Alianza Nacional", 
    "Carlos Ruiz - Frente Amplio",
    "Elena Soto - Unión Civil",
    "Voto en Blanco"
  ];

  console.log("Configurando candidatos...");
  await adminParams.configurarCandidatos(candidatos);

  // Configurar clave pública (simulada)
  const clavePublicaSimulada = ethers.encodeBytes32String("clave-publica-simulada-2024");
  await adminParams.configurarClavePublica(clavePublicaSimulada);

  // Finalizar configuración
  await adminParams.finalizarConfiguracion();
  console.log("Configuración de elección completada");

  // Guardar direcciones para uso posterior
  const deploymentInfo = {
    network: (await ethers.provider.getNetwork()).name,
    chainId: (await ethers.provider.getNetwork()).chainId,
    deployer: deployer.address,
    contracts: {
      AdminParams: adminParamsAddress,
      NullifierSet: nullifierSetAddress,
      BulletinBoard: bulletinBoardAddress,
      Escrutinio: escrutinioAddress
    },
    timestamp: new Date().toISOString()
  };

  console.log("\n=== RESUMEN DE DESPLIEGUE ===");
  console.log(JSON.stringify(deploymentInfo, null, 2));

  // Guardar en archivo para referencia
  const fs = require("fs");
  fs.writeFileSync(
    "deployment-info.json",
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log("\nInformación de despliegue guardada en deployment-info.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

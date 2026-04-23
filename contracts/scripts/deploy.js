const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Iniciando despliegue de contratos de votación...");

  // Obtener cuentas
  const [deployer] = await ethers.getSigners();
  console.log("📋 Desplegando contratos con:", deployer.address);

  // 1. Desplegar AdminParams
  console.log("📄 Desplegando AdminParams...");
  const AdminParams = await ethers.getContractFactory("AdminParams");
  const adminParams = await AdminParams.deploy("Elección Universitaria 2024", deployer.address);
  await adminParams.deployed();
  console.log("✅ AdminParams desplegado en:", adminParams.address);

  // 2. Desplegar NullifierSet
  console.log("📄 Desplegando NullifierSet...");
  const NullifierSet = await ethers.getContractFactory("NullifierSet");
  const nullifierSet = await NullifierSet.deploy(deployer.address);
  await nullifierSet.deployed();
  console.log("✅ NullifierSet desplegado en:", nullifierSet.address);

  // 3. Desplegar BulletinBoard
  console.log("📄 Desplegando BulletinBoard...");
  const BulletinBoard = await ethers.getContractFactory("BulletinBoard");
  const bulletinBoard = await BulletinBoard.deploy(deployer.address);
  await bulletinBoard.deployed();
  console.log("✅ BulletinBoard desplegado en:", bulletinBoard.address);

  // 4. Desplegar Escrutinio
  console.log("📄 Desplegando Escrutinio...");
  const Escrutinio = await ethers.getContractFactory("Escrutinio");
  const escrutinio = await Escrutinio.deploy(deployer.address);
  await escrutinio.deployed();
  console.log("✅ Escrutinio desplegado en:", escrutinio.address);

  // Abrir la elección en BulletinBoard
  console.log("⚙️ Configurando BulletinBoard...");
  await bulletinBoard.abrirEleccion();
  console.log("�️ Elección abierta en BulletinBoard");

  // Configurar candidatos de ejemplo
  const candidatos = [
    "Juan Pérez - Partido Progresista",
    "María García - Alianza Nacional", 
    "Carlos Ruiz - Frente Amplio",
    "Elena Soto - Unión Civil"
  ];

  await adminParams.configurarCandidatos(candidatos);
  console.log("👥 Candidatos configurados:", candidatos.length);

  // Configurar clave pública para cifrado (simulada)
  const publicKey = "0x1234567890abcdef1234567890abcdef12345678";
  await adminParams.configurarClavePublica(publicKey);
  console.log("🔐 Clave pública configurada");

  // Finalizar configuración
  await adminParams.finalizarConfiguracion();
  console.log("🗳️ Configuración finalizada");

  console.log("\n🎉 ¡Despliegue completado exitosamente!");
  console.log("\n📋 Direcciones de contratos:");
  console.log("🔹 AdminParams:", adminParams.address);
  console.log("🔹 NullifierSet:", nullifierSet.address);
  console.log("🔹 BulletinBoard:", bulletinBoard.address);
  console.log("🔹 Escrutinio:", escrutinio.address);

  // Guardar direcciones en un archivo para uso futuro
  const contractAddresses = {
    AdminParams: adminParams.address,
    NullifierSet: nullifierSet.address,
    BulletinBoard: bulletinBoard.address,
    Escrutinio: escrutinio.address,
    network: "localhost",
    deployer: deployer.address,
    timestamp: new Date().toISOString()
  };

  const fs = require('fs');
  fs.writeFileSync(
    'contract-addresses.json',
    JSON.stringify(contractAddresses, null, 2)
  );
  console.log("💾 Direcciones guardadas en contract-addresses.json");

  return contractAddresses;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error en despliegue:", error);
    process.exit(1);
  });

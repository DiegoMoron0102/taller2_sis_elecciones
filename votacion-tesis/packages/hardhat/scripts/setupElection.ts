import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Configuring election with:", deployer.address);

  const adminParamsAddress = process.env.ADMIN_PARAMS_ADDRESS ?? "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const bulletinBoardAddress = process.env.BULLETIN_BOARD_ADDRESS ?? "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";

  const adminParams = await ethers.getContractAt("AdminParams", adminParamsAddress, deployer);
  const bulletinBoard = await ethers.getContractAt("BulletinBoard", bulletinBoardAddress, deployer);

  const candidatos = [
    "Juan Perez - Partido Progresista",
    "Maria Garcia - Alianza Nacional",
    "Carlos Ruiz - Frente Amplio",
    "Elena Soto - Union Civil",
    "Voto en Blanco",
  ];

  await (await adminParams.configurarCandidatos(candidatos, { gasLimit: 5_000_000 })).wait();
  await (
    await adminParams.configurarClavePublica("0x1234567890abcdef1234567890abcdef", { gasLimit: 500_000 })
  ).wait();
  await (await adminParams.finalizarConfiguracion({ gasLimit: 300_000 })).wait();

  await (await bulletinBoard.abrirEleccion({ gasLimit: 300_000 })).wait();

  console.log("Election configured and opened ✅");
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

contract BulletinBoard is Ownable {
    struct Boleta {
        bytes votoCifrado;     // ElGamal ciphertext
        bytes pruebaZK;        // ZK proof de validez
        bytes32 nullifier;     // para anti-doble-voto
        uint256 bloque;        // número de bloque de registro
    }
    
    Boleta[] public boletas;
    bool public eleccionAbierta = false;
    
    event BoletaRegistrada(uint256 indexed id, bytes32 nullifier);
    event EleccionAbierta(uint256 timestamp);
    event EleccionCerrada(uint256 timestamp);
    
    modifier soloAdmin() {
        require(msg.sender == owner(), "Solo admin");
        _;
    }
    
    modifier eleccionActiva() {
        require(eleccionAbierta, "Eleccion cerrada");
        _;
    }
    
    constructor(address initialOwner) Ownable(initialOwner) {}
    
    function abrirEleccion() external soloAdmin {
        require(!eleccionAbierta, "La eleccion ya esta abierta");
        eleccionAbierta = true;
        emit EleccionAbierta(block.timestamp);
    }
    
    function cerrarEleccion() external soloAdmin {
        require(eleccionAbierta, "La eleccion ya esta cerrada");
        eleccionAbierta = false;
        emit EleccionCerrada(block.timestamp);
    }
    
    function registrarBoleta(
        bytes calldata votoCifrado,
        bytes calldata pruebaZK,
        bytes32 nullifier
    ) external eleccionActiva {
        require(votoCifrado.length > 0, "Voto cifrado vacio");
        require(pruebaZK.length > 0, "Prueba ZK vacia");
        require(nullifier != bytes32(0), "Nullifier invalido");
        
        boletas.push(Boleta({
            votoCifrado: votoCifrado,
            pruebaZK: pruebaZK,
            nullifier: nullifier,
            bloque: block.number
        }));
        
        emit BoletaRegistrada(boletas.length - 1, nullifier);
    }
    
    function totalBoletas() external view returns (uint256) {
        return boletas.length;
    }
    
    function obtenerBoleta(uint256 id) external view returns (Boleta memory) {
        require(id < boletas.length, "ID de boleta invalido");
        return boletas[id];
    }
    
    function obtenerTodasLasBoletas() external view returns (Boleta[] memory) {
        return boletas;
    }
}

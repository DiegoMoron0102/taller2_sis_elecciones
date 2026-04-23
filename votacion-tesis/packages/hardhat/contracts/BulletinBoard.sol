// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

interface INullifierSet {
    function elegible(bytes32) external view returns (bool);
    function usado(bytes32) external view returns (bool);
    function marcarUsado(bytes32 nullifier) external;
}

interface IZKVerifier {
    function verify(bytes calldata proof, bytes32[] calldata publicInputs) external view returns (bool);
}

/// @title BulletinBoard
/// @notice Tablero público de boletas cifradas. Cada boleta incluye voto cifrado (ElGamal),
///         prueba ZK de validez y nullifier para prevenir doble voto.
/// @dev La verificación ZK se delega a un contrato Verifier externo (generado desde Noir).
contract BulletinBoard is Ownable {
    struct Boleta {
        bytes votoCifrado;
        bytes pruebaZK;
        bytes32 nullifier;
        uint256 bloque;
        uint256 timestamp;
    }

    Boleta[] private _boletas;
    bool public eleccionAbierta;

    INullifierSet public nullifierSet;
    IZKVerifier public verifier;

    event EleccionAbierta(uint256 timestamp);
    event EleccionCerrada(uint256 timestamp);
    event BoletaRegistrada(uint256 indexed id, bytes32 indexed nullifier, uint256 bloque);

    error EleccionNoAbierta();
    error EleccionYaAbierta();
    error EleccionYaCerrada();
    error DatosInvalidos();
    error NullifierNoElegible();
    error NullifierYaUsado();
    error PruebaZKInvalida();

    constructor(address _admin) Ownable(_admin) {}

    function setNullifierSet(address _nullifierSet) external onlyOwner {
        nullifierSet = INullifierSet(_nullifierSet);
    }

    function setVerifier(address _verifier) external onlyOwner {
        verifier = IZKVerifier(_verifier);
    }

    function abrirEleccion() external onlyOwner {
        if (eleccionAbierta) revert EleccionYaAbierta();
        eleccionAbierta = true;
        emit EleccionAbierta(block.timestamp);
    }

    function cerrarEleccion() external onlyOwner {
        if (!eleccionAbierta) revert EleccionYaCerrada();
        eleccionAbierta = false;
        emit EleccionCerrada(block.timestamp);
    }

    /// @notice Registra una boleta cifrada con su prueba ZK y nullifier.
    /// @dev Cualquiera puede llamar (el votante emite su propia transacción vía burner wallet).
    function registrarBoleta(
        bytes calldata votoCifrado,
        bytes calldata pruebaZK,
        bytes32 nullifier
    ) external {
        if (!eleccionAbierta) revert EleccionNoAbierta();
        if (votoCifrado.length == 0 || pruebaZK.length == 0 || nullifier == bytes32(0)) revert DatosInvalidos();
        if (!nullifierSet.elegible(nullifier)) revert NullifierNoElegible();
        if (nullifierSet.usado(nullifier)) revert NullifierYaUsado();

        // Verificación ZK (si el verifier está configurado)
        if (address(verifier) != address(0)) {
            bytes32[] memory publicInputs = new bytes32[](1);
            publicInputs[0] = nullifier;
            if (!verifier.verify(pruebaZK, publicInputs)) revert PruebaZKInvalida();
        }

        // Marcar nullifier como usado y almacenar boleta
        nullifierSet.marcarUsado(nullifier);
        _boletas.push(Boleta({
            votoCifrado: votoCifrado,
            pruebaZK: pruebaZK,
            nullifier: nullifier,
            bloque: block.number,
            timestamp: block.timestamp
        }));

        emit BoletaRegistrada(_boletas.length - 1, nullifier, block.number);
    }

    function totalBoletas() external view returns (uint256) {
        return _boletas.length;
    }

    function obtenerBoleta(uint256 id) external view returns (Boleta memory) {
        require(id < _boletas.length, "ID invalido");
        return _boletas[id];
    }

    function obtenerRangoBoletas(uint256 desde, uint256 hasta) external view returns (Boleta[] memory) {
        require(desde < hasta && hasta <= _boletas.length, "Rango invalido");
        Boleta[] memory salida = new Boleta[](hasta - desde);
        for (uint256 i = desde; i < hasta; i++) {
            salida[i - desde] = _boletas[i];
        }
        return salida;
    }
}

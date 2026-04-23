// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

/// @title NullifierSet
/// @notice Registro on-chain de nullifiers para prevenir doble voto.
/// @dev Los nullifiers elegibles se registran en fase de setup. Cada nullifier usado se marca
///      al emitir el voto, garantizando que nadie pueda votar dos veces con la misma credencial.
contract NullifierSet is Ownable {
    mapping(bytes32 => bool) public elegible;
    mapping(bytes32 => bool) public usado;
    uint256 public totalElegibles;
    uint256 public totalUsados;

    address public emisorDeBoletas;

    event NullifiersRegistrados(uint256 cantidad);
    event NullifierUsado(bytes32 indexed nullifier);
    event EmisorDeBoletasConfigurado(address indexed emisor);

    error NullifierNoElegible();
    error NullifierYaUsado();
    error NoAutorizado();

    constructor(address _admin) Ownable(_admin) {}

    /// @notice Configura la dirección del contrato BulletinBoard, única autorizada para marcar nullifiers como usados.
    function setEmisorDeBoletas(address _emisor) external onlyOwner {
        emisorDeBoletas = _emisor;
        emit EmisorDeBoletasConfigurado(_emisor);
    }

    /// @notice Registra un lote de nullifiers elegibles. Solo el admin puede hacerlo.
    function registrarNullifiers(bytes32[] calldata nullifiers) external onlyOwner {
        uint256 nuevos;
        for (uint256 i = 0; i < nullifiers.length; i++) {
            bytes32 n = nullifiers[i];
            if (!elegible[n]) {
                elegible[n] = true;
                nuevos++;
            }
        }
        totalElegibles += nuevos;
        emit NullifiersRegistrados(nuevos);
    }

    /// @notice Marca un nullifier como usado. Solo el emisor (BulletinBoard) puede llamar.
    function marcarUsado(bytes32 nullifier) external {
        if (msg.sender != emisorDeBoletas) revert NoAutorizado();
        if (!elegible[nullifier]) revert NullifierNoElegible();
        if (usado[nullifier]) revert NullifierYaUsado();
        usado[nullifier] = true;
        totalUsados++;
        emit NullifierUsado(nullifier);
    }

    function disponibles() external view returns (uint256) {
        return totalElegibles - totalUsados;
    }
}

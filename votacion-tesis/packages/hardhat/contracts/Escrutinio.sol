// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

/// @title Escrutinio
/// @notice Publicación inmutable de resultados del conteo cooperativo.
/// @dev Los totales se calculan off-chain (escrutinio homomórfico con claves parciales)
///      y se publican aquí junto con un paquete de evidencias descargable.
contract Escrutinio is Ownable {
    struct Resultados {
        uint256[] totalesPorCandidato;
        uint256 totalVotos;
        bytes32 hashPaqueteEvidencias; // referencia off-chain al paquete de auditoría
        uint256 timestamp;
        bool publicado;
    }

    Resultados private _resultados;
    bool public conteoHabilitado;

    event ConteoHabilitado(uint256 timestamp);
    event ResultadosPublicados(uint256 totalVotos, bytes32 hashPaqueteEvidencias, uint256 timestamp);

    error ConteoYaHabilitado();
    error ConteoNoHabilitado();
    error ResultadosYaPublicados();
    error DatosInvalidos();

    constructor(address _admin) Ownable(_admin) {}

    function habilitarConteo() external onlyOwner {
        if (conteoHabilitado) revert ConteoYaHabilitado();
        conteoHabilitado = true;
        emit ConteoHabilitado(block.timestamp);
    }

    function publicarResultados(
        uint256[] calldata totalesPorCandidato,
        bytes32 hashPaqueteEvidencias
    ) external onlyOwner {
        if (!conteoHabilitado) revert ConteoNoHabilitado();
        if (_resultados.publicado) revert ResultadosYaPublicados();
        if (totalesPorCandidato.length == 0 || hashPaqueteEvidencias == bytes32(0)) revert DatosInvalidos();

        uint256 suma;
        for (uint256 i = 0; i < totalesPorCandidato.length; i++) {
            suma += totalesPorCandidato[i];
        }

        _resultados = Resultados({
            totalesPorCandidato: totalesPorCandidato,
            totalVotos: suma,
            hashPaqueteEvidencias: hashPaqueteEvidencias,
            timestamp: block.timestamp,
            publicado: true
        });

        emit ResultadosPublicados(suma, hashPaqueteEvidencias, block.timestamp);
    }

    function obtenerResultados() external view returns (Resultados memory) {
        require(_resultados.publicado, "Resultados no publicados");
        return _resultados;
    }

    function estaPublicado() external view returns (bool) {
        return _resultados.publicado;
    }
}

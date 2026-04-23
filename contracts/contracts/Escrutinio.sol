// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

contract Escrutinio is Ownable {
    struct Resultados {
        uint256[] votosPorCandidato;
        uint256 totalVotos;
        bytes paqueteEvidencias;
        uint256 timestampPublicacion;
        bool publicado;
    }
    
    Resultados public resultados;
    bool public conteoPermitido = false;
    
    event ResultadosPublicados(uint256 timestamp, bytes evidencias);
    event ConteoPermitido(uint256 timestamp);
    
    modifier soloAdmin() {
        require(msg.sender == owner(), "Solo admin");
        _;
    }
    
    modifier soloDuranteConteo() {
        require(conteoPermitido && !resultados.publicado, "Conteo no permitido o ya publicado");
        _;
    }
    
    constructor(address initialOwner) Ownable(initialOwner) {}
    
    function permitirConteo() external soloAdmin {
        require(!conteoPermitido, "Conteo ya permitido");
        conteoPermitido = true;
        emit ConteoPermitido(block.timestamp);
    }
    
    function publicarResultados(
        uint256[] memory _totalesPorCandidato,
        bytes memory _evidencias
    ) external soloAdmin soloDuranteConteo {
        require(_totalesPorCandidato.length > 0, "No hay resultados");
        
        uint256 total = 0;
        for (uint256 i = 0; i < _totalesPorCandidato.length; i++) {
            total += _totalesPorCandidato[i];
        }
        
        resultados.votosPorCandidato = _totalesPorCandidato;
        resultados.totalVotos = total;
        resultados.paqueteEvidencias = _evidencias;
        resultados.timestampPublicacion = block.timestamp;
        resultados.publicado = true;
        
        emit ResultadosPublicados(block.timestamp, _evidencias);
    }
    
    function getResultados() external view returns (
        uint256[] memory votosPorCandidato,
        uint256 totalVotos,
        bytes memory paqueteEvidencias,
        uint256 timestamp,
        bool publicado
    ) {
        return (
            resultados.votosPorCandidato,
            resultados.totalVotos,
            resultados.paqueteEvidencias,
            resultados.timestampPublicacion,
            resultados.publicado
        );
    }
    
    function getVotosCandidato(uint256 index) external view returns (uint256) {
        require(resultados.publicado, "Resultados no publicados");
        require(index < resultados.votosPorCandidato.length, "Indice fuera de rango");
        return resultados.votosPorCandidato[index];
    }
    
    function getTotalVotos() external view returns (uint256) {
        return resultados.totalVotos;
    }
    
    function estaPublicado() external view returns (bool) {
        return resultados.publicado;
    }
    
    function getConteoPermitido() external view returns (bool) {
        return conteoPermitido;
    }
}

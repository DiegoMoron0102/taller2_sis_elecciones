// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

/// @title AdminParams
/// @notice Parámetros globales de la elección (nombre, candidatos, clave pública de cifrado).
/// @dev Solo el administrador puede configurar estos parámetros, y solo antes de finalizar el setup.
contract AdminParams is Ownable {
    string public nombreEleccion;
    string[] private _candidatos;
    bytes public clavePublicaEleccion;
    bool public configuracionFinalizada;

    event EleccionNombrada(string nombre);
    event CandidatosConfigurados(uint256 cantidad);
    event ClavePublicaConfigurada();
    event ConfiguracionFinalizada(uint256 timestamp);

    error ConfiguracionYaFinalizada();
    error CandidatosVacios();
    error ClavePublicaVacia();

    constructor(string memory _nombre, address _admin) Ownable(_admin) {
        nombreEleccion = _nombre;
        emit EleccionNombrada(_nombre);
    }

    modifier soloAntesDeFinalizar() {
        if (configuracionFinalizada) revert ConfiguracionYaFinalizada();
        _;
    }

    function configurarCandidatos(string[] calldata nuevosCandidatos) external onlyOwner soloAntesDeFinalizar {
        if (nuevosCandidatos.length == 0) revert CandidatosVacios();
        delete _candidatos;
        for (uint256 i = 0; i < nuevosCandidatos.length; i++) {
            _candidatos.push(nuevosCandidatos[i]);
        }
        emit CandidatosConfigurados(nuevosCandidatos.length);
    }

    function configurarClavePublica(bytes calldata clave) external onlyOwner soloAntesDeFinalizar {
        if (clave.length == 0) revert ClavePublicaVacia();
        clavePublicaEleccion = clave;
        emit ClavePublicaConfigurada();
    }

    function finalizarConfiguracion() external onlyOwner soloAntesDeFinalizar {
        if (_candidatos.length == 0) revert CandidatosVacios();
        if (clavePublicaEleccion.length == 0) revert ClavePublicaVacia();
        configuracionFinalizada = true;
        emit ConfiguracionFinalizada(block.timestamp);
    }

    function candidatos() external view returns (string[] memory) {
        return _candidatos;
    }

    function totalCandidatos() external view returns (uint256) {
        return _candidatos.length;
    }

    function candidato(uint256 indice) external view returns (string memory) {
        require(indice < _candidatos.length, "Indice invalido");
        return _candidatos[indice];
    }
}

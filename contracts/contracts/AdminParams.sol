// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

contract AdminParams is Ownable {
    string public nombreEleccion;
    string[] public candidatos;
    bytes public clavePublicaEleccion;
    bool public eleccionConfigurada = false;
    
    event CandidatosConfigurados(string[] candidatos);
    event ClavePublicaConfigurada(bytes clave);
    event EleccionConfigurada(string nombre);
    
    constructor(string memory _nombre, address initialOwner) Ownable(initialOwner) {
        nombreEleccion = _nombre;
        emit EleccionConfigurada(_nombre);
    }
    
    function configurarCandidatos(string[] memory _candidatos) external onlyOwner {
        require(!eleccionConfigurada, "La eleccion ya esta configurada");
        candidatos = _candidatos;
        emit CandidatosConfigurados(_candidatos);
    }
    
    function configurarClavePublica(bytes memory _clave) external onlyOwner {
        require(!eleccionConfigurada, "La eleccion ya esta configurada");
        clavePublicaEleccion = _clave;
        emit ClavePublicaConfigurada(_clave);
    }
    
    function finalizarConfiguracion() external onlyOwner {
        require(candidatos.length > 0, "No hay candidatos configurados");
        require(clavePublicaEleccion.length > 0, "No hay clave publica configurada");
        eleccionConfigurada = true;
    }
    
    function getCandidatosCount() external view returns (uint256) {
        return candidatos.length;
    }
    
    function getCandidato(uint256 index) external view returns (string memory) {
        require(index < candidatos.length, "Indice fuera de rango");
        return candidatos[index];
    }
}

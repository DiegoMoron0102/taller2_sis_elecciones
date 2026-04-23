// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

contract NullifierSet is Ownable {
    mapping(bytes32 => bool) private usados;
    mapping(bytes32 => bool) private elegibles;
    uint256 public totalElegibles = 0;
    uint256 public totalUsados = 0;
    
    event NullifiersRegistrados(bytes32[] nullifiers);
    event NullifierUtilizado(bytes32 indexed nullifier);
    
    modifier soloAdmin() {
        require(msg.sender == owner(), "Solo admin");
        _;
    }
    
    constructor(address initialOwner) Ownable(initialOwner) {}
    
    function registrarNullifiers(bytes32[] memory _nullifiers) external soloAdmin {
        for (uint256 i = 0; i < _nullifiers.length; i++) {
            bytes32 nullifier = _nullifiers[i];
            if (!elegibles[nullifier]) {
                elegibles[nullifier] = true;
                totalElegibles++;
            }
        }
        emit NullifiersRegistrados(_nullifiers);
    }
    
    function marcarUsado(bytes32 nullifier) external soloAdmin {
        require(elegibles[nullifier], "Nullifier no es elegible");
        require(!usados[nullifier], "Nullifier ya utilizado");
        
        usados[nullifier] = true;
        totalUsados++;
        emit NullifierUtilizado(nullifier);
    }
    
    function estaElegible(bytes32 nullifier) external view returns (bool) {
        return elegibles[nullifier];
    }
    
    function estaUsado(bytes32 nullifier) external view returns (bool) {
        return usados[nullifier];
    }
    
    function getStatus(bytes32 nullifier) external view returns (bool elegible, bool usado) {
        return (elegibles[nullifier], usados[nullifier]);
    }
    
    function getEstadisticas() external view returns (uint256 elegiblesCount, uint256 usadosCount, uint256 disponibles) {
        return (totalElegibles, totalUsados, totalElegibles - totalUsados);
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title DemoVoteNullifier
/// @notice Contrato de ejemplo para demostrar votación con nullifiers anónimos en testnet.
///         Pensado para Sepolia / Base Sepolia, pero sirve en cualquier red EVM.
contract DemoVoteNullifier {
    // --- Tipos y estado ---

    enum ElectionState { Setup, Open, Closed }

    struct Candidate {
        string name;
        uint256 votes;
    }

    address public admin;
    ElectionState public state;

    Candidate[] public candidates;

    // Conjunto de nullifiers válidos (elegibilidad).
    mapping(bytes32 => bool) public isEligibleNullifier;

    // Conjunto de nullifiers ya usados (prevención de doble voto).
    mapping(bytes32 => bool) public isUsedNullifier;

    // --- Eventos ---

    event NullifiersRegistered(uint256 count);
    event ElectionOpened();
    event ElectionClosed();
    event VoteCast(bytes32 indexed nullifier, uint256 indexed candidateIndex);
    event CandidateAdded(uint256 indexed index, string name);

    // --- Modificadores ---

    modifier onlyAdmin() {
        require(msg.sender == admin, "Solo el admin puede ejecutar esta funcion");
        _;
    }

    modifier inState(ElectionState expected) {
        require(state == expected, "La eleccion no esta en el estado esperado");
        _;
    }

    // --- Constructor ---

    /// @param _candidateNames Lista de nombres de candidatos.
    constructor(string[] memory _candidateNames) {
        admin = msg.sender;
        state = ElectionState.Setup;

        for (uint256 i = 0; i < _candidateNames.length; i++) {
            candidates.push(Candidate({name: _candidateNames[i], votes: 0}));
            emit CandidateAdded(i, _candidateNames[i]);
        }
    }

    // --- Funciones de administracion ---

    /// @notice Registrar un lote de nullifiers elegibles (hashes generados off-chain).
    /// @dev Cada nullifier es un bytes32 (keccak256 de un token secreto).
    function registerNullifiers(bytes32[] calldata nullifiers)
        external
        onlyAdmin
        inState(ElectionState.Setup)
    {
        for (uint256 i = 0; i < nullifiers.length; i++) {
            isEligibleNullifier[nullifiers[i]] = true;
        }
        emit NullifiersRegistered(nullifiers.length);
    }

    /// @notice Abrir la elección para emitir votos.
    function openElection()
        external
        onlyAdmin
        inState(ElectionState.Setup)
    {
        state = ElectionState.Open;
        emit ElectionOpened();
    }

    /// @notice Cerrar la elección. A partir de aquí ya no se aceptan votos.
    function closeElection()
        external
        onlyAdmin
        inState(ElectionState.Open)
    {
        state = ElectionState.Closed;
        emit ElectionClosed();
    }

    /// @notice Permite al admin añadir un nuevo candidato durante la fase de Setup.
    function addCandidate(string calldata name)
        external
        onlyAdmin
        inState(ElectionState.Setup)
    {
        candidates.push(Candidate({name: name, votes: 0}));
        emit CandidateAdded(candidates.length - 1, name);
    }

    // --- Funciones de votacion ---

    /// @notice Emitir un voto usando un nullifier anonimo.
    /// @param nullifier Hash del token secreto del votante (keccak256(token)).
    /// @param candidateIndex Indice del candidato en el arreglo `candidates`.
    function castVote(bytes32 nullifier, uint256 candidateIndex)
        external
        inState(ElectionState.Open)
    {
        require(isEligibleNullifier[nullifier], "Nullifier no registrado (no elegible)");
        require(!isUsedNullifier[nullifier], "Nullifier ya utilizado (doble voto)");
        require(candidateIndex < candidates.length, "Indice de candidato invalido");

        // Marcamos el nullifier como usado y sumamos el voto
        isUsedNullifier[nullifier] = true;
        candidates[candidateIndex].votes += 1;

        emit VoteCast(nullifier, candidateIndex);
    }

    // --- Funciones de consulta ---

    /// @notice Devuelve el numero de candidatos.
    function getCandidatesCount() external view returns (uint256) {
        return candidates.length;
    }

    /// @notice Devuelve los datos de un candidato.
    function getCandidate(uint256 index)
        external
        view
        returns (string memory name, uint256 votes)
    {
        require(index < candidates.length, "Indice fuera de rango");
        Candidate storage c = candidates[index];
        return (c.name, c.votes);
    }

    /// @notice Verifica si un nullifier existe y/o fue usado (para demos y tests).
    function getNullifierStatus(bytes32 nullifier)
        external
        view
        returns (bool eligible, bool used)
    {
        return (isEligibleNullifier[nullifier], isUsedNullifier[nullifier]);
    }
}

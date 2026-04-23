// Circuito ZK del sistema de votación descentralizada
// ------------------------------------------------------------
// Fase actual (Sprint 2): validación básica de nullifier
// Fase siguiente (Sprint 2 extendido): membership en Merkle tree
//
// El circuito demuestra:
//   - Conocimiento del par (nullifier, secret) asociado a un commitment
//   - El nullifier público corresponde a Poseidon(nullifier, secret)
//
// Sin revelar ni `secret` ni `nullifier`, solo el hash público `nullifier_hash`.

use std::hash::poseidon::bn254::hash_2;

fn main(
    // public inputs
    nullifier_hash: pub Field,
    // private inputs
    nullifier: Field,
    secret: Field,
) {
    let computed = hash_2([nullifier, secret]);
    assert(computed == nullifier_hash);
}

#[test]
fn test_nullifier_valido() {
    let secret: Field = 12345;
    let nullifier: Field = 67890;
    let hash = hash_2([nullifier, secret]);
    main(hash, nullifier, secret);
}

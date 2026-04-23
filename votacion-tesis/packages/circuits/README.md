# Circuitos Noir — Sistema de Votación Descentralizada

## Requisitos

- [Nargo](https://noir-lang.org/docs/getting_started/installation/) (compilador Noir)
- [bb](https://github.com/AztecProtocol/aztec-packages/tree/master/barretenberg) (Barretenberg backend)

## Circuito principal (`src/main.nr`)

Demuestra conocimiento del par `(nullifier, secret)` tal que `Poseidon(nullifier, secret) == nullifier_hash`, sin revelar los valores privados.

**Inputs**:
- Público: `nullifier_hash`
- Privados: `nullifier`, `secret`

## Comandos

```bash
# Compilar circuito
yarn compile           # equivalente a: nargo compile

# Ejecutar tests del circuito
yarn test              # equivalente a: nargo test

# Generar verification key
yarn vk

# Generar contrato Solidity Verifier a partir de la VK
yarn verifier
```

## Roadmap

- **v0.1 (actual)**: validación de nullifier Poseidon
- **v0.2 (Sprint 2 ext.)**: membresía en Lean Incremental Merkle Tree (prueba de elegibilidad)
- **v0.3 (Sprint 3)**: prueba de rango del candidato seleccionado

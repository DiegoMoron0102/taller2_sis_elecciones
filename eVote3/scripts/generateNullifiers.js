/**
 * Script para generar nullifiers (hashes keccak256) desde tokens secretos
 * Útil para testing y demos del contrato DemoVoteNullifier
 * 
 * Uso:
 *   node generateNullifiers.js
 *   node generateNullifiers.js 5  (genera 5 nullifiers)
 */

const crypto = require('crypto');

// Función para generar keccak256 (compatible con Solidity)
function keccak256(data) {
    return '0x' + crypto.createHash('sha3-256').update(data).digest('hex');
}

// Generar tokens aleatorios y sus nullifiers
function generateNullifiers(count = 3) {
    console.log('='.repeat(70));
    console.log('GENERADOR DE NULLIFIERS PARA DEMOVOTE');
    console.log('='.repeat(70));
    console.log();

    const nullifiers = [];
    const tokens = [];

    for (let i = 0; i < count; i++) {
        // Generar token secreto aleatorio
        const token = `voter-secret-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
        const nullifier = keccak256(token);
        
        tokens.push(token);
        nullifiers.push(nullifier);

        console.log(`Votante ${i + 1}:`);
        console.log(`  Token secreto: ${token}`);
        console.log(`  Nullifier (hash): ${nullifier}`);
        console.log();
    }

    console.log('='.repeat(70));
    console.log('ARRAY DE NULLIFIERS PARA REGISTRAR EN EL CONTRATO:');
    console.log('='.repeat(70));
    console.log(`[${nullifiers.map(n => `"${n}"`).join(', ')}]`);
    console.log();

    console.log('='.repeat(70));
    console.log('INSTRUCCIONES:');
    console.log('='.repeat(70));
    console.log('1. Copia el array de nullifiers de arriba');
    console.log('2. En Remix, llama a registerNullifiers() pegando el array');
    console.log('3. Guarda los tokens secretos para simular votantes');
    console.log('4. Para votar, usa el nullifier correspondiente a cada token');
    console.log();

    // Guardar en archivo para referencia
    const fs = require('fs');
    const output = {
        generated: new Date().toISOString(),
        voters: tokens.map((token, i) => ({
            id: i + 1,
            token: token,
            nullifier: nullifiers[i]
        })),
        contractArray: nullifiers
    };

    fs.writeFileSync('nullifiers-output.json', JSON.stringify(output, null, 2));
    console.log('✓ Datos guardados en: nullifiers-output.json');
    console.log();
}

// Ejecutar
const count = parseInt(process.argv[2]) || 3;
generateNullifiers(count);

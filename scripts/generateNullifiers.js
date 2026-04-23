const crypto = require('crypto');

function generateNullifier(secret) {
    // Generar hash SHA-256 del secreto para usar como nullifier
    return crypto.createHash('sha256').update(secret).digest('hex');
}

function generateSecureRandom(length = 32) {
    return crypto.randomBytes(length).toString('hex');
}

function generateVoterNullifiers(count) {
    const voters = [];
    
    for (let i = 1; i <= count; i++) {
        const secret = `voter-secret-${Date.now()}-${i}-${generateSecureRandom(8)}`;
        const nullifier = generateNullifier(secret);
        
        voters.push({
            id: i,
            secret: secret,
            nullifier: '0x' + nullifier
        });
    }
    
    return voters;
}

function main() {
    const args = process.argv.slice(2);
    const voterCount = parseInt(args[0]) || 5;
    
    console.log(`🗳️ Generando ${voterCount} nullifiers para votantes...\n`);
    
    const voters = generateVoterNullifiers(voterCount);
    
    // Mostrar información detallada
    voters.forEach(voter => {
        console.log(`Votante ${voter.id}:`);
        console.log(`  🔑 Token secreto: ${voter.secret}`);
        console.log(`  🎯 Nullifier (hash): ${voter.nullifier}`);
        console.log('');
    });
    
    // Generar array para registro en contrato
    const nullifiersArray = voters.map(v => v.nullifier);
    
    console.log('=== ARRAY PARA REGISTRAR EN CONTRATO ===');
    console.log(JSON.stringify(nullifiersArray, null, 2));
    console.log('\n');
    
    // Guardar en archivo
    const fs = require('fs');
    const data = {
        timestamp: new Date().toISOString(),
        voterCount: voterCount,
        voters: voters,
        nullifiersArray: nullifiersArray
    };
    
    fs.writeFileSync('nullifiers.json', JSON.stringify(data, null, 2));
    console.log('✅ Datos guardados en nullifiers.json');
    console.log('\n⚠️  IMPORTANTE: Guarda los tokens secretos en un lugar seguro.');
    console.log('   Los necesitarás para simular los votos.');
}

if (require.main === module) {
    main();
}

module.exports = { generateNullifier, generateVoterNullifiers };

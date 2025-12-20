
import { fetchAddressByCEP } from './src/services/cepService.js';

async function test() {
    try {
        console.log('Testing CEP 15600-000 (Fernandaopolis General - might not have street)');
        // Fernandopolis General CEP often doesn't have street.
        // Let's try a specific street CEP if possible, or just see structure.
        // Actually 15600-000 is generic for the whole city probably? 
        // Let's try a specific one: 01001-000 (Praça da Sé)

        console.log('Testing CEP 01001-000 (Praça da Sé)...');
        const data = await fetchAddressByCEP('01001000');
        console.log('Result:', data);

        if (data.street && data.neighborhood) {
            console.log('✅ Success: Street and Neighborhood returned.');
        } else {
            console.log('⚠️ Warning: Missing fields.');
        }

    } catch (e) {
        console.error('Error:', e);
    }
}

test();

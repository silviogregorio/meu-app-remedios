/**
 * CEP Service - Handles address fetching
 * Priority: ViaCEP (Guaranteed IBGE Code 7 digits)
 * Fallback: BrasilAPI (Faster, but sometimes different IBGE key)
 */

export const fetchAddressByCEP = async (cep) => {
    // Remove non-digits
    const cleanCep = cep.replace(/\D/g, '');

    if (cleanCep.length !== 8) {
        throw new Error('CEP deve ter 8 dígitos');
    }

    // LIST OF PROVIDERS
    // We need IBGE code essential for the "City Exclusivity" feature.
    // ViaCEP is the gold standard for easy IBGE codes.

    try {
        // 1. Primary: ViaCEP (Best for IBGE)
        console.log('🔍 Fetching CEP from ViaCEP:', cleanCep);
        const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);

        if (!response.ok) {
            throw new Error(`ViaCEP HTTP error: ${response.status}`);
        }

        const data = await response.json();

        if (data.erro) {
            throw new Error('CEP_NOT_FOUND');
        }

        return {
            cep: data.cep.replace(/\D/g, ''),
            city: data.localidade,
            state: data.uf,
            street: data.logradouro,
            neighborhood: data.bairro,
            ibge: data.ibge // 7 digit code
        };
    } catch (viacepError) {
        if (viacepError.message === 'CEP_NOT_FOUND') {
            throw new Error('CEP não encontrado. Verifique os números informados.');
        }

        console.warn('ViaCEP failed or network issue, trying BrasilAPI...', viacepError);

        try {
            // 2. Fallback: BrasilAPI
            const response = await fetch(`https://brasilapi.com.br/api/cep/v2/${cleanCep}`);

            if (!response.ok) {
                // Try v1 if v2 fails (some CEPs might have issues in v2)
                const responseV1 = await fetch(`https://brasilapi.com.br/api/cep/v1/${cleanCep}`);
                if (!responseV1.ok) throw new Error('CEP_NOT_FOUND_ALT');

                const dataV1 = await responseV1.json();
                return {
                    cep: dataV1.cep.replace(/\D/g, ''),
                    city: dataV1.city,
                    state: dataV1.state,
                    street: dataV1.street,
                    neighborhood: dataV1.neighborhood,
                    ibge: null // v1 doesn't usually have IBGE
                };
            }

            const data = await response.json();

            // BrasilAPI v2 returns 'city' and 'state'
            return {
                cep: data.cep.replace(/\D/g, ''),
                city: data.city,
                state: data.state,
                street: data.street,
                neighborhood: data.neighborhood,
                ibge: data.location?.city_ibge || null // Try to get from location metadata if available
            };
        } catch (brasilError) {
            if (brasilError.message === 'CEP_NOT_FOUND_ALT') {
                throw new Error('CEP não encontrado em nenhuma base oficial.');
            }
            throw new Error('Erro ao buscar CEP. Verifique sua conexão com a internet.');
        }
    }
};

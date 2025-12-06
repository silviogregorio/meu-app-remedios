export const api = {
    fetchAddressByCep: async (cep) => {
        try {
            const cleanCep = cep.replace(/\D/g, '');
            if (cleanCep.length !== 8) throw new Error('CEP inválido');

            const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
            const data = await response.json();

            if (data.erro) throw new Error('CEP não encontrado');

            return {
                street: data.logradouro,
                neighborhood: data.bairro,
                city: data.localidade,
                state: data.uf,
                zipCode: data.cep
            };
        } catch (error) {
            console.error('Erro ao buscar CEP:', error);
            throw error;
        }
    },

    login: async (email, password) => {
        // Mock login
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                if (email && password) {
                    resolve({
                        id: '1',
                        name: 'Usuário Demo',
                        email: email,
                        avatar: 'https://ui-avatars.com/api/?name=Usuario+Demo&background=10b981&color=fff'
                    });
                } else {
                    reject(new Error('Credenciais inválidas'));
                }
            }, 1000);
        });
    }
};

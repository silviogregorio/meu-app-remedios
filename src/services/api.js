// Use environment variable if available (good for Vercel pointing to VPS)
// Otherwise fallback to relative path (good for Nginx proxy or Vite proxy)
const BACKEND_URL = import.meta.env.VITE_API_URL || '/api';

export const api = {
    // Send email via backend
    sendSupportEmail: async ({ subject, text, senderName, senderEmail, token }) => {
        try {
            const headers = {
                'Content-Type': 'application/json',
            };

            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch(`${BACKEND_URL}/send-email`, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({
                    // For now, sending TO myself (admin) or a dedicated support email
                    // In a real app, this would be an env var like SUPPORT_EMAIL
                    to: 'suporte@sigremedios.com', // Fake support email, backend will handle or use configured SMTP
                    subject: subject,
                    text: text,
                    senderName: senderName,
                    senderEmail: senderEmail,
                    type: 'contact' // Changed to 'contact' to match allowed type in backend
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Erro ao enviar email');
            }

            return await response.json();
        } catch (error) {
            console.error('API sendSupportEmail error:', error);
            throw error;
        }
    },

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


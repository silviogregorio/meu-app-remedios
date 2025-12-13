import React, { useEffect, useRef } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';

const OnboardingTour = ({ onTourEnd }) => {
    const onTourEndRef = useRef(onTourEnd);
    const driverRef = useRef(null);

    useEffect(() => {
        onTourEndRef.current = onTourEnd;
    }, [onTourEnd]);

    useEffect(() => {
        console.log('[OnboardingTour] Mounted. Initializing detailed driver...');

        const steps = [
            {
                element: '#tour-welcome',
                popover: {
                    title: 'Painel Principal (Home) 🏠',
                    description: 'Esta é sua tela de controle diário. Aqui você vê o resumo do dia e o que precisa tomar agora.',
                    side: "bottom",
                    align: 'start'
                }
            },
            // ... (keep previous Home steps)
            {
                element: '.md\\:col-span-2', // Next Dose Card
                popover: {
                    title: 'Próxima Dose ⏰',
                    description: 'O destaque principal sempre será o próximo remédio. O sistema calcula isso sozinho baseado nos horários que você cadastrou.',
                    side: "top"
                }
            },
            {
                element: '#tour-schedule-list',
                popover: {
                    title: 'Lista de Hoje 📝',
                    description: 'Aqui ficam todos os remédios do dia. Clique no "check" ou use o comando de voz para marcar como tomado.',
                    side: "top"
                }
            },
            // MENU TOGGLE STEP
            {
                element: '#header-menu-toggle',
                popover: {
                    title: 'Menu de Opções ☰',
                    description: 'Clique aqui (ou se já estiver aberto ao lado) para acessar os cadastros do sistema.',
                    side: "bottom"
                },
                onNextClick: () => {
                    // Tenta abrir o menu se estiver fechado (verificando se o sidebar está visível)
                    // Como é difícil saber o estado visual exato, vamos forçar um clique se estiver no mobile/fechado
                    const sidebar = document.querySelector('aside');
                    const isClosed = sidebar && sidebar.classList.contains('-translate-x-full');

                    if (isClosed) {
                        document.getElementById('header-menu-toggle')?.click();
                        // Pequeno delay para animação antes do próximo passo
                        return new Promise(resolve => setTimeout(resolve, 300));
                    }
                }
            },
            // SIDEBAR STEPS
            {
                element: '#tour-nav-patients',
                popover: {
                    title: '1. Pacientes 👥',
                    description: 'O começo de tudo. Aqui você cadastra quem vai tomar os remédios (você mesmo, seu pai, mãe, filhos...).',
                    side: "right"
                }
            },
            {
                element: '#tour-nav-medications',
                popover: {
                    title: '2. Medicamentos 💊',
                    description: 'Cadastro das caixinhas. Você coloca o nome, a dosagem (mg/ml) e quantos comprimidos vêm na caixa (para o controle de estoque).',
                    side: "right"
                }
            },
            {
                element: '#tour-nav-prescriptions',
                popover: {
                    title: '3. Prescrições (Receitas) 📄',
                    description: 'Aqui é a inteligência. Você cruza o PACIENTE com o MEDICAMENTO e diz os horários. Ex: "Tomar Dipirona a cada 6h por 5 dias". O sistema gera a agenda sozinho a partir disso.',
                    side: "right"
                }
            },
            {
                element: '#tour-nav-diary',
                popover: {
                    title: '4. Diário de Saúde ❤️',
                    description: 'Anote sintomas, pressão, glicemia ou como está se sentindo. Útil para mostrar ao médico na próxima consulta.',
                    side: "right"
                }
            },
            {
                element: '#tour-nav-reports',
                popover: {
                    title: '5. Relatórios 📈',
                    description: 'Histórico completo. Veja se o paciente tomou tudo certinho no mês passado, imprima a lista para levar na consulta ou gere PDFs.',
                    side: "right"
                }
            },
            {
                element: '#tour-nav-share',
                popover: {
                    title: '6. Compartilhar Acesso 🔗',
                    description: 'Tem um cuidador ou familiar ajudando? Convide-os por e-mail aqui. Eles poderão instalar o App e ajudar a marcar os remédios também.',
                    side: "right"
                }
            },
            {
                element: '#tour-nav-profile',
                popover: {
                    title: '7. Seu Perfil 👤',
                    description: 'Seus dados de conta, troca de senha e configurações pessoais.',
                    side: "right"
                }
            }
        ];

        driverRef.current = driver({
            showProgress: true,
            animate: true,
            allowClose: true,
            nextBtnText: 'Próximo →',
            prevBtnText: '← Voltar',
            doneBtnText: 'Concluir Tour',
            steps: steps,
            onDestroyed: () => {
                if (onTourEndRef.current) {
                    onTourEndRef.current();
                }
                driverRef.current = null;
            }
        });

        driverRef.current.drive();

        return () => {
            if (driverRef.current) {
                driverRef.current.destroy();
                driverRef.current = null;
            }
        };
    }, []);

    return null;
};

export default OnboardingTour;

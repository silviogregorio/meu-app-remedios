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
        console.log('[OnboardingTour] Mounted. Initializing robust driver...');

        // Helper function to ensure sidebar is open
        const ensureSidebarOpen = async () => {
            const sidebar = document.querySelector('aside');
            const isClosed = sidebar && sidebar.classList.contains('-translate-x-full');

            if (isClosed) {
                console.log('[Tour] Force opening sidebar...');
                document.getElementById('header-menu-toggle')?.click();
                // Wait for animation
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        };

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
            // Conditional Steps
            ...(document.querySelector('.bg-amber-50') ? [{
                element: '.bg-amber-50',
                popover: { title: 'Alerta de Estoque ⚠️', description: 'Medicamentos acabando.', side: "bottom" }
            }] : []),
            ...(document.querySelector('.bg-blue-50') ? [{
                element: '.bg-blue-50',
                popover: { title: 'Notificações 🔔', description: 'Ative alertas no celular.', side: "bottom" }
            }] : []),
            {
                element: '.md\\:col-span-2', // Next Dose Card
                popover: {
                    title: 'Próxima Dose ⏰',
                    description: 'O destaque principal sempre será o próximo remédio.',
                    side: "top"
                }
            },
            {
                element: '#tour-summary-card',
                popover: {
                    title: 'Seu Progresso 📊',
                    description: 'Acompanhe quantos remédios já foram tomados hoje.',
                    side: "top"
                }
            },
            {
                element: '#tour-schedule-list',
                popover: {
                    title: 'Lista de Hoje 📝',
                    description: 'Lista completa do dia para marcar como tomado.',
                    side: "top"
                }
            },
            // Voice
            ...(document.querySelector('button[className*="fixed bottom-6"]') ? [{
                element: 'button[className*="fixed bottom-6"]',
                popover: { title: 'Comando de Voz 🎙️', description: 'Fale para marcar seus remédios.', side: "left" }
            }] : []),

            // MENU TOGGLE
            {
                element: '#header-menu-toggle',
                popover: {
                    title: 'Menu de Opções ☰',
                    description: 'Vamos explorar o menu lateral agora. Clique em "Próximo" que eu abro para você.',
                    side: "bottom"
                }
            },
            // SIDEBAR STEPS (All enforce sidebar open)
            {
                element: '#tour-nav-patients',
                onHighlightStarted: ensureSidebarOpen,
                popover: {
                    title: '1. Pacientes 👥',
                    description: 'Cadastro de quem vai tomar os remédios.',
                    side: "right"
                }
            },
            {
                element: '#tour-nav-medications',
                onHighlightStarted: ensureSidebarOpen,
                popover: {
                    title: '2. Medicamentos 💊',
                    description: 'Cadastro de caixas, dosagens e estoque.',
                    side: "right"
                }
            },
            {
                element: '#tour-nav-prescriptions',
                onHighlightStarted: ensureSidebarOpen,
                popover: {
                    title: '3. Prescrições 📄',
                    description: 'Onde você cria a agenda (Paciente + Remédio + Horários).',
                    side: "right"
                }
            },
            {
                element: '#tour-nav-diary',
                onHighlightStarted: ensureSidebarOpen,
                popover: {
                    title: '4. Diário de Saúde ❤️',
                    description: 'Anote sintomas e histórico de saúde.',
                    side: "right"
                }
            },
            {
                element: '#tour-nav-reports',
                onHighlightStarted: ensureSidebarOpen,
                popover: {
                    title: '5. Relatórios 📈',
                    description: 'Histórico de uso e impressão.',
                    side: "right"
                }
            },
            {
                element: '#tour-nav-share',
                onHighlightStarted: ensureSidebarOpen,
                popover: {
                    title: '6. Compartilhar 🔗',
                    description: 'Convide familiares/cuidadores.',
                    side: "right"
                }
            },
            {
                element: '#tour-nav-profile',
                onHighlightStarted: ensureSidebarOpen,
                popover: {
                    title: '7. Perfil 👤',
                    description: 'Configurações da sua conta.',
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
            doneBtnText: 'Concluir',
            steps: steps,
            onDestroyed: () => {
                const sidebar = document.querySelector('aside');
                // Optional: Close sidebar when tour ends if we forced it open? 
                // Better leave it open so user can use it.
                if (onTourEndRef.current) {
                    onTourEndRef.current();
                }
                driverRef.current = null;
            }
        });

        // Small delay to ensure render
        setTimeout(() => driverRef.current.drive(), 100);

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

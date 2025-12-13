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
                    title: 'Bem-vindo ao SiG Remédios! 👋',
                    description: 'Este é o seu painel principal. Aqui você tem uma visão geral de todo o tratamento e o que precisa ser feito hoje.',
                    side: "bottom",
                    align: 'start'
                }
            },
            {
                element: 'button[title="Ajuda / Tour"]',
                popover: {
                    title: 'Precisa de Ajuda?',
                    description: 'Clique neste botão a qualquer momento para ver este tutorial novamente.',
                    side: "left",
                    align: 'center'
                }
            }
        ];

        // Conditional Steps
        if (document.querySelector('.bg-amber-50')) { // Low Stock Alert
            steps.push({
                element: '.bg-amber-50',
                popover: {
                    title: 'Alerta de Estoque Baixo ⚠️',
                    description: 'Fique atento! Este cartão aparece quando algum medicamento está perto de acabar (menos de 3 dias).',
                    side: "bottom"
                }
            });
        }

        if (document.querySelector('.bg-blue-50')) { // Notification Request
            steps.push({
                element: ('.bg-blue-50'),
                popover: {
                    title: 'Ative as Notificações 🔔',
                    description: 'Para receber lembretes no celular, clique em "Ativar" aqui.',
                    side: "bottom"
                }
            });
        }

        // Main Cards
        steps.push({
            element: '.md\\:col-span-2', // The big blue Next Dose card
            popover: {
                title: 'Próxima Dose 💊',
                description: 'Este é o cartão mais importante. Ele mostra qual é o PRÓXIMO medicamento que deve ser tomado, o horário e quem deve tomar.',
                side: "top"
            }
        });

        steps.push({
            element: '#tour-summary-card',
            popover: {
                title: 'Seu Progresso de Hoje 📊',
                description: 'Acompanhe quantos remédios já foram tomados hoje e quantos faltam. Tente manter 100%!',
                side: "top"
            }
        });

        // Filters
        steps.push({
            element: '.border-l-primary', // Filter Card
            popover: {
                title: 'Filtros e Agenda 🔍',
                description: 'Use estes filtros para ver datas futuras, filtrar por paciente específico ou ver histórico. Você também pode baixar a agenda clicando em "Exportar".',
                side: "top"
            }
        });

        // Schedule List
        steps.push({
            element: '#tour-schedule-list',
            popover: {
                title: 'Lista de Medicamentos do Dia 📝',
                description: 'Aqui está a lista completa de hoje. \n\n➡️ Clique no botão redondo ao lado do remédio para marcar como "Tomado" ✅.\n➡️ Se errou, clique de novo para desmarcar.',
                side: "top"
            }
        });

        // Voice
        if (document.querySelector('button[className*="fixed bottom-6"]')) {
            steps.push({
                element: 'button[className*="fixed bottom-6"]',
                popover: {
                    title: 'Comando de Voz 🎙️',
                    description: 'Não quer digitar? Clique no microfone e diga "Tomei o Omeprazol" para o sistema marcar sozinho.',
                    side: "left"
                }
            });
        }

        // Sidebar Navigation (Generic pointer to left side)
        if (document.querySelector('nav') || document.querySelector('aside')) {
            steps.push({
                element: document.querySelector('aside') ? 'aside' : 'nav', // Try to grab sidebar
                popover: {
                    title: 'Menu Principal ☰',
                    description: 'Use o menu lateral para cadastrar novos **Pacientes**, adicionar **Medicamentos**, ver **Relatórios** completos e configurar seu **Perfil**.',
                    side: "right"
                }
            });
        }

        driverRef.current = driver({
            showProgress: true,
            animate: true,
            allowClose: true,
            nextBtnText: 'Próximo →',
            prevBtnText: '← Voltar',
            doneBtnText: 'Entendi, começar!',
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

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
        console.log('[OnboardingTour] Mounted. Initializing detailed content driver...');

        const ensureSidebarOpen = async () => {
            const sidebar = document.querySelector('aside');
            const isClosed = sidebar && sidebar.classList.contains('-translate-x-full');

            if (isClosed) {
                document.getElementById('header-menu-toggle')?.click();
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        };

        const steps = [
            {
                element: '#tour-welcome',
                popover: {
                    title: 'Bem-vindo ao SiG Remédios! 👋',
                    description: 'Que bom ter você aqui! Este sistema foi criado para tirar a preocupação da sua cabeça. \n\nNesta tela inicial (o "Dashboard"), nós filtramos tudo e mostramos **apenas o que importa para hoje**. Você não precisa procurar nada, o sistema traz a informação até você.',
                    side: "bottom",
                    align: 'start'
                }
            },
            // Conditional Alerts
            ...(document.querySelector('.bg-amber-50') ? [{
                element: '.bg-amber-50',
                popover: {
                    title: '⚠️ Controle de Estoque',
                    description: 'O sistema monitora quantas pílulas restam. Quando aparecer este aviso amarelo, significa que um remédio está acabando (menos de 3 dias). É hora de comprar mais!',
                    side: "bottom"
                }
            }] : []),
            ...(document.querySelector('.bg-blue-50') ? [{
                element: '.bg-blue-50',
                popover: {
                    title: '🔔 Não Esqueça de Nada',
                    description: 'Para receber avisos no seu celular (mesmo com o app fechado), ative as notificações aqui. Nós avisaremos 5 minutos antes de cada dose.',
                    side: "bottom"
                }
            }] : []),

            {
                element: '.md\\:col-span-2',
                popover: {
                    title: '⏰ A Próxima Dose',
                    description: 'Este é o coração da tela inicial. O sistema calcula automaticamente qual é o **próximo** compromisso, quem deve tomar e o horário.\n\nFica verde quando está liberado para tomar. Se estiver vermelho, está atrasado!',
                    side: "top"
                }
            },
            {
                element: '#tour-summary-card',
                popover: {
                    title: '📊 Seu Resultado do Dia',
                    description: 'Uma visão rápida de adesão. Tente manter este círculo sempre em 100% todos os dias.\nIsso ajuda você e o médico a saberem se o tratamento está sendo seguido à risca.',
                    side: "top"
                }
            },
            {
                element: '#tour-schedule-list',
                popover: {
                    title: '📝 Lista Completa de Hoje',
                    description: 'Aqui está a agenda completa do dia, do momento que acorda até a hora de dormir.\n\n✅ **Para marcar como tomado:** Basta clicar no círculo ao lado do nome do remédio.\n❌ **Errou?** Clique de novo para desmarcar.',
                    side: "top"
                }
            },

            // MENU
            {
                element: '#header-menu-toggle',
                popover: {
                    title: '☰ Menu Principal',
                    description: 'Agora vamos conhecer as ferramentas de cadastro. Clique em Próximo para abrir o menu lateral.',
                    side: "bottom"
                }
            },

            // SIDEBAR ITEMS
            {
                element: '#tour-nav-patients',
                onHighlightStarted: ensureSidebarOpen,
                popover: {
                    title: '1. Pacientes (Pessoas) 👥',
                    description: 'O SiG Remédios é multi-usuário. Aqui você cadastra **quem** vai tomar os remédios.\nPode ser você, seu pai, sua mãe, ou até um filho.\n\nCada paciente tem seu próprio histórico e agenda separados.',
                    side: "right"
                }
            },
            {
                element: '#tour-nav-medications',
                onHighlightStarted: ensureSidebarOpen,
                popover: {
                    title: '2. Medicamentos (Estoque) 💊',
                    description: 'Aqui você cadastra as **caixinhas** de remédio.\nInforme o nome, a dosagem (ex: 50mg) e quantos comprimidos vêm na caixa.\n\nAssim, o sistema consegue descontar do estoque a cada dose tomada e te avisar quando precisa comprar.',
                    side: "right"
                }
            },
            {
                element: '#tour-nav-prescriptions',
                onHighlightStarted: ensureSidebarOpen,
                popover: {
                    title: '3. Prescrições (O Cérebro) 🧠',
                    description: 'Esta é a parte mais importante. Aqui você cria a "Receita Digital".\n\nVocê escolhe o **Paciente**, seleciona o **Medicamento** e diz a regra:\nEx: "Tomar de 8 em 8 horas por 10 dias".\n\nO sistema gera toda a agenda futura automaticamente baseada nisso.',
                    side: "right"
                }
            },
            {
                element: '#tour-nav-diary',
                onHighlightStarted: ensureSidebarOpen,
                popover: {
                    title: '4. Diário de Saúde ❤️',
                    description: 'O médico sempre pergunta: "Teve febre? Dor? Como estava a pressão?".\n\nUse esta tela para anotar sintomas, medições de pressão/glicemia e sentimentos.\nFica tudo salvo com data e hora para mostrar na consulta.',
                    side: "right"
                }
            },
            {
                element: '#tour-nav-reports',
                onHighlightStarted: ensureSidebarOpen,
                popover: {
                    title: '5. Relatórios Completos 📈',
                    description: 'Precisa levar a lista para o médico?\nAqui você gera PDFs elegantes com todo o histórico de uso, adesão e anotações do diário.\nÉ a prova de que o tratamento foi seguido.',
                    side: "right"
                }
            },
            {
                element: '#tour-nav-share',
                onHighlightStarted: ensureSidebarOpen,
                popover: {
                    title: '6. Cuidadores e Familiares 🔗',
                    description: 'Cuidar de alguém sozinho é difícil. Convide ajuda!\n\nEnvie um convite por e-mail para um filho ou cuidador. Eles poderão acessar o app no celular deles e ajudar a marcar os remédios ou registrar sintomas.',
                    side: "right"
                }
            },
            {
                element: '#tour-nav-profile',
                onHighlightStarted: ensureSidebarOpen,
                popover: {
                    title: '7. Seu Perfil 👤',
                    description: 'Gerencie sua senha, seus dados pessoais e preferências do sistema aqui.',
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

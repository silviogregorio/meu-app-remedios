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
        // console.log('[OnboardingTour] Mounted. Initializing detailed content driver...');

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
            {
                element: '#tour-search-btn',
                popover: {
                    title: '🔍 Buscar Bula Simplificada',
                    description: 'Dúvidas sobre um remédio? Clique aqui, fale ou digite o nome e veja para que serve e os cuidados. Tudo seguro e rápido.',
                    side: "bottom"
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
                    description: 'Organizamos tudo em 3 partes para facilitar sua vida!\n\nClique em **Próximo** para ver como ficou fácil navegar.',
                    side: "bottom"
                }
            },

            // --- GRUPO: CADASTROS (A Base de Tudo) ---
            {
                element: '#tour-nav-patients',
                onHighlightStarted: ensureSidebarOpen,
                popover: {
                    title: '1. Comece Por Aqui: Pessoas 👥',
                    description: 'Na seção **Cadastros**, o primeiro passo é dizer **QUEM** vai usar.\n\nCadastre aqui você, seu pai, sua mãe... \nO sistema separa a lista de cada um, para ninguém tomar remédio trocado.',
                    side: "right"
                }
            },
            {
                element: '#tour-nav-medications',
                onHighlightStarted: ensureSidebarOpen,
                popover: {
                    title: '2. Seu Estoque (Caixinhas) 💊',
                    description: 'Agora, cadastre os remédios que você tem em casa.\n\n✨ **Novidade:** Você escolhe a **Cor** e o **Formato** (redondo, cápsula) para ficar igualzinho ao real. Ajuda muito a não confundir!',
                    side: "right"
                }
            },
            {
                element: '#tour-nav-prescriptions',
                onHighlightStarted: ensureSidebarOpen,
                popover: {
                    title: '3. A Receita Médica (O Cérebro) 🧠',
                    description: 'É aqui que a mágica acontece. Você junta a **Pessoa** com o **Remédio** e diz o horário.\n\nExemplo: "Pai" toma "Dipirona" de 8 em 8 horas.\nPronto! O sistema monta a agenda sozinho.',
                    side: "right"
                }
            },

            // --- GRUPO: DIA A DIA (Uso Diário) ---
            {
                element: '#tour-nav-diary',
                onHighlightStarted: ensureSidebarOpen,
                popover: {
                    title: '4. Diário de Saúde ❤️',
                    description: 'Na seção **Dia a Dia**, use esta tela sempre que sentir algo diferente.\n\nTeve dor de cabeça? A pressão subiu? Anote aqui. \nO sistema guarda tudo com data e hora.',
                    side: "right"
                }
            },
            {
                element: '#tour-nav-reports',
                onHighlightStarted: ensureSidebarOpen,
                popover: {
                    title: '5. Relatórios para o Médico 📄',
                    description: 'Seu médico pediu um resumo?\n\nEle gera um **PDF Completo** mostrando se você tomou os remédios direitinho e o que sentiu no mês.\nÉ só imprimir ou mandar no Zap do doutor.',
                    side: "right"
                }
            },

            // --- GRUPO: SISTEMA (Configurações) ---
            {
                element: '#tour-nav-share',
                onHighlightStarted: ensureSidebarOpen,
                popover: {
                    title: '6. Acesso Geral (Cuidadores) 🔐',
                    description: 'Precisa que uma enfermeira ou filho cuide de tudo?\n\nAdicione o e-mail dela aqui. Ela terá acesso total para ajudar a gerenciar as receitas e estoques.',
                    side: "right"
                }
            },
            {
                element: '#tour-nav-profile',
                onHighlightStarted: ensureSidebarOpen,
                popover: {
                    title: '7. Segurança dos Dados 💾',
                    description: 'Aqui você altera sua senha e faz **Backup**.\n\nRecomendamos baixar uma cópia dos seus dados de vez em quando para o seu celular. É seguro e garantido.',
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

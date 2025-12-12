import React, { useEffect } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';

const OnboardingTour = () => {
    useEffect(() => {
        const hasSeenTour = localStorage.getItem('hasSeenTour_v1');

        if (!hasSeenTour) {
            const driverObj = driver({
                showProgress: true,
                animate: true,
                nextBtnText: 'Próximo ->',
                prevBtnText: 'Anterior',
                doneBtnText: 'Entendi!',
                steps: [
                    {
                        element: '#tour-welcome',
                        popover: {
                            title: 'Bem-vindo ao SiG Remédios! 👋',
                            description: 'Que bom ter você aqui! Vamos fazer um tour rapidinho para você não se perder?',
                            side: "bottom",
                            align: 'start'
                        }
                    },
                    {
                        element: '#tour-nav-patients',
                        popover: {
                            title: '1º Passo: Quem vai tomar?',
                            description: 'Clique aqui em "Pacientes" para adicionar você ou quem você cuida.',
                            side: "right",
                            align: 'start'
                        }
                    },
                    {
                        element: '#tour-nav-medications',
                        popover: {
                            title: '2º Passo: O Remédio',
                            description: 'Aqui em "Medicamentos" você cadastra a caixinha, a dose e o estoque.',
                            side: "right",
                            align: 'start'
                        }
                    },
                    {
                        element: '#tour-schedule-list',
                        popover: {
                            title: 'Sua Agenda Diária 📅',
                            description: 'Tudo o que você precisa tomar hoje vai aparecer nesta lista. É só clicar no botão de "check" ✅ quando tomar.',
                            side: "top",
                            align: 'start'
                        }
                    }
                ],
                onDestroyed: () => {
                    localStorage.setItem('hasSeenTour_v1', 'true');
                }
            });

            // Small delay to ensure elements are rendered
            setTimeout(() => {
                driverObj.drive();
            }, 1000);
        }
    }, []);

    return null; // This component doesn't render anything visible
};

export default OnboardingTour;

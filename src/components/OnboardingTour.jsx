import React, { useEffect } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';

const OnboardingTour = ({ forceStart, onTourEnd }) => {
    useEffect(() => {
        const hasSeenTour = localStorage.getItem('hasSeenTour_v1');
        console.log('[OnboardingTour] Checking status. Seen?', hasSeenTour, 'Force?', forceStart);

        if (!hasSeenTour || forceStart) {
            console.log('[OnboardingTour] Initializing driver...');

            // Build steps dynamically based on what's visible
            const steps = [
                {
                    element: '#tour-welcome',
                    popover: {
                        title: 'Bem-vindo ao SiG Remédios! 👋',
                        description: 'Que bom ter você aqui! Vamos fazer um tour rapidinho para você não se perder?',
                        side: "bottom",
                        align: 'start'
                    }
                }
            ];

            // Only add Sidebar steps if visible (Desktop) or valid
            if (document.querySelector('#tour-nav-patients')) {
                steps.push({
                    element: '#tour-nav-patients',
                    popover: {
                        title: '1º Passo: Quem vai tomar?',
                        description: 'Clique aqui em "Pacientes" para adicionar você ou quem você cuida.',
                        side: "right",
                        align: 'start'
                    }
                });
            }

            if (document.querySelector('#tour-nav-medications')) {
                steps.push({
                    element: '#tour-nav-medications',
                    popover: {
                        title: '2º Passo: O Remédio',
                        description: 'Aqui em "Medicamentos" você cadastra a caixinha, a dose e o estoque.',
                        side: "right",
                        align: 'start'
                    }
                });
            }

            // Always add main list
            steps.push({
                element: '#tour-schedule-list',
                popover: {
                    title: 'Sua Agenda Diária 📅',
                    description: 'Tudo o que você precisa tomar hoje vai aparecer nesta lista. É só clicar no botão de "check" ✅ quando tomar.',
                    side: "top",
                    align: 'start'
                }
            });

            const driverObj = driver({
                showProgress: true,
                animate: true,
                nextBtnText: 'Próximo ->',
                prevBtnText: 'Anterior',
                doneBtnText: 'Entendi!',
                steps: steps,
                onDestroyed: () => {
                    localStorage.setItem('hasSeenTour_v1', 'true');
                    if (onTourEnd) onTourEnd();
                }
            });

            // Small delay to ensure elements are rendered
            const timer = setTimeout(() => {
                console.log('[OnboardingTour] Starting drive. Steps:', steps.length);
                driverObj.drive();
            }, 1000);

            return () => {
                clearTimeout(timer);
                driverObj.destroy();
            };
        }
    }, [forceStart, onTourEnd]);

    return null;
};

export default OnboardingTour;

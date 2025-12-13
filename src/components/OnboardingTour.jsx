import React, { useEffect, useRef } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';

const OnboardingTour = ({ forceStart, onTourEnd }) => {
    // Keep a stable ref to the callback
    const onTourEndRef = useRef(onTourEnd);
    // Keep track of the driver instance to prevent duplicates
    const driverRef = useRef(null);
    // Track if component is mounted to prevent async state updates
    const isMounted = useRef(true);

    useEffect(() => {
        onTourEndRef.current = onTourEnd;
    }, [onTourEnd]);

    useEffect(() => {
        // If driver is already active, don't restart it
        if (driverRef.current) {
            return;
        }

        const hasSeenTour = localStorage.getItem('hasSeenTour_v1');

        // Logic: ONLY start if not seen OR forced.
        if (!hasSeenTour || forceStart) {
            console.log('[OnboardingTour] Initializing driver...');

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

            steps.push({
                element: '#tour-schedule-list',
                popover: {
                    title: 'Sua Agenda Diária 📅',
                    description: 'Tudo o que você precisa tomar hoje vai aparecer nesta lista. É só clicar no botão de "check" ✅ quando tomar.',
                    side: "top",
                    align: 'start'
                }
            });

            // Create driver instance
            const driverObj = driver({
                showProgress: true,
                animate: true,
                nextBtnText: 'Próximo ->',
                prevBtnText: 'Anterior',
                doneBtnText: 'Entendi!',
                steps: steps,
                onDestroyed: () => {
                    // Mark as seen
                    localStorage.setItem('hasSeenTour_v1', 'true');

                    // Notify parent to reset state (manual mode)
                    if (onTourEndRef.current) {
                        onTourEndRef.current();
                    }

                    // Clear ref so we can start again later if requested
                    driverRef.current = null;
                }
            });

            driverRef.current = driverObj;

            // Start drive directly (no timeout needed usually, but if elements are late-mounting...)
            // Since this effect runs after render, elements should be there.
            driverObj.drive();
        }

        return () => {
            isMounted.current = false;
            // Only destroy if the component is unmounting to clean up DOM
            if (driverRef.current) {
                driverRef.current.destroy();
                driverRef.current = null;
            }
        };
    }, [forceStart]);

    return null;
};

export default OnboardingTour;

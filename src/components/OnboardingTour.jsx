import React, { useEffect, useRef } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';

// Simplificado: Se este componente é renderizado, ele EXECUTA o tour.
// O controle de "se deve mostrar ou não" agora é responsabilidade do componente PAI (Home.jsx).
const OnboardingTour = ({ onTourEnd }) => {
    // Keep a stable ref to the callback
    const onTourEndRef = useRef(onTourEnd);
    const driverRef = useRef(null);

    useEffect(() => {
        onTourEndRef.current = onTourEnd;
    }, [onTourEnd]);

    useEffect(() => {
        console.log('[OnboardingTour] Mounted. Initializing driver...');

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
        driverRef.current = driver({
            showProgress: true,
            animate: true,
            nextBtnText: 'Próximo ->',
            prevBtnText: 'Anterior',
            doneBtnText: 'Entendi!',
            steps: steps,
            onDestroyed: () => {
                console.log('[OnboardingTour] Valid destroy triggered.');

                // Notify parent
                if (onTourEndRef.current) {
                    onTourEndRef.current();
                }

                driverRef.current = null;
            }
        });

        driverRef.current.drive();

        return () => {
            console.log('[OnboardingTour] Unmounting...');
            if (driverRef.current) {
                driverRef.current.destroy();
                driverRef.current = null;
            }
        };
    }, []);

    return null;
};

export default OnboardingTour;

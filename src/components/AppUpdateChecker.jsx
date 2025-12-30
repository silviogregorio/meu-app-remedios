import React from 'react';
import useAppUpdate from '../hooks/useAppUpdate';

/**
 * Componente que monitora atualizações do app em segundo plano.
 * Deve ser renderizado dentro do AppProvider para ter acesso ao showToast.
 */
const AppUpdateChecker = () => {
    // O hook cuida de tudo automaticamente
    useAppUpdate();

    return null; // Componente invisível
};

export default AppUpdateChecker;

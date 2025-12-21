/**
 * Badging API Helper
 * Atualiza o badge (contador) no ícone do app na tela inicial
 * Suportado no Chrome/Edge (Android/Desktop)
 */

/**
 * Define o badge com um número
 * @param {number} count - Número a exibir no badge (0 para limpar)
 */
export const setBadge = async (count) => {
    if (!('setAppBadge' in navigator)) {
        console.warn('Badging API não suportada neste navegador');
        return false;
    }

    try {
        if (count > 0) {
            await navigator.setAppBadge(count);
        } else {
            await navigator.clearAppBadge();
        }
        return true;
    } catch (error) {
        console.error('Erro ao definir badge:', error);
        return false;
    }
};

/**
 * Limpa o badge
 */
export const clearBadge = async () => {
    if (!('clearAppBadge' in navigator)) {
        return false;
    }

    try {
        await navigator.clearAppBadge();
        return true;
    } catch (error) {
        console.error('Erro ao limpar badge:', error);
        return false;
    }
};

/**
 * Verifica se o Badging API é suportado
 * @returns {boolean}
 */
export const isBadgingSupported = () => {
    return 'setAppBadge' in navigator;
};

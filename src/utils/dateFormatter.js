import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Formats a date to 'dd/MM/yyyy'
 * @param {Date|string|number} date 
 * @returns {string}
 */
export const formatDate = (date) => {
    if (!date) return '';
    return format(new Date(date), 'dd/MM/yyyy', { locale: ptBR });
};

/**
 * Formats a date to 'HH:mm' (24h)
 * @param {Date|string|number} date 
 * @returns {string}
 */
export const formatTime = (date) => {
    if (!date) return '';
    return format(new Date(date), 'HH:mm', { locale: ptBR });
};

/**
 * Formats a date to 'dd/MM/yyyy HH:mm'
 * @param {Date|string|number} date 
 * @returns {string}
 */
export const formatDateTime = (date) => {
    if (!date) return '';
    return format(new Date(date), 'dd/MM/yyyy HH:mm', { locale: ptBR });
};

/**
 * Returns the current date formatted as 'dd/MM/yyyy'
 */
export const getCurrentDate = () => formatDate(new Date());

/**
 * Returns the current time formatted as 'HH:mm'
 */
export const getCurrentTime = () => formatTime(new Date());

/**
 * Formats a date for display in full text if needed (e.g. "Sábado, 06/12/2025")
 * @param {Date|string|number} date 
 * @returns {string}
 */
export const formatDateFull = (date) => {
    if (!date) return '';
    // Custom format: Weekday, dd/MM/yyyy
    const d = new Date(date);
    const day = format(d, 'dd/MM/yyyy');
    const week = format(d, 'EEEE', { locale: ptBR });
    return `${week.charAt(0).toUpperCase() + week.slice(1)}, ${day}`;
};

import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Formats a date to 'dd/MM/yyyy'
 * @param {Date|string|number} date 
 * @returns {string}
 */
export const formatDate = (date) => {
    if (!date) return '';

    let d;
    // Fix: If string matches YYYY-MM-DD (without time), append T00:00:00 to force Local Time
    if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
        d = new Date(`${date}T00:00:00`);
    } else {
        d = new Date(date);
    }

    if (isNaN(d.getTime())) return ''; // Return empty if invalid date
    return format(d, 'dd/MM/yyyy', { locale: ptBR });
};

/**
 * Formats a date to 'HH:mm' (24h)
 * @param {Date|string|number} date 
 * @returns {string}
 */
export const formatTime = (date) => {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return ''; // Return empty if invalid date
    return format(d, 'HH:mm', { locale: ptBR });
};

/**
 * Formats a date to 'dd/MM/yyyy HH:mm'
 * @param {Date|string|number} date 
 * @returns {string}
 */
export const formatDateTime = (date) => {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return ''; // Return empty if invalid date
    return format(d, 'dd/MM/yyyy HH:mm', { locale: ptBR });
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
/**
 * Returns the current date in YYYY-MM-DD format (local time)
 * @returns {string}
 */
export const getISODate = (date = new Date()) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};
/**
 * Parses a YYYY-MM-DD string into a Date object at 00:00:00 local time.
 * This prevents the timezone shift issue where new Date('2023-10-27')
 * results in '2023-10-26 21:00' due to UTC offset.
 * @param {string} dateString 
 * @returns {Date}
 */
export const parseISODate = (dateString) => {
    if (!dateString) return new Date();
    // Use the T00:00:00 suffix to force local time interpretation in most browsers
    // but a manual split/instantiation is even safer across all environments.
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day, 0, 0, 0);
};

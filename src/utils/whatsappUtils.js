/**
 * Utilitários para geração de links WhatsApp
 * Gera mensagens formatadas para reposição de medicamentos
 */

/**
 * Gera link WhatsApp genérico para reposição de medicamento
 * @param {Object} medication - Dados do medicamento
 * @param {Object} patient - Dados do paciente
 * @param {number} daysRemaining - Dias restantes de estoque
 * @returns {string} - Link WhatsApp formatado
 */
export const generatePharmacyWhatsAppLink = (medication, patient, daysRemaining) => {
    if (!medication || !patient) {
        console.warn('generatePharmacyWhatsAppLink: medication or patient is missing');
        return '';
    }

    const currentQuantity = medication.quantity || 0;
    const suggestedQuantity = calculateSuggestedQuantity(medication);

    const message = `Olá! Preciso repor o medicamento:

👤 *Paciente:* ${patient.name}
📋 *Medicamento:* ${medication.name}
💊 *Dosagem:* ${medication.dosage || 'N/A'}
📦 *Quantidade sugerida:* ${suggestedQuantity} ${medication.type || 'unidades'}

⚠️ O estoque atual (${currentQuantity}) dura apenas ${Math.floor(daysRemaining)} dias.

Está disponível? Obrigado!

_Enviado via SiG Remédios_`;

    // Link genérico - usuário escolhe destinatário
    return `https://wa.me/?text=${encodeURIComponent(message)}`;
};

/**
 * Calcula quantidade sugerida para compra (30 dias de uso)
 * @param {Object} medication - Dados do medicamento
 * @returns {number} - Quantidade sugerida
 */
export const calculateSuggestedQuantity = (medication) => {
    // Se o medicamento tem uso diário calculado, usar
    const dailyUsage = medication.dailyUsage || 1;

    // Sugerir estoque para 30 dias
    return Math.ceil(dailyUsage * 30);
};

/**
 * Formata mensagem de alerta de estoque baixo
 * @param {string} medicationName - Nome do medicamento
 * @param {number} daysRemaining - Dias restantes
 * @returns {string} - Mensagem formatada
 */
export const formatLowStockMessage = (medicationName, daysRemaining) => {
    const daysInt = Math.floor(daysRemaining);

    if (daysInt <= 1) {
        return `⚠️ URGENTE: Estoque de ${medicationName} acaba em ${daysInt} dia!`;
    } else if (daysInt <= 3) {
        return `⚠️ Atenção: Estoque de ${medicationName} acaba em ${daysInt} dias!`;
    } else {
        return `⚠️ Estoque de ${medicationName} acaba em ${daysInt} dias`;
    }
};

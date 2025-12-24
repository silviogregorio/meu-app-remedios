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
/**
 * Gera mensagem de texto para o resumo semanal de saúde.
 * 
 * @param {Object} allStats Estatísticas de todos os pacientes (geradas pelo summaryService)
 * @returns {string} Texto formatado para WhatsApp
 */
export const generateWeeklySummaryMessage = (allStats) => {
    // Usando Unicode escapes para garantir codificação UTF-8 correta em qualquer ambiente
    const emojiChart = '\u{1F4CA}'; // 📊
    const emojiUser = '\u{1F464}';  // 👤
    const emojiCheck = '\u{2705}';  // ✅
    const emojiPill = '\u{1F48A}';  // 💊
    const emojiHeart = '\u{1F493}'; // 💓
    const emojiDrop = '\u{1F64F}';  // 🙏 (ou use outro para glicemia)
    const emojiBlood = '\u{1FA78}'; // 🩸

    let text = `*${emojiChart} RESUMO SEMANAL DE SAÚDE*\n`;
    text += '============================\n\n';

    const patientIds = Object.keys(allStats);

    if (patientIds.length === 0) {
        text += 'Nenhum dado registrado nesta semana.\n';
    } else {
        patientIds.forEach((id, index) => {
            const stats = allStats[id];

            text += `*${emojiUser} Paciente:* ${stats.patientName}\n`;

            if (stats.adherenceRate !== null) {
                text += `${emojiCheck} *Adesão:* ${stats.adherenceRate}%\n`;
                text += `${emojiPill} *Remédios:* ${stats.takenDoses} tomados`;
                if (stats.forgottenDoses > 0) {
                    text += `, ${stats.forgottenDoses} esquecidos`;
                }
                text += '\n';
            } else {
                text += `${emojiPill} Sem registros de medicamentos\n`;
            }

            if (stats.avgPressure) {
                text += `${emojiHeart} *Pressão Média:* ${stats.avgPressure} mmHg\n`;
            }

            if (stats.avgGlucose) {
                text += `${emojiBlood} *Glicemia Média:* ${stats.avgGlucose} mg/dL\n`;
            }

            if (index < patientIds.length - 1) {
                text += '\n----------------------------\n\n';
            }
        });
    }

    text += '\n============================\n';
    text += `*SiG Remédios*\n`;
    text += '_Cuidando de quem você ama._';

    return text;
};

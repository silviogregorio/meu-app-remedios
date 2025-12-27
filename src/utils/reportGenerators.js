/**
 * Report Generators - Funções de geração de texto e HTML para relatórios
 * Extraído de Reports.jsx para melhor manutenibilidade
 */

import { formatDate, formatDateTime } from './dateFormatter';

/**
 * Mapa de tradução de motivos de movimentação de estoque
 */
export const STOCK_REASON_MAP = {
    'consumption': 'Consumo',
    'manual_adjustment': 'Ajuste Manual',
    'prescription_cancel': 'Cancelamento de Prescrição',
    'initial_stock': 'Estoque Inicial',
    'purchase': 'Compra/Entrada',
    'refill': 'Reposição de Estoque',
    'adjustment': 'Ajuste de Saldo',
    'correction': 'Correção de Erro'
};

/**
 * Gera texto formatado para WhatsApp do relatório de medicações
 * @param {Object} reportData - Dados do relatório
 * @param {Object} filters - Filtros aplicados
 * @param {Array} patients - Lista de pacientes
 * @returns {string} Texto formatado para WhatsApp
 */
export function generateReportText(reportData, filters, patients) {
    if (!reportData) return '';

    const filteredItems = reportData.items.filter(
        item => filters.status === 'all' || item.status === filters.status
    );

    let text = '*RELATÓRIO DE MEDICAÇÕES*\n\n';
    text += '*Período:* ' + formatDate(reportData.filters.startDate) + ' até ' + formatDate(reportData.filters.endDate) + '\n';

    if (reportData.filters.patientId !== 'all') {
        const patient = patients.find(p => p.id === reportData.filters.patientId);
        text += '*Paciente:* ' + patient?.name + '\n';
    }

    text += '\n*RESUMO*\n';
    text += 'Total: ' + reportData.summary.total + '\n';
    text += 'Tomadas: ' + reportData.summary.taken + '\n';
    text += 'Pendentes: ' + reportData.summary.pending + '\n';
    text += 'Taxa de Adesão: ' + reportData.summary.adherenceRate + '%\n';

    text += '\n*DETALHAMENTO*\n';
    filteredItems.slice(0, 20).forEach((item, idx) => {
        const status = item.status === 'taken' ? '[TOMADO]' : '[PENDENTE]';
        text += '\n' + (idx + 1) + '. ' + status + ' ' + formatDate(item.date) + ' às ' + item.time + '\n';
        text += '   ' + item.patient + ' - ' + item.medication + '\n';
    });

    if (filteredItems.length > 20) {
        text += '\n... e mais ' + (filteredItems.length - 20) + ' medicações\n';
    }

    text += '\n---\n_Gerado via SiG Remédios - Sistema de Controle de Medicamentos_\nhttps://sigremedios.vercel.app';

    return text;
}

/**
 * Gera HTML do relatório de medicações para email
 * @param {Object} reportData - Dados do relatório
 * @param {Object} filters - Filtros aplicados
 * @param {Array} patients - Lista de pacientes
 * @param {Object} emailData - Dados do email (observações)
 * @returns {string} HTML formatado
 */
export function generateReportHtml(reportData, filters, patients, emailData = {}) {
    if (!reportData) return '';

    const filteredItems = reportData.items.filter(
        item => filters.status === 'all' || item.status === filters.status
    );

    const [startYear, startMonth, startDay] = reportData.filters.startDate.split('-').map(Number);
    const [endYear, endMonth, endDay] = reportData.filters.endDate.split('-').map(Number);
    const startDate = formatDate(new Date(startYear, startMonth - 1, startDay));
    const endDate = formatDate(new Date(endYear, endMonth - 1, endDay));

    const patientName = reportData.filters.patientId !== 'all'
        ? patients.find(p => p.id === reportData.filters.patientId)?.name
        : 'Todos os Pacientes';

    const statusFilter = filters.status === 'all' ? 'Todos' : filters.status === 'taken' ? 'Tomadas' : 'Pendentes';

    const rows = filteredItems.slice(0, 50).map(item => {
        const statusColor = item.status === 'taken' ? '#dcfce7' : '#ffedd5';
        const statusText = item.status === 'taken' ? '#166534' : '#9a3412';
        const statusLabel = item.status === 'taken' ? 'TOMADO' : 'PENDENTE';

        const [year, month, day] = item.date.split('-').map(Number);
        const itemDate = formatDate(new Date(year, month - 1, day));

        return `
            <tr>
                <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; color: #334155;">
                    <div style="font-weight: bold;">${itemDate}</div>
                    <div style="font-size: 12px; color: #64748b;">${item.time}</div>
                </td>
                <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; color: #334155;">
                    <div style="font-weight: 600;">${item.medication}</div>
                    <div style="font-size: 12px; color: #64748b;">${item.patient}</div>
                </td>
                <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">
                    <span style="background-color: ${statusColor}; color: ${statusText}; padding: 4px 8px; border-radius: 9999px; font-size: 10px; font-weight: bold; display: inline-block;">
                        ${statusLabel}
                    </span>
                </td>
            </tr>
        `;
    }).join('');

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5; margin: 0; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
                
                <!-- Header -->
                <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 40px 30px; text-align: center; color: white;">
                    <h1 style="margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">Relatório de Medicamentos</h1>
                    <p style="margin: 10px 0 0; opacity: 0.9; font-size: 16px;">${startDate} até ${endDate}</p>
                    <div style="margin-top: 15px; display: inline-block; background: rgba(255,255,255,0.2); padding: 5px 15px; border-radius: 20px; font-size: 14px;">
                        ${patientName}
                    </div>
                    <div style="margin-top: 8px; font-size: 14px; opacity: 0.9;">
                        Status: ${statusFilter}
                    </div>
                </div>

                <!-- Summary Grid -->
                <div style="padding: 30px; background-color: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                    <table style="width: 100%; border-collapse: separate; border-spacing: 10px;">
                        <tr>
                            <td style="background: white; padding: 20px; border-radius: 12px; text-align: center; border: 1px solid #e2e8f0; width: 33%;">
                                <div style="font-size: 32px; font-weight: 800; color: #3b82f6;">${reportData.summary.total}</div>
                                <div style="font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 600; letter-spacing: 0.5px; margin-top: 5px;">Total de Doses</div>
                            </td>
                            <td style="background: white; padding: 20px; border-radius: 12px; text-align: center; border: 1px solid #e2e8f0; width: 33%;">
                                <div style="font-size: 32px; font-weight: 800; color: #22c55e;">${reportData.summary.taken}</div>
                                <div style="font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 600; letter-spacing: 0.5px; margin-top: 5px;">Tomadas</div>
                            </td>
                            <td style="background: white; padding: 20px; border-radius: 12px; text-align: center; border: 1px solid #e2e8f0; width: 33%;">
                                <div style="font-size: 32px; font-weight: 800; color: #8b5cf6;">${reportData.summary.adherenceRate}%</div>
                                <div style="font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 600; letter-spacing: 0.5px; margin-top: 5px;">Adesão</div>
                            </td>
                        </tr>
                    </table>
                </div>

                <!-- Main Content -->
                <div style="padding: 30px;">
                    <h3 style="margin: 0 0 20px; color: #1e293b; font-size: 18px;">Detalhamento</h3>
                    
                    <div style="overflow-x: auto; -webkit-overflow-scrolling: touch;">
                        <table style="width: 100%; min-width: 500px; border-collapse: collapse;">
                            <thead>
                                <tr>
                                    <th style="text-align: left; padding: 12px; background: #f1f5f9; color: #64748b; font-size: 11px; text-transform: uppercase; border-radius: 6px 0 0 6px; white-space: nowrap;">Data/Hora</th>
                                    <th style="text-align: left; padding: 12px; background: #f1f5f9; color: #64748b; font-size: 11px; text-transform: uppercase;">Medicamento</th>
                                    <th style="text-align: left; padding: 12px; background: #f1f5f9; color: #64748b; font-size: 11px; text-transform: uppercase; border-radius: 0 6px 6px 0;">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${rows}
                            </tbody>
                        </table>
                    </div>

                    ${filteredItems.length > 50 ? `
                        <div style="text-align: center; padding: 20px; color: #64748b; font-size: 14px; font-style: italic;">
                            ... e mais ${filteredItems.length - 50} registros
                        </div>
                    ` : ''}
                </div>

                <!-- Footer -->
                <div style="background: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
                    <p style="margin: 0; color: #94a3b8; font-size: 14px;">Gerado automaticamente pelo <strong>SiG Remédios</strong></p>
                    ${emailData.observations ? `
                        <div style="margin-top: 20px; padding: 15px; background: #fff7ed; border: 1px solid #ffedd5; border-radius: 8px; color: #9a3412; font-size: 14px; text-align: left;">
                            <strong>Observações:</strong><br>${emailData.observations}
                        </div>
                    ` : ''}
                </div>
            </div>
        </body>
        </html>
    `;
}

/**
 * Gera texto formatado para WhatsApp do relatório de estoque
 * @param {Array} stockData - Dados de movimentação de estoque
 * @param {Object} filters - Filtros aplicados
 * @param {Array} patients - Lista de pacientes
 * @param {Array} medications - Lista de medicamentos
 * @returns {string} Texto formatado para WhatsApp
 */
export function generateStockReportText(stockData, filters, patients, medications) {
    if (!stockData || stockData.length === 0) return '';

    let text = '*RELATÓRIO DE ESTOQUE E MOVIMENTAÇÕES*\n\n';
    text += '*Período:* ' + formatDate(filters.startDate) + ' até ' + formatDate(filters.endDate) + '\n';

    if (filters.patientId !== 'all') {
        const patient = patients.find(p => p.id === filters.patientId);
        text += '*Paciente:* ' + (patient?.name || 'N/A') + '\n';
    }
    if (filters.medicationId !== 'all') {
        const med = medications.find(m => m.id === filters.medicationId);
        text += '*Medicamento:* ' + (med ? `${med.name} ${med.dosage}` : 'N/A') + '\n';
    }

    text += '\n*MOVIMENTAÇÕES RECENTES*\n';

    stockData.slice(0, 30).forEach((item, idx) => {
        const isPositive = item.quantity_change > 0;
        const translatedReason = STOCK_REASON_MAP[item.reason] || item.reason;
        text += '\n' + (idx + 1) + '. ' + formatDateTime(item.created_at) + '\n';
        text += '   ' + (item.medications?.name || 'Medicamento') + ' (' + (isPositive ? '+' : '') + item.quantity_change + ')\n';
        text += '   Motivo: ' + translatedReason + ' | Usuário: ' + (item.profiles?.full_name || 'Sistema') + '\n';
    });

    if (stockData.length > 30) {
        text += '\n... e mais ' + (stockData.length - 30) + ' registros\n';
    }

    text += '\n---\n_Gerado via SiG Remédios - Sistema de Controle de Medicamentos_\nhttps://sigremedios.vercel.app';
    return text;
}

/**
 * Gera HTML do relatório de movimentações de estoque para email
 * @param {Array} stockData - Dados de movimentação de estoque
 * @param {Object} filters - Filtros aplicados
 * @returns {string} HTML formatado
 */
export function generateStockReportHtml(stockData, filters) {
    if (!stockData || stockData.length === 0) return '';

    const startDate = formatDate(filters.startDate);
    const endDate = formatDate(filters.endDate);

    const rows = stockData.slice(0, 50).map(item => {
        const isPositive = item.quantity_change > 0;
        const color = isPositive ? '#166534' : '#9a3412';
        const bg = isPositive ? '#dcfce7' : '#ffedd5';
        const translatedReason = STOCK_REASON_MAP[item.reason] || item.reason;

        return `
            <tr>
                <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; color: #334155;">
                    <div style="font-weight: bold;">${formatDateTime(item.created_at)}</div>
                    <div style="font-size: 12px; color: #64748b;">${item.profiles?.full_name || 'Usuário'}</div>
                </td>
                <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; color: #334155;">
                     <div style="font-weight: 600;">${item.medications?.name}</div>
                    <div style="font-size: 12px; color: #64748b;">${item.medications?.dosage ? `${item.medications.dosage} ${item.medications.type || 'un.'}`.trim() : '-'}</div>
                </td>
                <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">
                     <span style="background-color: ${bg}; color: ${color}; padding: 4px 8px; border-radius: 9999px; font-size: 12px; font-weight: bold; display: inline-block;">
                        ${isPositive ? '+' : ''}${item.quantity_change}
                    </span>
                    <div style="font-size: 11px; margin-top: 4px; color: #64748b;">
                        ${translatedReason}
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    return `
        <!DOCTYPE html>
        <html>
         <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: 'Segoe UI', sans-serif; background-color: #f4f4f5; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <div style="background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); padding: 30px; text-align: center; color: white;">
                    <h1 style="margin: 0; font-size: 24px;">Relatório de Movimentações</h1>
                    <p style="margin: 5px 0 0; opacity: 0.9;">${startDate} até ${endDate}</p>
                </div>
                <div style="padding: 20px;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="background: #f8fafc; text-align: left;">
                                <th style="padding: 10px; font-size: 12px; color: #64748b;">DATA/QUEM</th>
                                <th style="padding: 10px; font-size: 12px; color: #64748b;">ITEM</th>
                                <th style="padding: 10px; font-size: 12px; color: #64748b;">QTD</th>
                            </tr>
                        </thead>
                        <tbody>${rows}</tbody>
                    </table>
                </div>
            </div>
        </body>
        </html>
    `;
}

/**
 * Categorias de sinais vitais para o Diário de Saúde
 */
export const HEALTH_CATEGORIES = [
    { id: 'pressure', label: 'Pressão Arterial', emoji: '🩺', unit: 'mmHg' },
    { id: 'glucose', label: 'Glicemia', emoji: '🩸', unit: 'mg/dL' },
    { id: 'weight', label: 'Peso', emoji: '⚖️', unit: 'kg' },
    { id: 'temperature', label: 'Temperatura', emoji: '🌡️', unit: '°C' },
    { id: 'heart_rate', label: 'Batimentos', emoji: '💓', unit: 'bpm' },
];

/**
 * Obtém informações de uma categoria de saúde
 */
export function getCategoryInfo(catId) {
    return HEALTH_CATEGORIES.find(c => c.id === catId) || { label: 'Outro', unit: '', emoji: '📋' };
}

/**
 * Gera texto formatado para WhatsApp do diário de saúde
 * @param {Array} filteredLogs - Logs de saúde filtrados
 * @param {Array} patients - Lista de pacientes
 * @param {string} selectedPatientId - ID do paciente selecionado ('all' ou ID específico)
 * @returns {string} Texto formatado para WhatsApp
 */
export function generateHealthReportText(filteredLogs, patients, selectedPatientId) {
    let text = '*DIÁRIO DE SAÚDE*\n';
    text += '========================\n';
    if (selectedPatientId !== 'all') {
        const p = patients.find(pat => pat.id === selectedPatientId);
        text += `*Paciente:* *_${p?.name || 'N/A'}_*\n`;
    }

    text += `*Gerado em:* ${formatDateTime(new Date())}\n`;
    text += `*Total de registros:* ${filteredLogs.length}\n`;
    text += '========================\n';

    // Agrupar logs por paciente
    const logsByPatient = {};
    filteredLogs.forEach(log => {
        const patientId = log.patient_id;
        if (!logsByPatient[patientId]) {
            logsByPatient[patientId] = [];
        }
        logsByPatient[patientId].push(log);
    });

    // Ordenar cada grupo por data crescente
    Object.keys(logsByPatient).forEach(patientId => {
        logsByPatient[patientId].sort((a, b) => new Date(a.measured_at) - new Date(b.measured_at));
    });

    // Verificar se há registros
    const totalLogs = Object.values(logsByPatient).reduce((sum, logs) => sum + logs.length, 0);
    if (totalLogs === 0) {
        text += '*Nenhum registro encontrado*\n';
        text += 'Adicione sinais vitais para gerar o relatório.\n\n';
    } else {
        // Iterar por cada paciente
        Object.entries(logsByPatient).forEach(([patientId, logs], patientIndex) => {
            const patient = patients.find(p => p.id === patientId);
            const patientName = patient?.name || 'Paciente Desconhecido';

            // Cabeçalho do paciente (apenas se houver múltiplos pacientes)
            if (Object.keys(logsByPatient).length > 1) {
                if (patientIndex > 0) text += '\n';
                text += `-- - * _${patientName} _ * ---\n`;
            }

            // Registros do paciente (limitado a 30 total)
            const logsToShow = logs.slice(0, 30);
            logsToShow.forEach((log) => {
                const info = getCategoryInfo(log.category);

                // Tag baseada na categoria
                let tag = '';
                if (log.category === 'pressure') tag = '[PA]';
                else if (log.category === 'glucose') tag = '[GLI]';
                else if (log.category === 'weight') tag = '[PESO]';
                else if (log.category === 'temperature') tag = '[TEMP]';
                else if (log.category === 'heart_rate') tag = '[BPM]';
                else tag = '[REG]';

                text += `${tag} * ${info.label}*\n`;
                text += `Data: ${formatDateTime(log.measured_at)} \n`;

                let val = `${log.value} `;
                if (log.value_secondary) val += ` / ${log.value_secondary} `;
                val += ` ${info.unit} `;

                text += `Valor: * ${val}*\n`;

                if (log.notes) {
                    text += `Obs: ${log.notes} \n`;
                }
            });

            if (logs.length > 30) {
                text += `_... e mais ${logs.length - 30} registro(s) de ${patientName} _\n`;
            }
        });
    }

    text += '========================\n';
    text += '*SiG Remédios*\n';
    text += 'Gerenciamento de Saúde Familiar\n\n';
    text += 'https://sigremedios.vercel.app';

    return text;
}

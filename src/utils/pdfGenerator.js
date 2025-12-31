import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Helper to load image as base64 (optimized for smaller PDFs)
 */
const loadImage = (url, maxWidth = 100) => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.src = url;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            // Resize to max width to reduce file size
            const scale = Math.min(1, maxWidth / img.width);
            canvas.width = img.width * scale;
            canvas.height = img.height * scale;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            // Use JPEG with 0.7 quality for smaller size (70% reduction typical)
            resolve(canvas.toDataURL('image/jpeg', 0.7));
        };
        img.onerror = reject;
    });
};

/**
 * Generates a professional PDF report for medications
 * @param {Object} reportData - Report data from Reports page
 * @param {Object} filters - Applied filters
 * @param {Array} patients - List of patients
 * @returns {Promise<void>} - Downloads the PDF
 */
export const generatePDFReport = async (reportData, filters, patients) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    // Brand Colors
    const colors = {
        primary: [15, 118, 110], // Teal-700
        secondary: [45, 212, 191], // Teal-400
        text: [51, 65, 85], // Slate-700
        heading: [30, 41, 59], // Slate-800
        lightBg: [248, 250, 252], // Slate-50
        border: [226, 232, 240], // Slate-200
        accent: [244, 63, 94] // Rose-500
    };

    // Load Logo
    let logoData = null;
    try {
        logoData = await loadImage('/assets/logo.png');
    } catch (error) {
        console.error("Erro ao carregar logo:", error);
    }

    // --- Header ---
    const drawHeader = () => {
        // Top Bar
        doc.setFillColor(...colors.primary);
        doc.rect(0, 0, pageWidth, 40, 'F');

        // Logo Area
        if (logoData) {
            doc.setFillColor(255, 255, 255);
            doc.circle(25, 20, 14, 'F'); // White background for logo
            doc.addImage(logoData, 'PNG', 16, 11, 18, 18); // Adjust position to center in circle
        } else {
            // Fallback if logo fails
            doc.setFillColor(255, 255, 255);
            doc.circle(25, 20, 12, 'F');
            doc.setTextColor(...colors.primary);
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('SiG', 20, 22);
        }

        // Title
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.text('Relatório de Saúde', 45, 20);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('Controle de Medicamentos e Adesão', 45, 28);

        // Report Info (Right Side)
        doc.setFontSize(9);
        doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy HH:mm")}`, pageWidth - 15, 18, { align: 'right' });

        const period = `${format(new Date(reportData.filters.startDate), "dd/MM/yyyy")} a ${format(new Date(reportData.filters.endDate), "dd/MM/yyyy")}`;
        doc.text(`Período: ${period}`, pageWidth - 15, 26, { align: 'right' });
    };

    drawHeader();

    let yPos = 55;

    // --- Patient Info Block ---
    if (reportData.filters.patientId !== 'all') {
        const patient = patients.find(p => p.id === reportData.filters.patientId);
        if (patient) {
            doc.setDrawColor(...colors.border);
            doc.setFillColor(...colors.lightBg);
            doc.roundedRect(14, yPos, pageWidth - 28, 25, 3, 3, 'FD');

            doc.setTextColor(...colors.text);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text('PACIENTE', 20, yPos + 8);

            doc.setFontSize(12);
            doc.setTextColor(...colors.heading);
            doc.text(patient.name, 20, yPos + 18);

            if (patient.phone) {
                doc.setFontSize(10);
                doc.setTextColor(...colors.text);
                doc.text(`Tel: ${patient.phone}`, pageWidth / 2, yPos + 18);
            }

            yPos += 35;
        }
    } else {
        doc.setFontSize(14);
        doc.setTextColor(...colors.heading);
        doc.text('Visão Geral - Todos os Pacientes', 14, yPos);
        yPos += 15;
    }

    // --- Summary Cards ---
    const summaryData = [
        { label: 'TOTAL', value: reportData.summary.total, color: [59, 130, 246] }, // Blue
        { label: 'TOMADAS', value: reportData.summary.taken, color: [34, 197, 94] },  // Green
        { label: 'PENDENTES', value: reportData.summary.pending, color: [249, 115, 22] }, // Orange
        { label: 'ADESÃO', value: `${reportData.summary.adherenceRate}%`, color: [168, 85, 247] } // Purple
    ];

    const cardWidth = (pageWidth - 28 - (summaryData.length - 1) * 5) / summaryData.length;
    let xCurr = 14;

    summaryData.forEach(item => {
        // Card Background (Reduced Height: 24 -> 16)
        doc.setDrawColor(...colors.border);
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(xCurr, yPos, cardWidth, 16, 2, 2, 'FD');

        // Color Strip
        doc.setFillColor(...item.color);
        doc.rect(xCurr, yPos + 3, 3, 10, 'F');

        // Value
        doc.setTextColor(...colors.heading);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(String(item.value), xCurr + 8, yPos + 7);

        // Label
        doc.setTextColor(100, 116, 139); // Slate-500
        doc.setFontSize(6);
        doc.setFont('helvetica', 'bold');
        doc.text(item.label, xCurr + 8, yPos + 13);

        xCurr += cardWidth + 5;
    });

    yPos += 22;

    // --- Legend ---
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139); // Slate-500
    doc.setFont('helvetica', 'normal');

    const legendY = yPos;
    const legendLineHeight = 3.5;

    doc.text('Legenda:', 14, legendY);
    doc.setFontSize(6.5);
    doc.setTextColor(71, 85, 105); // Slate-600

    // Column 1
    doc.setFont('helvetica', 'bold');
    doc.text('• Total:', 14, legendY + legendLineHeight);
    doc.setFont('helvetica', 'normal');
    doc.text('Quantidade total de doses prescritas para o período selecionado.', 26, legendY + legendLineHeight);

    doc.setFont('helvetica', 'bold');
    doc.text('• Tomadas:', 14, legendY + (legendLineHeight * 2));
    doc.setFont('helvetica', 'normal');
    doc.text('Doses confirmadas e registradas pelo paciente/cuidador.', 33, legendY + (legendLineHeight * 2));

    // Column 2 (Approx)
    doc.setFont('helvetica', 'bold');
    doc.text('• Pendentes:', 110, legendY + legendLineHeight);
    doc.setFont('helvetica', 'normal');
    doc.text('Doses agendadas que ainda não foram marcadas ou estão atrasadas.', 129, legendY + legendLineHeight);

    doc.setFont('helvetica', 'bold');
    doc.text('• Adesão:', 110, legendY + (legendLineHeight * 2));
    doc.setFont('helvetica', 'normal');
    doc.text('Porcentagem de sucesso do tratamento (Tomadas ÷ Total).', 126, legendY + (legendLineHeight * 2));

    yPos += 25;

    // --- Data Table ---
    doc.setFontSize(12);
    doc.setTextColor(...colors.heading);
    doc.setFont('helvetica', 'bold');
    doc.text('Detalhamento das Doses', 14, yPos - 5);

    const filteredItems = reportData.items.filter(item =>
        filters.status === 'all' || item.status === filters.status
    );

    const tableData = filteredItems.map(item => [
        format(new Date(item.date), "dd/MM/yyyy", { locale: ptBR }),
        item.time,
        item.medication,
        item.patient,
        item.status === 'taken' ? 'TOMADO' : 'PENDENTE'
    ]);

    autoTable(doc, {
        startY: yPos,
        head: [['Data', 'Hora', 'Medicamento', 'Paciente', 'Status']],
        body: tableData,
        theme: 'striped',
        styles: {
            font: 'helvetica',
            fontSize: 9,
            cellPadding: 3,
            textColor: colors.text
        },
        headStyles: {
            fillColor: [241, 245, 249], // Slate-100
            textColor: colors.heading,
            fontStyle: 'bold',
            lineWidth: 0.1,
            lineColor: colors.border
        },
        alternateRowStyles: {
            fillColor: [250, 250, 250] // Very light gray
        },
        columnStyles: {
            0: { cellWidth: 25 },
            1: { cellWidth: 15 },
            2: { cellWidth: 'auto' }, // Medicamento takes remaining space
            3: { cellWidth: 40 },
            4: { cellWidth: 25, halign: 'center' }
        },
        didParseCell: function (data) {
            // Style Status Column
            if (data.section === 'body' && data.column.index === 4) {
                const isTaken = data.cell.raw === 'TOMADO';
                data.cell.styles.textColor = isTaken ? [22, 101, 52] : [154, 52, 18]; // Green-800 : Orange-800
                data.cell.styles.fontStyle = 'bold';
            }
        },
        margin: { top: 10, left: 14, right: 14 }
    });

    // --- Footer ---
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184); // Slate-400

        // Line
        doc.setDrawColor(...colors.border);
        doc.line(14, pageHeight - 15, pageWidth - 14, pageHeight - 15);

        // Footer Text
        doc.text('SiG Remédios - Cuidando da sua saúde', 14, pageHeight - 10);
        doc.text(`Página ${i} de ${pageCount}`, pageWidth - 14, pageHeight - 10, { align: 'right' });
    }

    // Save
    // Return doc instead of saving directly, allowing the caller to decide (print or save)
    return doc;
};

/**
 * Generates a professional PDF report for Health Diary
 * @param {Array} logs - Filtered health logs
 * @param {Object} filters - Current filters (patientId, etc)
 * @param {Array} patients - List of patients
 */
export const generatePDFHealthDiary = async (logs, filters, patients, medicationLogs = [], symptomLogs = []) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    // Brand Colors (Reused)
    const colors = {
        primary: [15, 118, 110], // Teal-700
        heading: [30, 41, 59], // Slate-800
        text: [51, 65, 85], // Slate-700
        border: [226, 232, 240], // Slate-200
        lightBg: [248, 250, 252] // Slate-50
    };

    // Load Logo
    let logoData = null;
    try {
        logoData = await loadImage('/assets/logo.png');
    } catch (error) {
        console.error("Erro ao carregar logo:", error);
    }

    // --- Header ---
    const drawHeader = () => {
        doc.setFillColor(...colors.primary);
        doc.rect(0, 0, pageWidth, 40, 'F');

        if (logoData) {
            doc.setFillColor(255, 255, 255);
            doc.circle(25, 20, 14, 'F');
            doc.addImage(logoData, 'PNG', 16, 11, 18, 18);
        } else {
            doc.setFillColor(255, 255, 255);
            doc.circle(25, 20, 12, 'F');
            doc.setTextColor(...colors.primary);
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('SiG', 20, 22);
        }

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.text('Diário de Saúde', 45, 20);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        if (filters.date) {
            // Se tiver data filtrada, mostrar data explícita (convertendo YYYY-MM-DD para Date local corretamente para formatação)
            const [y, m, d] = filters.date.split('-').map(Number);
            const dateObj = new Date(y, m - 1, d);
            doc.text(`Registro do dia ${format(dateObj, "dd/MM/yyyy")}`, 45, 28);
        } else if (filters.startDate || filters.endDate) {
            let periodText = 'Período: ';
            if (filters.startDate && filters.endDate) {
                const [y1, m1, d1] = filters.startDate.split('-').map(Number);
                const [y2, m2, d2] = filters.endDate.split('-').map(Number);
                periodText += `${format(new Date(y1, m1 - 1, d1), "dd/MM/yyyy")} até ${format(new Date(y2, m2 - 1, d2), "dd/MM/yyyy")}`;
            } else if (filters.startDate) {
                const [y, m, d] = filters.startDate.split('-').map(Number);
                periodText += `A partir de ${format(new Date(y, m - 1, d), "dd/MM/yyyy")}`;
            } else {
                const [y, m, d] = filters.endDate.split('-').map(Number);
                periodText += `Até ${format(new Date(y, m - 1, d), "dd/MM/yyyy")}`;
            }
            doc.text(periodText, 45, 28);
        } else {
            doc.text('Acompanhamento de Sinais Vitais', 45, 28);
        }

        doc.setFontSize(9);
        doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy HH:mm")}`, pageWidth - 15, 18, { align: 'right' });
    };

    drawHeader();
    let yPos = 55;

    // --- Agrupar logs por paciente ---
    const logsByPatient = {};
    const medsByPatient = {};

    // Sinais Vitais
    logs.forEach(log => {
        const patientId = log.patient_id;
        if (!logsByPatient[patientId]) logsByPatient[patientId] = [];
        logsByPatient[patientId].push(log);
    });

    // Medicamentos (apenas tomados)
    medicationLogs.forEach(medLog => {
        const prescription = medLog.prescription || {}; // Get patientId from joined data if available, or try to find logic
        // medicationLogs comes from consumptionLog state which has 'profile:taken_by'.
        // Wait, consumptionLog in AppContext stores raw DB data usually. 
        // We need to ensure medicationLogs has patientId.
        // In HealthDiary render, we'll filter carefully.
        // Assuming medicationLogs has 'prescriptionId', we need to match it to find patient.
        // BUT, for PDF simplicity, we should pass enriched logs or ensuring we can group them.
        // Let's assume the caller passes logs that HAVE patientId attached or we can find it.
        // Actually, LogService.transform keeps flat structure. 
        // We might need to map patientId from prescriptions in the caller.
        // Let's rely on 'patient_id' being present if possible, or use a helper.

        let patientId = medLog.patientId; // Caller must ensure this exists
        if (!patientId && medLog.prescription) patientId = medLog.prescription.patientId;

        if (patientId) {
            if (!medsByPatient[patientId]) medsByPatient[patientId] = [];
            medsByPatient[patientId].push(medLog);
        }
    });

    // Sintomas
    const symptomsByPatient = {};
    symptomLogs.forEach(sLog => {
        const patientId = sLog.patient_id || sLog.patientId;
        if (patientId) {
            if (!symptomsByPatient[patientId]) symptomsByPatient[patientId] = [];
            symptomsByPatient[patientId].push(sLog);
        }
    });

    // Ordenar
    Object.keys(logsByPatient).forEach(id => {
        logsByPatient[id].sort((a, b) => new Date(a.measured_at) - new Date(b.measured_at));
    });
    Object.keys(medsByPatient).forEach(id => {
        medsByPatient[id].sort((a, b) => new Date(a.date + 'T' + a.scheduledTime) - new Date(b.date + 'T' + b.scheduledTime));
    });
    Object.keys(symptomsByPatient).forEach(id => {
        symptomsByPatient[id].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    });

    // Obter lista única de pacientes ativos neste relatório
    const allPatientIds = new Set([...Object.keys(logsByPatient), ...Object.keys(medsByPatient), ...Object.keys(symptomsByPatient)]);

    // --- Helper Functions ---
    const getCategoryLabel = (catId) => {
        const map = {
            'pressure': 'Pressão Arterial',
            'glucose': 'Glicemia',
            'weight': 'Peso',
            'temperature': 'Temperatura',
            'heart_rate': 'Batimentos'
        };
        return map[catId] || 'Outro';
    };

    const getUnit = (catId) => {
        const map = { 'pressure': 'mmHg', 'glucose': 'mg/dL', 'weight': 'kg', 'temperature': '°C', 'heart_rate': 'bpm' };
        return map[catId] || '';
    };

    // --- Iterar por cada paciente ---
    Array.from(allPatientIds).forEach((patientId, index) => {
        const patientLogs = logsByPatient[patientId] || [];
        const patientMeds = medsByPatient[patientId] || [];
        const patientSymptoms = symptomsByPatient[patientId] || [];
        const patient = patients.find(p => p.id === patientId);
        const patientName = patient?.name || 'Paciente Desconhecido';

        // Adicionar nova página se não for o primeiro paciente e não houver espaço
        if (index > 0 && yPos > pageHeight - 60) {
            doc.addPage();
            drawHeader();
            yPos = 55;
        }

        // Espaçamento entre pacientes
        if (index > 0) {
            yPos += 10;
        }

        // --- Cabeçalho do Paciente ---
        // Fundo claro com borda colorida à esquerda
        doc.setDrawColor(226, 232, 240); // Slate-200
        doc.setFillColor(248, 250, 252); // Slate-50 (fundo claro)
        doc.roundedRect(14, yPos, pageWidth - 28, 20, 3, 3, 'FD');

        // Borda colorida à esquerda
        doc.setFillColor(124, 58, 237); // Purple-600
        doc.rect(14, yPos + 3, 4, 14, 'F');

        doc.setTextColor(30, 41, 59); // Slate-800 (texto escuro)
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(patientName, 24, yPos + 10);

        doc.setFontSize(9);
        doc.setTextColor(100, 116, 139); // Slate-500
        doc.setFont('helvetica', 'normal');
        doc.text(`${patientLogs.length} medições • ${patientMeds.length} medicamentos • ${patientSymptoms.length} sintomas`, 24, yPos + 16);

        yPos += 30; // Increased from 25 to 30 to give space for the title

        // --- Tabela do Paciente ---
        const tableData = patientLogs.map(log => {
            let val = `${log.value}`;
            if (log.value_secondary) val += ` / ${log.value_secondary}`;
            val += ` ${getUnit(log.category)}`;

            return [
                format(new Date(log.measured_at), "dd/MM/yyyy HH:mm", { locale: ptBR }),
                getCategoryLabel(log.category),
                val,
                log.notes || '-'
            ];
        });

        if (patientLogs.length > 0) {
            doc.setFontSize(10);
            doc.setTextColor(...colors.heading);
            doc.setFont('helvetica', 'bold');
            doc.text('Histórico de Sinais Vitais', 14, yPos - 3);
        }

        autoTable(doc, {
            startY: yPos,
            head: [['Data/Hora', 'Categoria', 'Valor', 'Observações']],
            body: tableData,
            theme: 'striped',
            styles: {
                font: 'helvetica',
                fontSize: 9,
                cellPadding: 3,
                textColor: colors.text
            },
            headStyles: {
                fillColor: [241, 245, 249],
                textColor: colors.heading,
                fontStyle: 'bold',
                lineColor: colors.border,
                lineWidth: 0.1
            },
            columnStyles: {
                0: { cellWidth: 40 },
                1: { cellWidth: 40 },
                2: { cellWidth: 35 },
                3: { cellWidth: 'auto' }
            },
            margin: { top: 10, left: 14, right: 14 }
        });

        // Atualizar yPos após a tabela de Sinais
        yPos = doc.lastAutoTable.finalY + 10;

        // --- Tabela de Medicamentos (Se houver) ---
        if (patientMeds.length > 0) {
            // Verificar espaço para próxima tabela
            if (yPos > pageHeight - 40) {
                doc.addPage();
                drawHeader();
                yPos = 55;
            }

            doc.setFontSize(10);
            doc.setTextColor(...colors.heading);
            doc.setFont('helvetica', 'bold');
            doc.text('Histórico de Medicamentos', 14, yPos - 3);

            const medTableData = patientMeds.map(log => {
                // Log should have medicationName attached by caller or we find it
                const medName = log.medicationName || log.medication?.name || 'Medicamento';

                return [
                    format(new Date(log.date + 'T' + log.scheduledTime), "dd/MM/yyyy", { locale: ptBR }),
                    medName,
                    log.scheduledTime,
                    log.status,
                    log.takenByName || '-'
                ];
            });

            autoTable(doc, {
                startY: yPos,
                head: [['Data', 'Medicamento', 'Hora', 'Status', 'Resp.']],
                body: medTableData,
                theme: 'striped',
                styles: {
                    font: 'helvetica',
                    fontSize: 9,
                    cellPadding: 3,
                    textColor: colors.text
                },
                headStyles: {
                    fillColor: [241, 245, 249],
                    textColor: colors.heading,
                    fontStyle: 'bold',
                    lineColor: colors.border,
                    lineWidth: 0.1
                },
                columnStyles: {
                    0: { cellWidth: 25 },
                    1: { cellWidth: 'auto' },
                    2: { cellWidth: 15 },
                    3: { cellWidth: 25, fontStyle: 'bold' },
                    4: { cellWidth: 35 }
                },
                didParseCell: function (data) {
                    if (data.section === 'body' && data.column.index === 3) {
                        const status = data.cell.raw;
                        if (status === 'Tomado') {
                            data.cell.styles.textColor = [22, 101, 52]; // Green
                        } else if (status === 'Não Tomado') {
                            data.cell.styles.textColor = [220, 38, 38]; // Red
                        } else if (status === 'Atrasado') {
                            data.cell.styles.textColor = [217, 119, 6]; // Amber
                        } else {
                            data.cell.styles.textColor = [100, 116, 139]; // Slate
                        }
                    }
                },
                margin: { top: 10, left: 14, right: 14 }
            });

            yPos = doc.lastAutoTable.finalY + 10;
        }

        // --- Tabela de Sintomas (Se houver) ---
        if (patientSymptoms.length > 0) {
            if (yPos > pageHeight - 40) {
                doc.addPage();
                drawHeader();
                yPos = 55;
            }

            doc.setFontSize(10);
            doc.setTextColor(...colors.heading);
            doc.setFont('helvetica', 'bold');
            doc.text('Histórico de Sintomas', 14, yPos - 3);

            const symptomTableData = patientSymptoms.map(log => [
                format(new Date(log.created_at || log.measured_at), "dd/MM/yyyy HH:mm", { locale: ptBR }),
                log.symptom,
                `Nível ${log.intensity}`,
                log.notes || '-'
            ]);

            autoTable(doc, {
                startY: yPos,
                head: [['Data/Hora', 'Sintoma', 'Intensidade', 'Observações']],
                body: symptomTableData,
                theme: 'striped',
                styles: { font: 'helvetica', fontSize: 9, cellPadding: 3, textColor: colors.text },
                headStyles: { fillColor: [241, 245, 249], textColor: colors.heading, fontStyle: 'bold', lineColor: colors.border, lineWidth: 0.1 },
                columnStyles: { 0: { cellWidth: 40 }, 1: { cellWidth: 40 }, 2: { cellWidth: 30 }, 3: { cellWidth: 'auto' } },
                margin: { top: 10, left: 14, right: 14 }
            });

            yPos = doc.lastAutoTable.finalY + 5;
        }
    });

    // --- Footer ---
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.line(14, pageHeight - 15, pageWidth - 14, pageHeight - 15);
        doc.text('SiG Remédios - Diário de Saúde', 14, pageHeight - 10);
        doc.text(`Página ${i} de ${pageCount}`, pageWidth - 14, pageHeight - 10, { align: 'right' });
    }

    return doc;
};

/**
 * Generates a professional PDF report for stock movements
 * @param {Array} stockData - Stock movement data
 * @param {Object} filters - Applied filters
 * @param {Array} patients - List of patients
 * @returns {Promise<jsPDF>}
 */
export const generatePDFStockReport = async (stockData, filters, patients) => {
    const doc = new jsPDF({ orientation: 'landscape' });
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    const colors = {
        primary: [15, 118, 110], // Teal-700
        secondary: [45, 212, 191], // Teal-400
        text: [51, 65, 85], // Slate-700
        heading: [30, 41, 59], // Slate-800
        lightBg: [248, 250, 252], // Slate-50
        border: [226, 232, 240], // Slate-200
        accent: [244, 63, 94] // Rose-500
    };

    let logoData = null;
    try {
        logoData = await loadImage('/assets/logo.png');
    } catch (error) { }

    // --- Header ---
    doc.setFillColor(...colors.primary);
    doc.rect(0, 0, pageWidth, 40, 'F');

    if (logoData) {
        doc.setFillColor(255, 255, 255);
        doc.circle(25, 20, 14, 'F');
        doc.addImage(logoData, 'PNG', 16, 11, 18, 18);
    }

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('Relatório de Estoque', 45, 20);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Histórico de Movimentações e Ajustes', 45, 28);

    doc.setFontSize(9);
    doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy HH:mm")}`, pageWidth - 15, 18, { align: 'right' });

    const period = `${format(new Date(filters.startDate + 'T00:00:00'), "dd/MM/yyyy")} a ${format(new Date(filters.endDate + 'T00:00:00'), "dd/MM/yyyy")}`;
    doc.text(`Período: ${period}`, pageWidth - 15, 26, { align: 'right' });

    let yPos = 55;

    // --- Summary Stats ---
    const totalChanges = stockData.reduce((acc, curr) => acc + Math.abs(curr.quantity_change), 0);
    const refills = stockData.filter(i => i.quantity_change > 0).length;
    const consumptions = stockData.filter(i => i.quantity_change < 0).length;

    const summaryData = [
        { label: 'MOVIMENTAÇÕES', value: stockData.length, color: [59, 130, 246] },
        { label: 'ENTRADAS', value: refills, color: [34, 197, 94] },
        { label: 'SAÍDAS', value: consumptions, color: [249, 115, 22] },
        { label: 'VOLUME TOTAL', value: totalChanges, color: [168, 85, 247] }
    ];

    const cardWidth = (pageWidth - 28 - (summaryData.length - 1) * 5) / summaryData.length;
    let xCurr = 14;

    summaryData.forEach(item => {
        doc.setDrawColor(...colors.border);
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(xCurr, yPos, cardWidth, 16, 2, 2, 'FD');
        doc.setFillColor(...item.color);
        doc.rect(xCurr, yPos + 3, 3, 10, 'F');
        doc.setTextColor(...colors.heading);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(String(item.value), xCurr + 8, yPos + 7);
        doc.setTextColor(100, 116, 139);
        doc.setFontSize(6.5);
        doc.text(item.label, xCurr + 8, yPos + 13);
        xCurr += cardWidth + 5;
    });

    yPos += 25;

    // --- Table ---
    const reasonMap = {
        'consumption': 'Consumo',
        'refill': 'Entrada',
        'adjustment': 'Ajuste',
        'correction': 'Correção'
    };

    const tableData = stockData.map(item => {
        // Combinar dosagem com unidade de medida
        const dosageWithUnit = item.medications?.dosage
            ? `${item.medications.dosage} ${item.medications.type || 'un.'}`.trim()
            : '-';

        return [
            format(new Date(item.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR }),
            item.medications?.name || '-',
            dosageWithUnit,
            (item.quantity_change > 0 ? '+' : '') + item.quantity_change,
            reasonMap[item.reason] || item.reason,
            item.patients?.name || '-',
            item.profiles?.full_name || 'Sistema'
        ];
    });

    autoTable(doc, {
        startY: yPos,
        head: [['Data/Hora', 'Medicamento', 'Dosagem', 'Qtd', 'Motivo', 'Paciente', 'Usuário']],
        body: tableData,
        theme: 'striped',
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [241, 245, 249], textColor: colors.heading, fontStyle: 'bold' },
        columnStyles: {
            3: { fontStyle: 'bold', halign: 'center' },
            4: { halign: 'center' }
        },
        didParseCell: function (data) {
            if (data.section === 'body' && data.column.index === 3) {
                const isPositive = data.cell.raw.startsWith('+');
                data.cell.styles.textColor = isPositive ? [22, 101, 52] : [154, 52, 18];
            }
        },
        margin: { left: 14, right: 14 }
    });

    // --- Footer ---
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.line(14, pageHeight - 15, pageWidth - 14, pageHeight - 15);
        doc.text('SiG Remédios - Gestão de Estoque', 14, pageHeight - 10);
        doc.text(`Página ${i} de ${pageCount}`, pageWidth - 14, pageHeight - 10, { align: 'right' });
    }

    return doc;
};
/**
 * Generates a professional PDF report for Offer Performance
 * @param {Object} sponsor - Sponsor data
 * @param {Array} offers - Filtered offers list
 * @param {Object} totals - Calculated totals (views, clicks, ctr)
 * @param {Object} filters - Period data (startDate, endDate, period)
 * @returns {Promise<jsPDF>}
 */
export const generatePDFOfferReport = async (sponsor, offers, totals, filters) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    const colors = {
        primary: [37, 99, 235], // Blue-600
        heading: [30, 41, 59], // Slate-800
        text: [51, 65, 85], // Slate-700
        border: [226, 232, 240], // Slate-200
        lightBg: [248, 250, 252] // Slate-50
    };

    let logoData = null;
    try {
        logoData = await loadImage('/assets/logo.png');
    } catch (error) { }

    // --- Header ---
    doc.setFillColor(...colors.primary);
    doc.rect(0, 0, pageWidth, 40, 'F');

    if (logoData) {
        doc.setFillColor(255, 255, 255);
        doc.circle(25, 20, 14, 'F');
        doc.addImage(logoData, 'PNG', 16, 11, 18, 18);
    }

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('Performance de Ofertas', 45, 20);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(sponsor.name, 45, 28);

    doc.setFontSize(9);
    doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy HH:mm")}`, pageWidth - 15, 18, { align: 'right' });

    const rangeText = filters.period === 'all' ? 'Todo o histórico' : `${format(new Date(filters.startDate + 'T00:00:00'), "dd/MM/yyyy")} a ${format(new Date(filters.endDate + 'T00:00:00'), "dd/MM/yyyy")}`;
    doc.text(`Período: ${rangeText}`, pageWidth - 15, 26, { align: 'right' });

    let yPos = 55;

    // --- Summary Cards ---
    const summaryData = [
        { label: 'VISUALIZAÇÕES', value: totals.totalViews, color: [59, 130, 246] },
        { label: 'CLIQUES', value: totals.totalClicks, color: [34, 197, 94] },
        { label: 'CTR MÉDIO', value: `${totals.avgCtr.toFixed(1)}%`, color: [249, 115, 22] },
        { label: 'OFERTAS', value: offers.length, color: [168, 85, 247] }
    ];

    const cardWidth = (pageWidth - 28 - (summaryData.length - 1) * 5) / summaryData.length;
    let xCurr = 14;

    summaryData.forEach(item => {
        doc.setDrawColor(...colors.border);
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(xCurr, yPos, cardWidth, 20, 3, 3, 'FD');
        doc.setFillColor(...item.color);
        doc.rect(xCurr, yPos + 4, 3, 12, 'F');
        doc.setTextColor(...colors.heading);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(String(item.value), xCurr + 8, yPos + 10);
        doc.setTextColor(100, 116, 139);
        doc.setFontSize(7);
        doc.text(item.label, xCurr + 8, yPos + 16);
        xCurr += cardWidth + 5;
    });

    yPos += 35;

    // --- Table ---
    doc.setFontSize(12);
    doc.setTextColor(...colors.heading);
    doc.setFont('helvetica', 'bold');
    doc.text('Detalhamento das Ofertas', 14, yPos - 5);

    const tableData = offers.map(o => {
        const ctr = o.views_count > 0 ? (o.clicks_count / o.views_count) * 100 : 0;
        return [
            o.title,
            o.price ? `R$ ${o.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '-',
            o.views_count || 0,
            o.clicks_count || 0,
            `${ctr.toFixed(1)}%`,
            o.active ? 'Ativa' : 'Inativa'
        ];
    });

    autoTable(doc, {
        startY: yPos,
        head: [['Oferta', 'Preço', 'Vis.', 'Cliques', 'CTR', 'Status']],
        body: tableData,
        theme: 'striped',
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [241, 245, 249], textColor: colors.heading, fontStyle: 'bold' },
        columnStyles: {
            0: { cellWidth: 'auto' },
            1: { cellWidth: 25 },
            2: { cellWidth: 20, halign: 'center' },
            3: { cellWidth: 20, halign: 'center' },
            4: { cellWidth: 20, halign: 'center' },
            5: { cellWidth: 20, halign: 'center' }
        },
        margin: { left: 14, right: 14 }
    });

    // --- Footer ---
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.line(14, pageHeight - 15, pageWidth - 14, pageHeight - 15);
        doc.text(`SiG Remédios - Painel do Parceiro: ${sponsor.name}`, 14, pageHeight - 10);
        doc.text(`Página ${i} de ${pageCount}`, pageWidth - 14, pageHeight - 10, { align: 'right' });
    }

    return doc;
};

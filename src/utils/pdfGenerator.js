import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Helper to load image as base64
 */
const loadImage = (url) => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.src = url;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL('image/png'));
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

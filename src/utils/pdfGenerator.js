import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Generates a PDF report for medications
 * @param {Object} reportData - Report data from Reports page
 * @param {Object} filters - Applied filters
 * @param {Array} patients - List of patients
 * @returns {void} - Downloads the PDF
 */
export const generatePDFReport = (reportData, filters, patients) => {
    const doc = new jsPDF();

    // Colors
    const primaryColor = [15, 118, 110]; // Teal-700
    const textColor = [15, 23, 42]; // Slate-900
    const lightGray = [241, 245, 249]; // Slate-100

    // Header
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 210, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('Relatório de Medicações', 105, 20, { align: 'center' });

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    const dateRange = `${format(new Date(reportData.filters.startDate), "dd/MM/yyyy", { locale: ptBR })} até ${format(new Date(reportData.filters.endDate), "dd/MM/yyyy", { locale: ptBR })}`;
    doc.text(dateRange, 105, 30, { align: 'center' });

    // Patient info if filtered
    if (reportData.filters.patientId !== 'all') {
        const patient = patients.find(p => p.id === reportData.filters.patientId);
        if (patient) {
            doc.text(`Paciente: ${patient.name}`, 105, 36, { align: 'center' });
        }
    }

    // Summary section
    let yPos = 50;
    doc.setTextColor(...textColor);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Resumo', 14, yPos);

    yPos += 10;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    // Summary boxes
    const summaryData = [
        { label: 'Total de Doses', value: reportData.summary.total, color: primaryColor },
        { label: 'Tomadas', value: reportData.summary.taken, color: [16, 185, 129] }, // Green
        { label: 'Pendentes', value: reportData.summary.pending, color: [245, 158, 11] }, // Orange
        { label: 'Taxa de Adesão', value: `${reportData.summary.adherenceRate}%`, color: [59, 130, 246] } // Blue
    ];

    const boxWidth = 45;
    const boxHeight = 20;
    let xPos = 14;

    summaryData.forEach((item) => {
        // Box background
        doc.setFillColor(...lightGray);
        doc.roundedRect(xPos, yPos, boxWidth, boxHeight, 2, 2, 'F');

        // Value
        doc.setTextColor(...item.color);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text(String(item.value), xPos + boxWidth / 2, yPos + 10, { align: 'center' });

        // Label
        doc.setTextColor(...textColor);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(item.label, xPos + boxWidth / 2, yPos + 16, { align: 'center' });

        xPos += boxWidth + 3;
    });

    // Table
    yPos += 30;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Detalhamento', 14, yPos);

    yPos += 5;

    // Filter items based on status filter
    const filteredItems = reportData.items.filter(item =>
        filters.status === 'all' || item.status === filters.status
    );

    // Prepare table data
    const tableData = filteredItems.map(item => [
        format(new Date(item.date), "dd/MM/yyyy", { locale: ptBR }),
        item.time,
        item.patient,
        item.medication,
        item.status === 'taken' ? 'Tomado' : 'Pendente'
    ]);

    // Generate table using autoTable
    autoTable(doc, {
        startY: yPos,
        head: [['Data', 'Hora', 'Paciente', 'Medicamento', 'Status']],
        body: tableData,
        theme: 'striped',
        headStyles: {
            fillColor: primaryColor,
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 10
        },
        bodyStyles: {
            fontSize: 9,
            textColor: textColor
        },
        alternateRowStyles: {
            fillColor: lightGray
        },
        columnStyles: {
            0: { cellWidth: 25 }, // Data
            1: { cellWidth: 20 }, // Hora
            2: { cellWidth: 45 }, // Paciente
            3: { cellWidth: 60 }, // Medicamento
            4: { cellWidth: 25 }  // Status
        },
        margin: { top: 10, left: 14, right: 14 }
    });

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text(
            `Gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`,
            14,
            doc.internal.pageSize.height - 10
        );
        doc.text(
            `Página ${i} de ${pageCount}`,
            doc.internal.pageSize.width - 14,
            doc.internal.pageSize.height - 10,
            { align: 'right' }
        );
    }

    // Generate filename
    const filename = `relatorio-medicacoes-${format(new Date(), 'yyyy-MM-dd-HHmm')}.pdf`;

    // Download
    doc.save(filename);
};

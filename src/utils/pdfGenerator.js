import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format, differenceInYears } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Generates a Comprehensive Medical Report PDF
 * @param {Object} data 
 * @param {Object} data.patient - Patient profile info
 * @param {Array} data.logs - All health logs
 * @param {Array} data.medications - Active medications
 * @param {String} data.periodLabel - e.g. "Últimos 30 dias"
 */
// Update signature to accept separated meds
export const generateMedicalReport = async ({ patient, logs, activeMedications, inactiveMedications, periodLabel }) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 20;

    // Brand Colors
    const PRIMARY_COLOR = [16, 185, 129]; // Emerald 500
    const TEXT_DARK = [30, 41, 59]; // Slate 800
    const TEXT_LIGHT = [100, 116, 139]; // Slate 500
    const TEXT_RED = [220, 38, 38]; // Red 600

    let currentY = 0;

    // --- Helper for Page Breaks ---
    // We only need to check if there is enough space for the SECTION HEADER (Title + descriptions).
    // autoTable will handle the table breaking across pages automatically.
    const checkPageBreak = (heightNeeded) => {
        // Strict check: current Y + height needed vs Page Height - Margin - Footer Zone (25)
        if (currentY + heightNeeded > pageHeight - margin - 25) {
            doc.addPage();
            currentY = 30; // Reset to safe top margin (no header bar)
            drawHeader(false);
            drawFooter();
        }
    };

    // --- Helper: Draw Header ---
    const drawHeader = (isFirstPage = true) => {
        if (isFirstPage) {
            // Colored Top Bar Only on First Page
            doc.setFillColor(...PRIMARY_COLOR);
            doc.rect(0, 0, pageWidth, 50, 'F');

            // Title
            doc.setFontSize(26);
            doc.setTextColor(255, 255, 255);
            doc.setFont("helvetica", "bold");
            doc.text("Relatório de Saúde", margin, 25);

            // Subtitle / Date
            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(255, 255, 255);
            const dateStr = format(new Date(), "dd 'de' MMMM, yyyy", { locale: ptBR });
            doc.text(`Gerado em ${dateStr}`, margin, 35);

            // App Name (Right aligned)
            doc.setFontSize(14);
            doc.setFont("helvetica", "bold");
            doc.text("App Remédios", pageWidth - margin, 25, { align: 'right' });

            // Icon placeholder (simple circle)
            doc.setFillColor(255, 255, 255);
            doc.circle(pageWidth - margin - 45, 22, 3, 'F');
        }
    };

    // --- Helper: Draw Footer ---
    const drawFooter = () => {
        const totalPages = doc.internal.getNumberOfPages();
        const currentPage = doc.internal.getCurrentPageInfo().pageNumber;

        doc.setPage(currentPage);

        // Line
        doc.setDrawColor(226, 232, 240);
        doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);

        doc.setFontSize(8);

        // Left: App Name (Shortened to avoid overlap)
        doc.setTextColor(...TEXT_LIGHT);
        doc.text("App Remédios", margin, pageHeight - 10);

        // Center: Website
        doc.setTextColor(...PRIMARY_COLOR);
        const linkText = "sigremedios.vercel.app";
        const linkWidth = doc.getTextWidth(linkText);
        doc.textWithLink(linkText, (pageWidth - linkWidth) / 2, pageHeight - 10, { url: "https://sigremedios.vercel.app" });

        // Right: Page Number
        doc.setTextColor(...TEXT_LIGHT);
        const pageText = `Página ${currentPage} de ${totalPages}`;
        const pageTextWidth = doc.getTextWidth(pageText);
        doc.text(pageText, pageWidth - margin - pageTextWidth, pageHeight - 10);
    };

    // Calculate Age
    let age = "N/A";
    if (patient?.birth_date || patient?.birthDate) {
        const birth = new Date(patient.birth_date || patient.birthDate);
        const today = new Date();
        let y = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
            y--;
        }
        age = `${y} anos`;
    }

    // --- Content Start ---
    drawHeader(true);

    // --- Patient Profile Card ---
    // Reduced height to fit content tighter (Row 4 is at 88, text ends ~92. 55+40=95 is safe)
    doc.setDrawColor(226, 232, 240);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(margin, 55, pageWidth - (margin * 2), 40, 3, 3, 'FD');

    doc.setFontSize(12);
    doc.setTextColor(...PRIMARY_COLOR);
    doc.setFont("helvetica", "bold");
    doc.text("Identificação do Paciente", margin + 6, 65);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...TEXT_DARK);

    // Grid Layout for Info
    const col1 = margin + 6;
    const col2 = margin + 80;
    const row1 = 70;
    const row2 = 76;
    const row3 = 82;
    const row4 = 88;

    // Row 1: Name & Age/DOB
    doc.setFont("helvetica", "bold");
    doc.text("Nome:", col1, row1);
    doc.setFont("helvetica", "normal");
    doc.text(String(patient?.name || "Não informado"), col1 + 15, row1);

    doc.setFont("helvetica", "bold");
    doc.text("Idade:", col2, row1);
    doc.setFont("helvetica", "normal");
    let ageDisplay = "--";
    if (patient?.age) ageDisplay = String(patient.age);
    else if (patient?.birthDate) {
        try { ageDisplay = String(differenceInYears(new Date(), new Date(patient.birthDate))) + " anos"; }
        catch (e) { ageDisplay = "--"; }
    }
    const birthStr = patient?.birthDate ? ` (${format(new Date(patient.birthDate), 'dd/MM/yyyy')})` : '';
    doc.text(`${ageDisplay}${birthStr}`, col2 + 15, row1);

    // Row 2: Allergies & Blood
    doc.setFont("helvetica", "bold");
    doc.text("Alergias:", col1, row2);
    doc.setFont("helvetica", "normal");
    let allergyText = "Não alérgico";
    if (patient?.allergies) {
        if (Array.isArray(patient.allergies) && patient.allergies.length > 0) allergyText = patient.allergies.join(", ");
        else if (typeof patient.allergies === 'string' && patient.allergies.trim() !== '') allergyText = patient.allergies;
    }
    const allergyColor = allergyText !== "Não alérgico" ? TEXT_RED : TEXT_DARK;
    doc.setTextColor(...allergyColor);
    doc.text(String(allergyText || "--"), col1 + 18, row2);
    doc.setTextColor(...TEXT_DARK);

    // Row 3: Contact
    doc.setFont("helvetica", "bold");
    doc.text("Sangue:", col2, row2);
    doc.setFont("helvetica", "normal");
    doc.text(String(patient?.bloodType || patient?.blood_type || "--"), col2 + 15, row2);

    doc.setFont("helvetica", "bold");
    doc.text("Contato:", col1, row3);
    doc.setFont("helvetica", "normal");
    const contactInfo = [patient?.phone, patient?.email].filter(Boolean).join(" | ");
    doc.text(String(contactInfo || "--"), col1 + 18, row3);

    // Row 4: Responsible & Period
    doc.setFont("helvetica", "bold");
    doc.text("Resp.:", col1, row4);
    doc.setFont("helvetica", "normal");
    doc.text(String(patient?.responsibleName || "O Próprio"), col1 + 15, row4);

    doc.setFont("helvetica", "bold");
    doc.text("Período:", col2, row4);
    doc.setFont("helvetica", "normal");
    doc.text(periodLabel || "Histórico Completo", col2 + 15, row4);

    currentY = 110; // Increased spacing after profile card to avoid overlap

    // --- Section: Active Medications ---
    // Only check space for Title (8) + Table Header (approx 10) = ~20
    checkPageBreak(20); // Reduced check
    doc.setFontSize(14);
    doc.setTextColor(...TEXT_DARK);
    doc.setFont("helvetica", "bold");
    doc.text("Medicamentos em Uso", margin, currentY);
    currentY += 6; // Reduced title spacing

    if (activeMedications && activeMedications.length > 0) {
        const medsData = activeMedications.map(med => [
            med.name,
            med.dosage ? `${med.dosage} ${med.unit || ''}` : '-',
            med.frequency || 'Uso Contínuo'
        ]);

        autoTable(doc, {
            startY: currentY,
            head: [['Medicamento', 'Dosagem', 'Frequência']],
            body: medsData,
            theme: 'grid',
            headStyles: { fillColor: PRIMARY_COLOR, textColor: 255, fontStyle: 'bold' },
            styles: { fontSize: 9, cellPadding: 3, textColor: TEXT_DARK }, // Slightly compact padding
            alternateRowStyles: { fillColor: [248, 250, 252] },
            margin: { left: margin, right: margin, bottom: 20 }
        });
        currentY = doc.lastAutoTable.finalY + 10; // Reduced section gap
    } else {
        doc.setFontSize(10);
        doc.setFont("helvetica", "italic");
        doc.setTextColor(...TEXT_LIGHT);
        doc.text("Nenhum medicamento ativo registrado.", margin, currentY);
        currentY += 10;
    }

    // --- Section: Inactive Medications (History) ---
    if (inactiveMedications && inactiveMedications.length > 0) {
        checkPageBreak(20);
        doc.setFontSize(14);
        doc.setTextColor(...TEXT_DARK);
        doc.setFont("helvetica", "bold");
        doc.text("Histórico de Medicamentos", margin, currentY);
        currentY += 6;

        const inactiveData = inactiveMedications.map(med => [
            med.name,
            med.dosage ? `${med.dosage} ${med.unit || ''}` : '-',
            med.endDate ? format(new Date(med.endDate), 'dd/MM/yyyy') : 'Finalizado'
        ]);

        autoTable(doc, {
            startY: currentY,
            head: [['Medicamento', 'Dosagem', 'Data Fim']],
            body: inactiveData,
            theme: 'grid',
            headStyles: { fillColor: [148, 163, 184], textColor: 255, fontStyle: 'bold' }, // Slate 400 for inactive
            styles: { fontSize: 9, cellPadding: 3, textColor: TEXT_LIGHT }, // Lighter text
            alternateRowStyles: { fillColor: [248, 250, 252] },
            margin: { left: margin, right: margin, bottom: 20 }
        });
        currentY = doc.lastAutoTable.finalY + 10;
    }

    // --- Section: Vital Signs ---
    const categories = [
        { id: 'pressure', label: 'Pressão Arterial' },
        { id: 'glucose', label: 'Glicemia' },
        { id: 'heart_rate', label: 'Frequência Cardíaca' },
        { id: 'weight', label: 'Peso Corporal' },
        { id: 'oxygen', label: 'Saturação de Oxigênio' },
        { id: 'temperature', label: 'Temperatura' }
    ];

    for (const cat of categories) {
        const catLogs = logs.filter(l => l.category === cat.id).sort((a, b) => new Date(b.measured_at) - new Date(a.measured_at));

        if (catLogs.length > 0) {
            // Check space for Title(8) + Summary(6) + Header(8) + Row(8) => ~30
            // Breaking at 25 risks orphan headers
            checkPageBreak(25);

            doc.setFontSize(14);
            doc.setTextColor(...TEXT_DARK);
            doc.setFont("helvetica", "bold");
            doc.text(cat.label, margin, currentY);
            currentY += 6;

            // Stats row
            const values = catLogs.map(l => Number(l.value)).filter(n => !isNaN(n));
            const avg = values.reduce((a, b) => a + b, 0) / values.length;
            const min = Math.min(...values);
            const max = Math.max(...values);

            let summary = `Média: ${avg.toFixed(1)}  •  Mín: ${min}  •  Máx: ${max}`;
            if (cat.id === 'pressure') {
                const secValues = catLogs.map(l => Number(l.value_secondary || 0));
                const secAvg = secValues.reduce((a, b) => a + b, 0) / secValues.length;
                summary = `Média Geral: ${avg.toFixed(0)}/${secAvg.toFixed(0)} mmHg`;
            }

            doc.setFontSize(10);
            doc.setTextColor(...PRIMARY_COLOR);
            doc.setFont("helvetica", "bold");
            doc.text(summary, margin, currentY);
            currentY += 5;

            // Table
            const tableData = catLogs.map(log => {
                const dateObj = new Date(log.measured_at || log.created_at);
                let valDisplay = `${log.value}`;
                if (cat.id === 'pressure') valDisplay = `${log.value}/${log.value_secondary}`;
                else if (cat.id === 'glucose') valDisplay += ' mg/dL';
                else if (cat.id === 'weight') valDisplay += ' kg';
                else if (cat.id === 'temperature') valDisplay += ' °C';

                return [
                    format(dateObj, 'dd/MM/yyyy HH:mm'),
                    valDisplay,
                    log.notes || '-'
                ];
            });

            autoTable(doc, {
                startY: currentY,
                head: [['Data/Hora', 'Valor Registrado', 'Observação']],
                body: tableData,
                theme: 'grid',
                headStyles: { fillColor: [241, 245, 249], textColor: TEXT_DARK, fontStyle: 'bold' }, // Slate-100 header
                styles: { fontSize: 9, cellPadding: 3, textColor: TEXT_DARK },
                margin: { left: margin, right: margin, bottom: 20 }
            });
            currentY = doc.lastAutoTable.finalY + 10;
        }
    }

    // Draw footer on all pages
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        drawFooter();
    }

    const fileName = `Relatorio_Medico_${format(new Date(), 'yyyyMMdd_HHmm')}.pdf`;
    doc.save(fileName);
};

/**
 * Generates a Health Diary PDF (Specific for HealthDiary page)
 * Supports Health Logs, Symptoms, and Daily Medication Schedule
 */
export const generatePDFHealthDiary = async (logs, filter, patients, medicationSchedule = [], symptomLogs = []) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 20;
    let currentY = 20;

    // --- Header ---
    doc.setFillColor(16, 185, 129); // Emerald 500
    doc.rect(0, 0, pageWidth, 40, 'F');

    doc.setFontSize(22);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text("Diário de Saúde", margin, 25);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const dateStr = format(new Date(), "dd 'de' MMMM, yyyy", { locale: ptBR });
    doc.text(`Gerado em ${dateStr}`, margin, 35);

    // Filter Info
    doc.setFontSize(10);
    doc.text(`Filtro: ${filter.date ? format(new Date(filter.date), 'dd/MM/yyyy') : 'Geral'}`, pageWidth - margin, 25, { align: 'right' });

    // Patient Name
    if (filter.patientId && filter.patientId !== 'all') {
        const patient = patients.find(p => p.id === filter.patientId);
        if (patient) {
            doc.text(`Paciente: ${patient.name}`, pageWidth - margin, 35, { align: 'right' });
        }
    }

    currentY = 50;

    // --- Section: Symptoms (if any) ---
    if (symptomLogs && symptomLogs.length > 0) {
        doc.setFontSize(14);
        doc.setTextColor(30, 41, 59); // Slate 800
        doc.setFont("helvetica", "bold");
        doc.text("Registro de Sintomas", margin, currentY);
        currentY += 10;

        const symptomData = symptomLogs.map(log => [
            format(new Date(log.created_at || log.measured_at), 'dd/MM HH:mm'),
            log.symptom,
            `Nível ${log.intensity}`,
            log.notes || '-'
        ]);

        autoTable(doc, {
            startY: currentY,
            head: [['Data/Hora', 'Sintoma', 'Intensidade', 'Observação']],
            body: symptomData,
            theme: 'grid',
            headStyles: { fillColor: [249, 115, 22], textColor: 255 }, // Orange for symptoms
            styles: { fontSize: 9, cellPadding: 3 },
            margin: { left: margin, right: margin }
        });
        currentY = doc.lastAutoTable.finalY + 15;
    }

    // --- Section: Health Logs (Vitals) ---
    if (logs && logs.length > 0) {
        doc.setFontSize(14);
        doc.setTextColor(30, 41, 59);
        doc.setFont("helvetica", "bold");
        doc.text("Sinais Vitais", margin, currentY);
        currentY += 10;

        const vitalsData = logs.map(log => {
            let valDisplay = `${log.value}`;
            if (log.category === 'pressure') valDisplay = `${log.value}/${log.value_secondary}`;
            return [
                format(new Date(log.measured_at), 'dd/MM HH:mm'),
                log.category === 'pressure' ? 'Pressão' :
                    log.category === 'glucose' ? 'Glicemia' :
                        log.category === 'weight' ? 'Peso' :
                            log.category === 'temperature' ? 'Temperatura' :
                                log.category === 'oxygen' ? 'Saturação' : 'Outro',
                valDisplay,
                log.notes || '-'
            ];
        });

        autoTable(doc, {
            startY: currentY,
            head: [['Data/Hora', 'Categoria', 'Valor', 'Observação']],
            body: vitalsData,
            theme: 'grid',
            headStyles: { fillColor: [59, 130, 246], textColor: 255 }, // Blue
            styles: { fontSize: 9, cellPadding: 3 },
            margin: { left: margin, right: margin }
        });
        currentY = doc.lastAutoTable.finalY + 15;
    }

    // --- Section: Medication Schedule (if specific day view) ---
    if (medicationSchedule && medicationSchedule.length > 0) {
        // Check page break
        if (currentY > pageHeight - 50) {
            doc.addPage();
            currentY = 30;
        }

        doc.setFontSize(14);
        doc.setTextColor(30, 41, 59);
        doc.setFont("helvetica", "bold");
        doc.text("Cronograma de Medicamentos", margin, currentY);
        currentY += 10;

        const medsData = medicationSchedule.map(item => [
            item.scheduledTime,
            item.medicationName,
            item.status,
            item.takenByName || '-'
        ]);

        autoTable(doc, {
            startY: currentY,
            head: [['Horário', 'Medicamento', 'Status', 'Confirmado Por']],
            body: medsData,
            theme: 'grid',
            headStyles: { fillColor: [16, 185, 129], textColor: 255 }, // Emerald
            styles: { fontSize: 9, cellPadding: 3 },
            createdCell: (cell, data) => {
                if (data.column.index === 2) { // Status column
                    if (cell.raw === 'Tomado') {
                        cell.styles.textColor = [22, 163, 74];
                        cell.styles.fontStyle = 'bold';
                    } else if (cell.raw === 'Atrasado' || cell.raw === 'Não Tomado') {
                        cell.styles.textColor = [220, 38, 38];
                    }
                }
            },
            margin: { left: margin, right: margin }
        });
    }

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Página ${i} de ${pageCount} - App Remédios`, margin, pageHeight - 10);
    }

    return doc;
};

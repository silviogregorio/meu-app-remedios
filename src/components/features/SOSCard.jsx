import React, { useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../../context/AppContext';
import { Heart, AlertTriangle, Phone, Printer, X, Droplet, Mail, MessageCircle } from 'lucide-react';
import Button from '../ui/Button';

const SOSCard = ({ onClose }) => {
    const { patients, prescriptions, user } = useApp();
    const printRef = useRef();

    // Add class to body when mounted to handle print styles
    useEffect(() => {
        document.body.classList.add('printing-sos');
        return () => {
            document.body.classList.remove('printing-sos');
        };
    }, []);

    // Filter patients explicitly owned by user or shared with high permissions?
    // For SOS, we show ALL accessible patients because the user might be the caregiver looking for info.
    // Ideally, we let the user select WHICH patient is in emergency.
    // If only 1 patient, show it. If multiple, show tabs or list.
    // Let's implement a simple Patient Selector/List.

    const [selectedPatientId, setSelectedPatientId] = React.useState(
        patients.length > 0 ? patients[0].id : null
    );

    const selectedPatient = patients.find(p => p.id === selectedPatientId);

    // Filter Active Prescriptions for this patient
    const activePrescriptions = prescriptions.filter(p => {
        if (p.patientId !== selectedPatientId) return false;

        // Continuous Use OR EndDate >= Today
        if (p.continuousUse) return true;

        const today = new Date().toISOString().split('T')[0];
        return p.endDate >= today;
    });

    const [emailModalOpen, setEmailModalOpen] = React.useState(false);
    const [emailAddress, setEmailAddress] = React.useState('');
    const [sendingEmail, setSendingEmail] = React.useState(false);
    const [generatingPDF, setGeneratingPDF] = React.useState(false);
    const { showToast } = useApp();

    const handleEmail = () => {
        setEmailModalOpen(true);
    };

    const sendSOSViaEmail = async (e) => {
        e.preventDefault();
        setSendingEmail(true);

        try {
            // Prepare Data for Email Template
            const medicationsList = activePrescriptions.map(p => {
                const med = useApp().medications.find(m => m.id === p.medicationId);
                return `• ${med?.name || 'Medicamento'} (${med?.dosage || ''}) - ${p.frequency}`;
            }).join('<br>');

            const sosData = {
                patientName: selectedPatient.name,
                bloodType: selectedPatient.bloodType,
                allergies: selectedPatient.allergies,
                conditions: selectedPatient.condition,
                medications: medicationsList,
                contacts: [{ name: 'Responsável', phone: user?.phone || 'Ver app' }], // Basic contact info
                observations: 'Gerado via SOS Digital'
            };

            const response = await fetch('/api/send-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${(await useApp().supabase.auth.getSession()).data.session?.access_token}`
                },
                body: JSON.stringify({
                    to: emailAddress,
                    subject: `🚨 SOS Médico: ${selectedPatient.name}`,
                    text: `Informações de emergência de ${selectedPatient.name}.`,
                    type: 'sos',
                    sosData: sosData
                })
            });

            if (response.ok) {
                showToast('Email de SOS enviado com sucesso!', 'success');
                setEmailModalOpen(false);
                setEmailAddress('');
            } else {
                throw new Error('Falha no envio');
            }
        } catch (error) {
            console.error(error);
            showToast('Erro ao enviar email.', 'error');
        } finally {
            setSendingEmail(false);
        }
    };

    const handleWhatsApp = async () => {
        setGeneratingPDF(true);
        try {
            const html2canvas = (await import('html2canvas')).default;
            const { jsPDF } = await import('jspdf');

            const canvas = await html2canvas(printRef.current, {
                scale: 2,
                backgroundColor: '#ffffff',
                useCORS: true // Handle images if any
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

            // Try Native Share with File (Mobile)
            const blob = pdf.output('blob');
            const file = new File([blob], `SOS_${selectedPatient.name.replace(/\s+/g, '_')}.pdf`, { type: 'application/pdf' });

            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: `SOS Médico - ${selectedPatient.name}`,
                    text: 'Segue ficha médica de emergência.'
                });
                showToast('PDF compartilhado!', 'success');
            } else {
                // Determine if we are on a mobile device where we want to trigger WhatsApp specifically?
                // Actually, if Web Share fails, we download it and tell user to send.
                // Or we can try to "Open" it.
                // For "WhatsApp", usually a link is needed, but we can't send files via 'wa.me' link easily without uploading first.
                // So "Download" is the robust fallback.
                pdf.save(`SOS_${selectedPatient.name}.pdf`);
                showToast('PDF baixado! Envie pelo WhatsApp.', 'info');

                // Optional: Open WhatsApp Web with text, but file must be attached manually
                // window.open(`https://wa.me/?text=Estou%20enviando%20minha%20ficha%20médica%20(anexo).`, '_blank');
            }

        } catch (error) {
            console.error(error);
            showToast('Erro ao gerar PDF.', 'error');
        } finally {
            setGeneratingPDF(false);
        }
    };

    return createPortal(content, document.body);
};


// ... (Existing Render) ...

{/* Footer Actions */ }
<div className="p-4 border-t border-slate-100 bg-slate-50 flex flex-col md:flex-row gap-3 print:hidden">
    <Button variant="outline" onClick={onClose} className="md:w-auto w-full order-last md:order-first">
        Fechar
    </Button>

    <div className="flex gap-2 w-full md:w-auto flex-1 justify-end">
        <Button
            className="flex-1 md:flex-none bg-indigo-600 hover:bg-indigo-700 text-white"
            onClick={handleEmail}
        >
            <Mail size={18} className="mr-2" />
            Email
        </Button>
        <Button
            className="flex-1 md:flex-none bg-green-600 hover:bg-green-700 text-white"
            onClick={handleWhatsApp}
            disabled={generatingPDF}
        >
            {generatingPDF ? 'Gerando...' : (
                <>
                    <MessageCircle size={18} className="mr-2" />
                    WhatsApp / PDF
                </>
            )}
        </Button>
        <Button
            className="flex-1 md:flex-none bg-slate-900 hover:bg-slate-800 text-white shadow-lg"
            onClick={handlePrint}
        >
            <Printer size={18} className="mr-2" />
            Imprimir
        </Button>
    </div>
</div>

{/* Email Modal Overlay */ }
{
    emailModalOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-in zoom-in-95">
                <h3 className="text-xl font-bold text-slate-900 mb-2">Enviar SOS por Email</h3>
                <p className="text-sm text-slate-500 mb-4">Enviaremos este cartão com formatação profissional.</p>
                <form onSubmit={sendSOSViaEmail}>
                    <input
                        type="email"
                        required
                        placeholder="Email do destinatário"
                        className="w-full px-4 py-3 rounded-xl border border-slate-300 mb-4 focus:ring-2 focus:ring-indigo-500 outline-none"
                        value={emailAddress}
                        onChange={e => setEmailAddress(e.target.value)}
                    />
                    <div className="flex gap-3">
                        <Button type="button" variant="ghost" className="flex-1" onClick={() => setEmailModalOpen(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" className="flex-1 bg-indigo-600 text-white" disabled={sendingEmail}>
                            {sendingEmail ? 'Enviando...' : 'Enviar'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}
            </div >
        </div >
    );

// Helper for user icon
const UserIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
);

export default SOSCard;

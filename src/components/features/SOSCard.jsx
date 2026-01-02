import React, { useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../../context/AppContext';
import { Heart, AlertTriangle, Phone, Printer, X, Droplet, Mail, MessageCircle, Download } from 'lucide-react';
import Button from '../ui/Button';
import { getISODate } from '../../utils/dateFormatter';

import { supabase } from '../../lib/supabase';
import { getApiEndpoint } from '../../config/api';
import confetti from 'canvas-confetti';

const SOSCard = ({ onClose }) => {
    const { patients, prescriptions, user, medications, triggerPanicAlert, showToast } = useApp();
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

    useEffect(() => {
        if (!selectedPatientId && patients.length > 0) {
            setSelectedPatientId(patients[0].id);
        }
    }, [patients, selectedPatientId]);

    const selectedPatient = patients.find(p => p.id === selectedPatientId);

    if (!selectedPatient) {
        // Fallback UI or Loading
        return createPortal(
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                <div className="bg-white p-6 rounded-2xl max-w-sm w-full text-center shadow-2xl relative">
                    <div className="absolute top-2 right-2">
                        <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
                            <X size={20} />
                        </Button>
                    </div>
                    <div className="mb-4 text-amber-500 flex justify-center">
                        <AlertTriangle size={48} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">Nenhum Paciente Encontrado</h3>
                    <p className="text-slate-500 mb-6 text-sm">Cadastre um paciente ou aguarde o carregamento dos dados para gerar o Cartão SOS.</p>
                    <Button onClick={onClose} className="w-full">Fechar</Button>
                </div>
            </div>,
            document.body
        );
    }

    // Filter Active Prescriptions for this patient
    const activePrescriptions = prescriptions.filter(p => {
        if (p.patientId !== selectedPatientId) return false;

        // Continuous Use OR EndDate >= Today
        if (p.continuousUse) return true;

        const today = getISODate();
        return p.endDate >= today;
    });

    const [emailModalOpen, setEmailModalOpen] = React.useState(false);
    const [emailAddress, setEmailAddress] = React.useState('');
    const [sendingEmail, setSendingEmail] = React.useState(false);
    const [generatingPDF, setGeneratingPDF] = React.useState(false);

    const handleEmail = () => {
        setEmailModalOpen(true);
    };

    const sendSOSViaEmail = async (e) => {
        e.preventDefault();
        setSendingEmail(true);

        try {
            console.log('User Data being used for SOS:', user);
            // Prepare Data for Email Template
            const medicationsList = activePrescriptions.map(p => {
                const med = medications.find(m => m.id === p.medicationId);
                return `• ${med?.name || 'Medicamento'} (${med?.dosage || ''}) - ${p.frequency}`;
            }).join('<br>');

            const sosData = {
                patientName: selectedPatient.name,
                bloodType: selectedPatient.bloodType,
                allergies: selectedPatient.allergies,
                conditions: selectedPatient.condition,
                medications: medicationsList,
                contacts: [{
                    name: 'Responsável',
                    phone: selectedPatient.phone || user?.phone || 'Ver app'
                }], // Basic contact info
                observations: 'Gerado via SOS Digital'
            };

            const response = await fetch(getApiEndpoint('/api/send-email'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
                },
                body: JSON.stringify({
                    to: emailAddress,
                    subject: `🚨 SOS Médico: ${selectedPatient.name}`,
                    text: `Informações de emergência de ${selectedPatient.name}.`,
                    type: 'sos',
                    sosData: {
                        patientName: selectedPatient.name,
                        patientEmail: selectedPatient.email,
                        patientPhone: selectedPatient.phone,
                        bloodType: selectedPatient.bloodType,
                        allergies: selectedPatient.allergies,
                        conditions: selectedPatient.condition,
                        medications: medicationsList,
                        contacts: [{
                            name: user?.user_metadata?.full_name || user?.email || 'Responsável',
                            phone: selectedPatient.phone || user?.phone || user?.user_metadata?.phone || 'Não informado'
                        }],
                        observations: 'Gerado via SOS Digital'
                    }
                })
            });

            if (response.ok) {
                showToast('Email de SOS enviado com sucesso!', 'success');
                confetti({
                    particleCount: 150,
                    spread: 70,
                    origin: { y: 0.6 },
                    zIndex: 9999,
                    colors: ['#ef4444', '#b91c1c', '#ffffff'] // Red and White theme
                });
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

    const handleWhatsAppText = () => {
        // Create a summary text with medication times
        const medsText = activePrescriptions.map(p => {
            const med = medications.find(m => m.id === p.medicationId);
            const times = p.times?.join(', ') || 'Sob demanda';
            return `- ${med?.name} (${med?.dosage}) - ${times}`;
        }).join('\n');

        const emojiSiren = String.fromCodePoint(0x1F6A8);   // 🚨
        const emojiUser = String.fromCodePoint(0x1F464);    // 👤
        const emojiDrop = String.fromCodePoint(0x1FA78);    // 🩸 (Tipo Sanguíneo)
        const emojiWarning = String.fromCodePoint(0x26A0);  // ⚠️
        const emojiActivity = String.fromCodePoint(0x1F4C8);// 📈
        const emojiCapsule = String.fromCodePoint(0x1F48A); // 💊
        const emojiPhone = String.fromCodePoint(0x1F4DE);   // 📞
        const emojiLink = String.fromCodePoint(0x1F517);    // 🔗

        const text = `${emojiSiren} *SOS MÉDICO - EMERGÊNCIA*\n\n` +
            `${emojiUser} *Paciente:* ${selectedPatient.name}\n` +
            (selectedPatient.bloodType ? `${emojiDrop} *Tipo Sanguíneo:* ${selectedPatient.bloodType}\n` : '') +
            (selectedPatient.allergies ? `${emojiWarning} *Alergias:* ${selectedPatient.allergies}\n` : '') +
            (selectedPatient.condition ? `${emojiActivity} *Condição:* ${selectedPatient.condition}\n` : '') +
            `\n${emojiCapsule} *Medicamentos:*\n${medsText}\n\n` +
            `${emojiUser} *Responsável:* ${user?.user_metadata?.full_name || 'Ver Contato'}\n` +
            `${emojiPhone} *Contato:* ${user?.phone || 'N/A'}\n\n` +
            `${emojiLink} _Enviado via SiG Remédios_\nhttps://sigremedios.vercel.app`;

        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    };

    const handleDownloadPDF = async () => {
        setGeneratingPDF(true);
        try {
            const html2canvas = (await import('html2canvas')).default;
            const { jsPDF } = await import('jspdf');

            const canvas = await html2canvas(printRef.current, {
                scale: 2,
                backgroundColor: '#ffffff',
                useCORS: true
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

            // Force Download directly
            pdf.save(`SOS_${selectedPatient.name.replace(/\s+/g, '_')}.pdf`);
            showToast('PDF baixado com sucesso!', 'success');

        } catch (error) {
            console.error(error);
            showToast('Erro ao gerar PDF.', 'error');
        } finally {
            setGeneratingPDF(false);
        }
    };

    const handlePrint = () => window.print();

    const content = (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 print:p-0 print:block animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl relative flex flex-col max-h-[90vh] print:shadow-none print:w-full print:max-w-none print:h-auto print:rounded-none overflow-hidden">
                <div className="absolute top-4 right-4 z-10 print:hidden">
                    <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full bg-white/50 hover:bg-slate-100">
                        <X size={20} />
                    </Button>
                </div>

                {/* Patient Selector - Fixed at top */}
                {patients.length > 1 && (
                    <div className="px-6 pt-6 pb-4 border-b border-slate-100 print:hidden shrink-0" data-html2canvas-ignore="true">
                        <div className="bg-slate-100/80 p-1.5 rounded-3xl">
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5">
                                {patients.map(p => (
                                    <button
                                        key={p.id}
                                        onClick={() => setSelectedPatientId(p.id)}
                                        className={`flex items-center justify-center px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-300 ${selectedPatientId === p.id
                                            ? 'bg-white text-primary shadow-sm ring-1 ring-slate-200/50'
                                            : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
                                            }`}
                                    >
                                        <span className="truncate">{p.name.split(' ')[0]}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                <div className="overflow-y-auto flex-1 custom-scrollbar">
                    <div className="p-6 space-y-6" ref={printRef}>

                        {/* 1. Patient Info */}
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-bold text-slate-900 mb-1 leading-tight">
                                    {selectedPatient.name}
                                </h1>
                                <p className="text-slate-500 font-medium">
                                    Nascimento: {selectedPatient.birthDate ? new Date(selectedPatient.birthDate).toLocaleDateString('pt-BR') : 'N/A'}
                                </p>
                                {(selectedPatient.email || selectedPatient.phone) && (
                                    <div className="flex flex-col gap-1 mt-2 text-sm text-slate-500">
                                        {selectedPatient.email && (
                                            <div className="flex items-center gap-1">
                                                <Mail size={14} className="text-slate-400" />
                                                <span>{selectedPatient.email}</span>
                                            </div>
                                        )}
                                        {selectedPatient.phone && (
                                            <div className="flex items-center gap-1">
                                                <Phone size={14} className="text-slate-400" />
                                                <span>{selectedPatient.phone}</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                            {selectedPatient.bloodType && (
                                <div className="bg-red-50 border-2 border-red-100 px-4 py-3 rounded-2xl flex flex-col items-center justify-center min-w-[80px]">
                                    <Droplet className="text-red-500 mb-1" size={20} fill="currentColor" />
                                    <span className="text-xs text-red-400 font-bold uppercase tracking-wider">Tipo</span>
                                    <span className="text-xl font-black text-red-700">{selectedPatient.bloodType}</span>
                                </div>
                            )}
                        </div>

                        {/* 2. WARNINGS (Allergies & Conditions) */}
                        <div className="space-y-3">
                            {selectedPatient.allergies && (
                                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
                                    <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={24} />
                                    <div>
                                        <h4 className="font-bold text-amber-800 uppercase text-xs tracking-wider mb-1">Alergias & Intolerâncias</h4>
                                        <p className="font-bold text-amber-900 text-lg leading-snug">
                                            {selectedPatient.allergies}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {selectedPatient.condition && (
                                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                                    <h4 className="font-bold text-blue-800 uppercase text-xs tracking-wider mb-1">Condição Médica Principal</h4>
                                    <p className="font-bold text-blue-900 text-lg">
                                        {selectedPatient.condition}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* 3. Medication List */}
                        <div>
                            <h3 className="font-bold text-slate-900 border-b pb-2 mb-4 flex items-center justify-between">
                                <span>Medicamentos em Uso ({activePrescriptions.length})</span>
                                <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-1 rounded">Visualizado: {new Date().toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                            </h3>

                            {activePrescriptions.length === 0 ? (
                                <p className="text-slate-400 italic text-center py-4">Nenhum medicamento ativo registrado.</p>
                            ) : (
                                <div className="grid gap-3">
                                    {activePrescriptions.map(presc => {
                                        const med = useApp().medications.find(m => m.id === presc.medicationId);
                                        return (
                                            <div key={presc.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                                                <div>
                                                    <p className="font-bold text-slate-900">
                                                        {med ? med.name : 'Medicamento Desconhecido'}
                                                        <span className="text-slate-500 font-normal ml-2 text-sm">
                                                            {med?.dosage}
                                                        </span>
                                                    </p>
                                                    <p className="text-sm text-slate-600 mt-0.5">
                                                        {presc.frequency}
                                                        {presc.continuousUse && <span className="text-blue-600 font-bold ml-2 text-xs bg-blue-50 px-1.5 rounded">Uso Contínuo</span>}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* 4. Contact Info */}
                        <div className="bg-slate-900 text-slate-300 rounded-xl p-4 mt-6 print:bg-slate-100 print:text-black">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 print:text-black">Responsável / Cuidador</h4>
                            <div className="flex items-center gap-3">
                                <div className="bg-slate-800 p-2.5 rounded-full print:bg-white print:border">
                                    <UserIcon user={user} />
                                </div>
                                <div>
                                    <p className="font-bold text-white text-lg print:text-black">
                                        {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuário'}
                                    </p>
                                    <p className="text-slate-400 text-sm print:text-slate-600">
                                        {user?.email}
                                    </p>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-4 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row gap-3 print:hidden flex-wrap">
                    <Button variant="outline" onClick={onClose} className="w-full sm:w-auto order-last sm:order-first">
                        Fechar
                    </Button>

                    <div className="flex gap-2 w-full sm:w-auto flex-1 justify-end flex-wrap">
                        <Button
                            className="flex-1 sm:flex-none bg-indigo-600 hover:bg-indigo-700 text-white whitespace-nowrap"
                            onClick={handleEmail}
                        >
                            <Mail size={18} className="mr-2" />
                            Email
                        </Button>

                        <Button
                            className="flex-1 sm:flex-none bg-green-500 hover:bg-green-600 text-white whitespace-nowrap"
                            onClick={handleWhatsAppText}
                        >
                            <MessageCircle size={18} className="mr-2" />
                            Enviar ZAP
                        </Button>

                        <Button
                            className="flex-1 sm:flex-none bg-red-600 hover:bg-red-700 text-white shadow-lg whitespace-nowrap animate-pulse"
                            onClick={async () => {
                                if (!navigator.geolocation) {
                                    showToast('Geolocalização não suportada.', 'error');
                                    return;
                                }
                                showToast('Obtendo localização...', 'info');
                                navigator.geolocation.getCurrentPosition(async (pos) => {
                                    await triggerPanicAlert(selectedPatientId, pos.coords.latitude, pos.coords.longitude);
                                    onClose(); // Fechar popup após enviar
                                }, () => showToast('Erro ao obter localização. Verifique as permissões.', 'error'));
                            }}
                        >
                            <AlertTriangle size={18} className="mr-2" />
                            Acionar Socorro
                        </Button>

                        <Button
                            className="flex-1 sm:flex-none bg-emerald-700 hover:bg-emerald-800 text-white whitespace-nowrap"
                            onClick={handleDownloadPDF}
                            disabled={generatingPDF}
                        >
                            {generatingPDF ? '...' : (
                                <>
                                    <Download size={18} className="mr-2" />
                                    Baixar PDF
                                </>
                            )}
                        </Button>

                        <Button
                            className="flex-1 sm:flex-none bg-slate-900 hover:bg-slate-800 text-white shadow-lg whitespace-nowrap"
                            onClick={handlePrint}
                        >
                            <Printer size={18} className="mr-2" />
                            Imprimir
                        </Button>
                    </div>
                </div>

                {/* Email Modal Overlay */}
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

    return createPortal(content, document.body);
};

// Helper for user icon
const UserIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
);

export default SOSCard;

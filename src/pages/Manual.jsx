import React from 'react';
import {
    Home, Users, Pill, ClipboardList, Heart, FileText, Share2,
    User, BookOpen, CheckCircle, AlertCircle, Clock, Shield
} from 'lucide-react';
import Card, { CardContent } from '../components/ui/Card';

const ManualSection = ({ title, icon: Icon, color, children, delay }) => (
    <div
        className={`flex flex-col gap-4 p-6 rounded-2xl border border-slate-100 bg-white shadow-sm hover:shadow-md transition-all duration-500 animate-in slide-in-from-bottom-4 fade-in`}
        style={{ animationDelay: `${delay}ms` }}
    >
        <div className={`flex items-center gap-3 pb-4 border-b border-slate-50`}>
            <div className={`p-3 rounded-xl ${color} bg-opacity-20`}>
                <Icon size={24} className={color.replace('bg-', 'text-').replace('bg-opacity-20', '')} />
            </div>
            <h2 className="text-xl font-bold text-slate-800">{title}</h2>
        </div>
        <div className="text-slate-600 space-y-3 leading-relaxed">
            {children}
        </div>
    </div>
);

import { useNavigate } from 'react-router-dom';

const Manual = () => {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col gap-8 pb-24">
            {/* Hero Section */}
            <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 to-violet-600 rounded-3xl p-8 md:p-12 text-white shadow-xl animate-in fade-in duration-700">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <BookOpen size={200} />
                </div>
                <div className="relative z-10 max-w-2xl">
                    <div className="inline-flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full text-sm font-medium mb-4 backdrop-blur-sm border border-white/20">
                        <BookOpen size={16} />
                        <span>Central de Ajuda</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight">Manual do Usuário</h1>
                    <p className="text-indigo-100 text-lg md:text-xl leading-relaxed">
                        Domine cada detalhe do aplicativo. Um guia visual completo para você tirar o máximo proveito de todas as funcionalidades.
                    </p>
                </div>
            </div>

            {/* Grid of Features */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                <ManualSection title="Tela Inicial (O Seu Dia)" icon={Home} color="bg-blue-500" delay={100}>
                    <p>
                        A <strong>Tela Inicial</strong> é o seu painel de controle diário. Aqui você vê exatamente o que precisa fazer <strong>HOJE</strong>.
                    </p>
                    <ul className="space-y-2 mt-2">
                        <li className="flex items-start gap-2">
                            <Clock size={18} className="text-blue-500 mt-1 shrink-0" />
                            <span><strong>Próxima Dose:</strong> Um cartão destaque mostra o próximo remédio do dia para você não perder a hora.</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <CheckCircle size={18} className="text-green-500 mt-1 shrink-0" />
                            <span><strong>Marcar como Tomado:</strong> Clique no botão de "check" ✅ para confirmar que tomou o remédio. Ele sai da lista de pendentes!</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <AlertCircle size={18} className="text-amber-500 mt-1 shrink-0" />
                            <span><strong>Alertas de Estoque:</strong> Avisamos quando seus remédios estão acabando (3 dias antes).</span>
                        </li>
                    </ul>
                </ManualSection>

                <ManualSection title="Pacientes" icon={Users} color="bg-pink-500" delay={200}>
                    <p>
                        Aqui é onde você cadastra <strong>quem</strong> vai tomar os remédios. Pode ser você, seu filho, seu pai ou até seu pet! 🐶
                    </p>
                    <ul className="space-y-2 mt-2">
                        <li className="flex items-start gap-2">
                            <Share2 size={18} className="text-pink-500 mt-1 shrink-0" />
                            <span><strong>Compartilhamento Individual:</strong> Quer que a enfermeira veja só o Vovô? Clique em "Compartilhar" dentro do cartão dele aqui.</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <Shield size={18} className="text-slate-400 mt-1 shrink-0" />
                            <span><strong>Dados Seguros:</strong> Guardamos endereço, telefone e condição de saúde para emergências.</span>
                        </li>
                    </ul>
                </ManualSection>

                <ManualSection title="Medicamentos & Estoque" icon={Pill} color="bg-emerald-500" delay={300}>
                    <p>
                        Cadastre sua "farmácia virtual". Diferente das receitas, aqui você diz <strong>O QUE</strong> você tem, não quando tomar.
                    </p>
                    <ul className="space-y-2 mt-2">
                        <li className="flex items-start gap-2">
                            <div className="w-4 h-4 rounded-full bg-emerald-500 mt-1.5" />
                            <span><strong>Controle de Estoque:</strong> Marque a caixa "Controlar Estoque" e o app desconta automaticamente cada vez que você toma! 📉</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <div className="w-4 h-4 rounded-full bg-emerald-500 mt-1.5" />
                            <span><strong>Bula e Dosagem:</strong> Registre a miligramagem para evitar confusões de dosagem.</span>
                        </li>
                    </ul>
                </ManualSection>

                <ManualSection title="Prescrições (O Agendamento)" icon={ClipboardList} color="bg-violet-500" delay={400}>
                    <p>
                        O cérebro do app! 🧠 Aqui você conecta: <strong>Paciente + Medicamento + Horário</strong>.
                    </p>
                    <div className="bg-violet-50 p-4 rounded-xl text-sm text-violet-800 border border-violet-100">
                        <strong>Como funciona:</strong> Defina o intervalo (ex: a cada 8h) ou horários fixos. O app cuidará de criar os lembretes automáticos para você.
                    </div>
                </ManualSection>

                <ManualSection title="Diário de Saúde" icon={Heart} color="bg-rose-500" delay={500}>
                    <p>
                        Sentiu algo estranho? Registre aqui! O Diário serve para anotar sintomas, pressão arterial, febre ou qualquer ocorrência importante.
                    </p>
                    <p>
                        Esses dados aparecem depois no <strong>Relatório</strong>, ajudando o médico a entender a evolução do tratamento.
                    </p>
                </ManualSection>

                <ManualSection title="Relatórios & WhatsApp" icon={FileText} color="bg-orange-500" delay={600}>
                    <p>
                        Gere um relatório completo com todo o histórico de uso e sintomas. Você pode enviar o PDF ou um resumo em texto direto para o WhatsApp do médico ou cuidador. 📄
                    </p>
                </ManualSection>

                <ManualSection title="SOS & Emergência" icon={AlertCircle} color="bg-red-600" delay={700}>
                    <p>
                        <strong>O Botão de Pânico:</strong> Quando ativado, o SOS envia um alerta imediato com sua <strong>localização em tempo real</strong> para todos os seus cuidadores cadastrados.
                    </p>
                    <p className="text-sm font-bold text-red-700 bg-red-50 p-3 rounded-lg border border-red-100">
                        Certifique-se de preencher o "Contato de Emergência" no seu Perfil para esta função funcionar.
                    </p>
                </ManualSection>

                <ManualSection title="Perfil & Segurança" icon={User} color="bg-slate-700" delay={800}>
                    <p>
                        Gerencie sua conta e privacidade. Aqui você pode:
                    </p>
                    <ul className="space-y-1 text-sm list-disc pl-4">
                        <li>Ativar a <strong>Verificação em Duas Etapas (2FA)</strong> para proteger sua conta.</li>
                        <li>Configurar se você é o paciente principal (<em>Is Self</em>).</li>
                        <li>Trocar sua foto e senha de acesso.</li>
                    </ul>
                </ManualSection>

                <ManualSection title="Acessibilidade" icon={CheckCircle} color="bg-cyan-600" delay={900}>
                    <p>
                        Ajuste o app para o seu conforto visual:
                    </p>
                    <ul className="space-y-1 text-sm list-disc pl-4">
                        <li><strong>Modo Escuro:</strong> Ideal para usar à noite.</li>
                        <li><strong>Alto Contraste:</strong> Facilita a leitura para quem tem baixa visão.</li>
                        <li><strong>Daltônicos:</strong> Ajuste de cores para melhor distinção.</li>
                    </ul>
                </ManualSection>

                <ManualSection title="Parceiros & Ofertas" icon={Pill} color="bg-pink-600" delay={1000}>
                    <p>
                        Economize na compra dos seus remédios! Através da sua localização, mostramos farmácias parceiras que oferecem descontos exclusivos para usuários do app.
                    </p>
                </ManualSection>

                <ManualSection title="Tipos de Compartilhamento" icon={Share2} color="bg-indigo-500" delay={1100}>
                    <div className="space-y-3">
                        <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                            <p className="text-xs font-black uppercase text-indigo-600 mb-1">Acesso Geral (Barra Lateral)</p>
                            <p className="text-sm">Dá acesso a <strong>TUDO</strong> na sua conta. Use apenas para familiares muito próximos ou cônjuges.</p>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                            <p className="text-xs font-black uppercase text-slate-600 mb-1">Acesso por Paciente (Menu Paciente)</p>
                            <p className="text-sm">Dá acesso <strong>APENAS</strong> aos dados daquela pessoa específica. Ideal para cuidadores ou médicos.</p>
                        </div>
                    </div>
                </ManualSection>

            </div>

            {/* Final Call to Action */}
            <div className="text-center mt-8 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-700">
                <p className="text-slate-400 mb-4">Ainda tem dúvidas?</p>
                <button
                    onClick={() => navigate('/contact')}
                    className="text-primary font-bold hover:underline"
                >
                    Fale com nosso Suporte
                </button>
            </div>
        </div>
    );
};

export default Manual;

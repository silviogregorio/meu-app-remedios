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

const Manual = () => {
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
                            <span><strong>Controle de Estoque:</strong> Marque a caixa "Controlar Estoque" e diga quantos comprimidos tem na caixa. O app desconta automaticamente cada vez que você toma! 📉</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <div className="w-4 h-4 rounded-full bg-emerald-500 mt-1.5" />
                            <span><strong>Bula e Dosagem:</strong> Registre a miligramagem (ex: 500mg) para evitar confusões.</span>
                        </li>
                    </ul>
                </ManualSection>

                <ManualSection title="Prescrições (Agendamentos)" icon={ClipboardList} color="bg-violet-500" delay={400}>
                    <p>
                        O cérebro do app! 🧠 Aqui você conecta: <strong>Paciente + Medicamento + Horário</strong>.
                    </p>
                    <div className="bg-violet-50 p-3 rounded-lg text-sm text-violet-800">
                        <strong>Exemplo:</strong> "Dona Maria" deve tomar "Dipirona" todos os dias às "08:00" e "20:00" até "30/12".
                    </div>
                </ManualSection>

                <ManualSection title="Diário de Saúde" icon={Heart} color="bg-rose-500" delay={500}>
                    <p>
                        Sentiu algo estranho? Registre aqui!
                    </p>
                    <p>
                        O Diário serve para anotar sintomas, pressão arterial, febre ou qualquer ocorrência. Esses dados aparecem depois no <strong>Relatório</strong>, ajudando o médico a entender se o tratamento está funcionando.
                    </p>
                </ManualSection>

                <ManualSection title="Relatórios PDF" icon={FileText} color="bg-orange-500" delay={600}>
                    <p>
                        Vai na consulta médica? Não vá de mãos abanando! 📄
                    </p>
                    <p>
                        Gere um relatório PDF completo com todo o histórico de medicamentos tomados (e esquecidos!) e o diário de sintomas. Você pode enviar direto para o WhatsApp do médico.
                    </p>
                </ManualSection>

                <ManualSection title="Acesso Geral (Chave Mestra)" icon={Share2} color="bg-cyan-500" delay={700}>
                    <p>
                        <strong className="text-cyan-700">⚠️ Atenção Máxima aqui!</strong>
                    </p>
                    <p>
                        Este menu (na barra lateral) serve para dar acesso TOTAL à sua conta. Quem você convidar aqui verá <strong>TODOS</strong> os seus pacientes e remédios.
                    </p>
                    <p className="text-sm border-l-4 border-cyan-500 pl-3 italic text-slate-500">
                        Use para marido/esposa. Para outros casos, prefira compartilhar só o Paciente.
                    </p>
                </ManualSection>

            </div>

            {/* Final Call to Action */}
            <div className="text-center mt-8 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-700">
                <p className="text-slate-400 mb-4">Ainda tem dúvidas?</p>
                <button
                    onClick={() => window.open('mailto:suporte@seupremiumapp.com')}
                    className="text-primary font-bold hover:underline"
                >
                    Fale com nosso Suporte
                </button>
            </div>
        </div>
    );
};

export default Manual;

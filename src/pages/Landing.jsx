import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Bell, ArrowRight, Activity, Heart, Send, CheckCircle2, AlertCircle, Smartphone, Rocket, Zap, Globe, Layers, Instagram, Facebook, Youtube, MessageCircle, Video, BookOpen, LifeBuoy, FileText, Pill, Shield, Calendar, Download, Printer, Share2, Lock, Gift, Headset } from 'lucide-react';
import { supabase } from '../lib/supabase';
import confetti from 'canvas-confetti';
import { getApiEndpoint } from '../config/api';
import HealthTips from '../components/features/HealthTips';


const Landing = () => {
    const navigate = useNavigate();

    const [contactForm, setContactForm] = useState({ name: '', email: '', phone: '', message: '' });
    const [sendingContact, setSendingContact] = useState(false);
    const [contactStatus, setContactStatus] = useState(null); // { type: 'success' | 'error', message: '' }
    const [sponsors, setSponsors] = useState([]);
    const [isInstalled, setIsInstalled] = useState(false);
    const [installPrompt, setInstallPrompt] = useState(null);

    useEffect(() => {
        // Check if already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsInstalled(true);
        }

        const handler = (e) => {
            e.preventDefault();
            setInstallPrompt(e);
        };
        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstallClick = async () => {
        if (installPrompt) {
            installPrompt.prompt();
            const { outcome } = await installPrompt.userChoice;
            if (outcome === 'accepted') {
                setInstallPrompt(null);
            }
        } else {
            // Fallback for browsers that don't support automatic prompt (iOS, some Desktop)
            alert("Para instalar este aplicativo:\n\n1. Clique no menu do navegador (três pontos ou botão de compartilhar).\n2. Selecione 'Adicionar à Tela Inicial' ou 'Instalar Aplicativo'.");
        }
    };

    useEffect(() => {
        const fetchSponsors = async () => {
            const { data } = await supabase.from('sponsors').select('*').eq('active', true).eq('show_on_landing_page', true);
            if (data && data.length > 0) {
                // Fisher-Yates Shuffle
                const shuffled = [...data];
                for (let i = shuffled.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
                }
                setSponsors(shuffled);
            } else {
                setSponsors([]);
            }
        };

        fetchSponsors();

        // Realtime Subscription
        const channel = supabase
            .channel('public:sponsors')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'sponsors' }, (payload) => {
                console.log('🔄 Realtime detected change:', payload);
                // Brute force: Any change triggers a full reload to ensure consistency.
                fetchSponsors();
            })
            .subscribe((status) => {
                console.log('Realtime Subscription Status:', status);
                if (status === 'SUBSCRIBED') {
                    console.log('✅ Connected to Realtime updates for sponsors');
                } else if (status === 'CHANNEL_ERROR') {
                    console.warn('⚠️ Realtime subscription failed. To fix this, enable "Realtime" for the "sponsors" table in the Supabase Dashboard Dashboard (Table > Replication).');
                } else if (status === 'TIMED_OUT') {
                    console.warn('⚠️ Realtime connection timed out.');
                }
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const maskPhone = (value) => {
        return value
            .replace(/\D/g, '')
            .replace(/^(\d{2})(\d)/g, '($1) $2')
            .replace(/(\d)(\d{4})$/, '$1-$2')
            .slice(0, 15);
    };

    const handleContactSubmit = async (e) => {
        e.preventDefault();
        setSendingContact(true);
        setContactStatus(null);

        try {
            const response = await fetch(getApiEndpoint('/api/contact'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: contactForm.name,
                    email: contactForm.email,
                    phone: contactForm.phone,
                    message: contactForm.message
                })
            });

            const data = await response.json();

            if (data.success) {
                setContactStatus({
                    type: 'success',
                    message: 'Mensagem enviada! Entraremos em contato em breve.'
                });

                // Trigger Confetti
                confetti({
                    particleCount: 150,
                    spread: 70,
                    origin: { y: 0.6 },
                    colors: ['#10b981', '#3b82f6', '#f43f5e', '#f59e0b']
                });

                setContactForm({ name: '', email: '', phone: '', message: '' });
                // Limpar mensagem de sucesso após 5 segundos
                setTimeout(() => setContactStatus(null), 5000);
            } else {
                throw new Error(data.error || 'Erro ao enviar mensagem');
            }
        } catch (error) {
            console.error('Erro:', error);
            setContactStatus({
                type: 'error',
                message: 'Não foi possível enviar a mensagem. Tente novamente.'
            });
        } finally {
            setSendingContact(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
            {/* Navbar - Fixed */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-50/90 backdrop-blur-md border-b border-slate-200/50 shadow-sm transition-all duration-300">
                {/* DEBUG BANNER REmoved */}
                <div className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
                    <div className="flex items-center gap-2">
                        <img src="/assets/logo.png" alt="SiG Remédios Logo" className="w-10 h-10 object-contain animate-heartbeat rounded-lg" />
                        <span className="text-xl font-bold text-slate-900 hidden sm:block">SiG Remédios</span>
                    </div>

                    <div className="hidden md:flex items-center gap-8">
                        <a href="#features" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">Funcionalidades</a>
                        <a href="#about" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">Sobre</a>
                        <a href="#contact" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">Contato</a>
                    </div>
                    <div className="flex items-center gap-2 md:gap-4">
                        <button
                            onClick={handleInstallClick}
                            className="p-2 md:px-4 md:py-2 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg transition-colors shadow-lg shadow-teal-600/20 flex items-center gap-2 animate-pulse"
                            title="Instalar Aplicativo"
                        >
                            <Smartphone size={18} />
                            <span className="hidden md:inline">Instalar App</span>
                        </button>
                        <button
                            onClick={() => navigate('/login')}
                            className="px-4 py-2 text-slate-600 hover:text-blue-600 font-medium transition-colors"
                        >
                            Entrar
                        </button>
                        <button
                            onClick={() => navigate('/register')}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors shadow-lg shadow-blue-600/20"
                        >
                            Criar Conta
                        </button>
                    </div>
                </div>
            </nav>

            {/* Hero Section - Added Padding Details */}
            <header className="px-6 pt-20 pb-12 md:pt-24 md:pb-16 max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-12">
                <div className="flex-1 space-y-8 animate-fade-in-up">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm font-medium border border-blue-100">
                        <Users className="w-4 h-4 text-blue-600 fill-current animate-pulse" />
                        A paz de espírito de saber que quem você ama está bem cuidado.
                    </div>
                    <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight text-slate-900">
                        Cuidar da família <br className="hidden md:block" />
                        nunca foi tão <span className="text-blue-600">tranquilo</span>.
                    </h1>
                    <p className="text-lg md:text-xl text-slate-600 max-w-xl leading-relaxed">
                        Tenha o controle total sobre os medicamentos de quem você ama. Receba alertas em tempo real e saiba, de onde estiver, que a dose foi tomada com segurança.
                    </p>

                </div>

                {/* Hero Visual Decoration */}
                <div className="flex-1 w-full max-w-lg md:max-w-none relative flex justify-center">
                    <div className="absolute top-0 right-0 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-2xl opacity-20 animate-blob"></div>
                    <div className="absolute -bottom-8 -left-8 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-2xl opacity-20 animate-blob animation-delay-2000"></div>

                    {/* Animated Image */}
                    <div className="relative z-10 animate-float">
                        <img
                            src="/assets/son_hugging_elderly_father_flat_illustration.png"
                            alt="Filho abraçando pai idoso demonstrando carinho"
                            className="w-full max-w-md rounded-2xl shadow-2xl shadow-blue-900/10 border-4 border-white transform hover:scale-[1.02] transition-transform duration-500"
                        />

                        {/* Status Badge floating */}
                        <div className="absolute -bottom-6 -right-6 bg-white p-4 rounded-xl shadow-xl border border-slate-100 flex items-center gap-3 animate-pulse-slow">
                            <div className="bg-green-100 p-2 rounded-full">
                                <Heart className="w-6 h-6 text-green-600 fill-current" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 font-medium">Status do Cuidado</p>
                                <p className="text-sm font-bold text-slate-800">Feito com Amor</p>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Health Tips Carousel Section */}
            <section className="py-8 bg-white relative z-20">
                <HealthTips autoRotateInterval={60000} variant="landing" />
            </section>

            {/* Features Section - Premium Futurisc */}
            <section id="features" className="bg-slate-50 py-8 px-6 relative overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent"></div>

                {/* Decorative background elements */}
                <div className="absolute top-20 left-10 w-64 h-64 bg-blue-400/5 rounded-full filter blur-3xl animate-blob"></div>
                <div className="absolute bottom-20 right-10 w-64 h-64 bg-purple-400/5 rounded-full filter blur-3xl animate-blob animation-delay-2000"></div>

                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="text-center max-w-3xl mx-auto mb-16 animate-fade-in-up space-y-6 px-4">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 text-indigo-600 text-sm font-bold border border-indigo-100 shadow-sm">
                            <Heart className="w-4 h-4 animate-pulse fill-current" />
                            <span>Cuidar de sua saúde é nossa maior missão.</span>
                        </div>
                        <h2 className="text-2xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight px-2">
                            Sua Saúde e Segurança <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Levadas a Sério</span>
                        </h2>
                        <p className="text-sm md:text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto px-2">
                            Uma suíte completa de ferramentas projetada para dar superpoderes ao seu cuidado diário.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
                        {featuresList.map((feature, index) => (
                            <FeatureCard
                                key={index}
                                icon={feature.icon}
                                color={feature.color}
                                title={feature.title}
                                description={feature.description}
                                delay={`${index * 0.1}s`}
                                index={index}
                            />
                        ))}
                    </div>
                </div>
            </section>

            {/* Services / Development Section */}
            <section className="py-12 bg-slate-900 relative overflow-hidden text-white">
                {/* Background Details */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-20 pointer-events-none">
                    <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-500 rounded-full mix-blend-screen filter blur-3xl animate-blob"></div>
                    <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-purple-500 rounded-full mix-blend-screen filter blur-3xl animate-blob animation-delay-2000"></div>
                </div>

                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <div className="text-center max-w-3xl mx-auto mb-20 animate-fade-in-up space-y-6 px-4">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800 text-blue-400 text-sm font-medium border border-slate-700">
                            <Rocket className="w-4 h-4 animate-pulse" />
                            <span>Inovação Digital Avançada</span>
                        </div>
                        <h2 className="text-2xl md:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-teal-400 to-white px-2 leading-tight">
                            Transformamos sua ideia em Software de Alta Performance
                        </h2>
                        <p className="text-sm md:text-lg text-slate-300 leading-relaxed px-2 max-w-2xl mx-auto">
                            Desenvolvemos aplicativos Web e Nativos sob medida, focados na experiência do usuário e na necessidade real do seu negócio.
                            Design moderno, performance extrema e escalabilidade.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        {/* Service Card 1 */}
                        <div className="bg-slate-800/50 backdrop-blur-lg p-8 rounded-3xl border border-slate-700 hover:border-blue-500/50 hover:bg-slate-800 transition-all duration-300 group">
                            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-6 transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg shadow-blue-500/20">
                                <Globe className="w-7 h-7 text-white" />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-3">Web Apps Modernos</h3>
                            <p className="text-slate-400 leading-relaxed mb-6">
                                Sistemas web rápidos e responsivos (PWA), dashboards administrativos e plataformas SaaS utilizando as tecnologias mais recentes como React e Next.js.
                            </p>
                            <ul className="space-y-2 text-sm text-slate-300">
                                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-blue-400" /> SEO otimizado</li>
                                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-blue-400" /> Acessível em qualquer navegador</li>
                            </ul>
                        </div>

                        {/* Service Card 2 */}
                        <div className="bg-slate-800/50 backdrop-blur-lg p-8 rounded-3xl border border-slate-700 hover:border-purple-500/50 hover:bg-slate-800 transition-all duration-300 group relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-3">
                                <span className="bg-purple-500/20 text-purple-300 text-xs font-bold px-3 py-1 rounded-full border border-purple-500/30">MAIS POPULAR</span>
                            </div>
                            <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mb-6 transform group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300 shadow-lg shadow-purple-500/20">
                                <Smartphone className="w-7 h-7 text-white" />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-3">Apps Nativos</h3>
                            <p className="text-slate-400 leading-relaxed mb-6">
                                Aplicativos para iOS e Android com performance nativa. Experiência fluida, acesso a recursos do dispositivo (Câmera, GPS) e disponibilidade nas lojas.
                            </p>
                            <ul className="space-y-2 text-sm text-slate-300">
                                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-purple-400" /> iOS & Android</li>
                                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-purple-400" /> Publicação nas Lojas</li>
                            </ul>
                        </div>

                        {/* Service Card 3 */}
                        <div className="bg-slate-800/50 backdrop-blur-lg p-8 rounded-3xl border border-slate-700 hover:border-teal-500/50 hover:bg-slate-800 transition-all duration-300 group">
                            <div className="w-14 h-14 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-2xl flex items-center justify-center mb-6 transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg shadow-teal-500/20">
                                <Layers className="w-7 h-7 text-white" />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-3">Design de UI/UX</h3>
                            <p className="text-slate-400 leading-relaxed mb-6">
                                Interfaces desenhadas para encantar. Focamos na jornada do usuário para criar produtos que são não apenas bonitos, mas intuitivos e fáceis de usar.
                            </p>
                            <ul className="space-y-2 text-sm text-slate-300">
                                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-teal-400" /> Design System Exclusivo</li>
                                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-teal-400" /> Prototipagem Interativa</li>
                            </ul>
                        </div>
                    </div>

                    <div className="mt-16 text-center">
                        <a
                            href="#contact"
                            className="inline-flex items-center gap-3 px-8 py-4 bg-white text-slate-900 font-bold rounded-xl hover:bg-blue-50 transition-all hover:scale-105 shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                        >
                            <Zap className="w-5 h-5 text-blue-600 fill-current" />
                            Solicitar Orçamento Personalizado
                        </a>
                    </div>
                </div>
            </section>

            {/* Sponsors Section (V4 - Large Living Cards) */}
            {
                sponsors.length > 0 && (
                    <section className="py-12 relative overflow-hidden bg-slate-50/50">
                        {/* Subtle Animated Background */}
                        <div className="absolute inset-0 bg-gradient-to-b from-white via-blue-50/30 to-white z-0"></div>

                        <div className="max-w-7xl mx-auto px-6 relative z-10 w-full">
                            <div className="text-center mb-16 px-6 animate-fade-in-up">
                                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 text-blue-700 text-sm font-bold tracking-wide mb-6 border border-blue-200 shadow-sm">
                                    <Users className="w-4 h-4" />
                                    <span>Parceiros Estratégicos</span>
                                </div>
                                <h3 className="text-3xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight text-slate-900">
                                    Quem Confia em Nossa Tecnologia
                                </h3>
                            </div>

                            {/* Premium Responsive Grid - Senior UI/UX */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12 pb-12">
                                {sponsors.map((sponsor, index) => (
                                    <div
                                        key={`${sponsor.id}-${index}`}
                                        className="w-full bg-white/40 backdrop-blur-2xl rounded-3xl border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-2xl transition-all duration-700 group flex flex-col items-center p-10 relative overflow-hidden animate-float"
                                        style={{ animationDelay: `${index * 1.5}s`, animationDuration: '8s' }}
                                    >
                                        {/* Intrinsic Living Shimmer Effect (Always On) */}
                                        <div className="absolute inset-0 z-0 opacity-30 bg-gradient-to-r from-transparent via-white/80 to-transparent skew-x-12 animate-shimmer pointer-events-none"></div>

                                        {/* Colorful Pulse Background */}
                                        <div className="absolute inset-0 bg-gradient-to-br from-blue-100/20 via-purple-100/20 to-pink-100/20 opacity-50 animate-pulse-slow z-0"></div>

                                        <div className="relative z-10 w-full h-40 flex items-center justify-center mb-8 p-6 bg-white/60 rounded-2xl shadow-inner border border-white/50 group-hover:bg-white/90 transition-colors duration-500">
                                            <img
                                                src={sponsor.logo_url}
                                                alt={sponsor.name}
                                                className="max-w-full max-h-full object-contain mix-blend-multiply opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                                            />
                                        </div>

                                        <div className="text-center relative z-10 w-full">
                                            <h4 className="font-bold text-slate-900 text-2xl mb-4 tracking-tight">{sponsor.name}</h4>

                                            {/* Always visible description for impactful presentation */}
                                            {sponsor.description && (
                                                <p className="text-slate-600 text-base leading-relaxed mb-6 line-clamp-3 min-h-[4.5em]">
                                                    {sponsor.description}
                                                </p>
                                            )}

                                            <div className="flex justify-center gap-4 mb-8">
                                                {sponsor.whatsapp && (
                                                    <a href={sponsor.whatsapp.startsWith('http') ? sponsor.whatsapp : `https://wa.me/${sponsor.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="p-2 bg-green-100 text-green-600 rounded-full hover:bg-green-600 hover:text-white transition-all transform hover:scale-110 shadow-sm">
                                                        <MessageCircle size={20} />
                                                    </a>
                                                )}
                                                {sponsor.instagram && (
                                                    <a href={sponsor.instagram} target="_blank" rel="noopener noreferrer" className="p-2 bg-pink-100 text-pink-600 rounded-full hover:bg-pink-600 hover:text-white transition-all transform hover:scale-110 shadow-sm">
                                                        <Instagram size={20} />
                                                    </a>
                                                )}
                                                {sponsor.facebook && (
                                                    <a href={sponsor.facebook} target="_blank" rel="noopener noreferrer" className="p-2 bg-blue-100 text-blue-600 rounded-full hover:bg-blue-600 hover:text-white transition-all transform hover:scale-110 shadow-sm">
                                                        <Facebook size={20} />
                                                    </a>
                                                )}
                                                {sponsor.youtube && (
                                                    <a href={sponsor.youtube} target="_blank" rel="noopener noreferrer" className="p-2 bg-red-100 text-red-600 rounded-full hover:bg-red-600 hover:text-white transition-all transform hover:scale-110 shadow-sm">
                                                        <Youtube size={20} />
                                                    </a>
                                                )}
                                                {sponsor.tiktok && (
                                                    <a href={sponsor.tiktok} target="_blank" rel="noopener noreferrer" className="p-2 bg-slate-100 text-slate-800 rounded-full hover:bg-black hover:text-white transition-all transform hover:scale-110 shadow-sm">
                                                        <Video size={20} />
                                                    </a>
                                                )}
                                            </div>

                                            <a
                                                href={sponsor.website_url || '#'}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center justify-center w-full py-4 px-6 bg-white hover:bg-blue-600 text-slate-700 hover:text-white font-bold rounded-xl transition-all duration-300 border border-slate-200 hover:border-blue-600 shadow-sm hover:shadow-lg group/btn"
                                            >
                                                Conhecer Parceiro
                                                <ArrowRight size={20} className="ml-2 transform group-hover/btn:translate-x-1 transition-transform" />
                                            </a>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                )
            }

            {/* Contact Section */}
            <div id="contact" className="py-12 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tl from-emerald-50 via-teal-50/50 to-white z-0"></div>

                {/* Decorative Blobs */}
                <div className="absolute top-0 right-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                    <div className="absolute top-[10%] right-[10%] w-[400px] h-[400px] bg-emerald-200/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
                    <div className="absolute bottom-[10%] left-[10%] w-[300px] h-[300px] bg-teal-200/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
                </div>

                <div className="max-w-3xl mx-auto px-6 relative z-10">
                    <div className="text-center mb-16 transition-all duration-700">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-sm font-bold border border-emerald-100 mb-4 shadow-sm animate-fade-in-up">
                            <Headset className="w-4 h-4 animate-pulse" />
                            <span>Agilidade e Individualidade no Suporte</span>
                        </div>
                        <h2 className="text-3xl font-bold text-slate-900 mb-4">Fale Conosco</h2>
                        <p className="text-lg text-slate-600">Tem alguma dúvida ou sugestão? Envie uma mensagem.</p>
                    </div>

                    <form onSubmit={handleContactSubmit} className="bg-white rounded-2xl shadow-xl p-8 border border-slate-100 transition-all duration-700">
                        <div className="grid gap-6">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Nome</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-[#10b981] focus:ring-4 focus:ring-[#10b981]/10 outline-none transition-all"
                                        placeholder="Seu nome"
                                        value={contactForm.name}
                                        onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Email</label>
                                    <input
                                        type="email"
                                        required
                                        className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-[#10b981] focus:ring-4 focus:ring-[#10b981]/10 outline-none transition-all"
                                        placeholder="seu@email.com"
                                        value={contactForm.email}
                                        onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Telefone / WhatsApp</label>
                                    <input
                                        type="tel"
                                        required
                                        className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-[#10b981] focus:ring-4 focus:ring-[#10b981]/10 outline-none transition-all"
                                        placeholder="(11) 99999-9999"
                                        value={contactForm.phone}
                                        onChange={(e) => setContactForm({ ...contactForm, phone: maskPhone(e.target.value) })}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Mensagem</label>
                                <textarea
                                    required
                                    rows={4}
                                    className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-[#10b981] focus:ring-4 focus:ring-[#10b981]/10 outline-none transition-all resize-none"
                                    placeholder="Como podemos ajudar?"
                                    value={contactForm.message}
                                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                                ></textarea>
                            </div>

                            {contactStatus && (
                                <div className={`p-4 rounded-lg flex items-center gap-3 ${contactStatus.type === 'success'
                                    ? 'bg-green-50 text-green-700 border border-green-200'
                                    : 'bg-red-50 text-red-700 border border-red-200'
                                    }`}>
                                    {contactStatus.type === 'success' ? (
                                        <CheckCircle2 className="w-5 h-5 shrink-0" />
                                    ) : (
                                        <AlertCircle className="w-5 h-5 shrink-0" />
                                    )}
                                    <span className="text-sm font-medium">{contactStatus.message}</span>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={sendingContact}
                                className="w-full py-4 bg-[#10b981] hover:bg-[#059669] text-white font-bold rounded-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-[#10b981]/20 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {sendingContact ? (
                                    <>Enviando...</>
                                ) : (
                                    <>Enviar Mensagem <Send size={18} /></>
                                )}
                            </button>
                        </div>
                    </form>

                    <div className="mt-8 text-center animate-fade-in-up delay-200">
                        <p className="text-slate-600 mb-4">Prefere falar pelo WhatsApp?</p>
                        <a
                            href={`https://wa.me/5517991426306?text=${encodeURIComponent('Olá, vim pelo site SiG Remédios e gostaria de falar com vocês.')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-[#25D366] hover:bg-[#128C7E] text-white font-bold rounded-full transition-all hover:scale-105 shadow-lg shadow-[#25D366]/20"
                        >
                            <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                            </svg>
                            Falar no WhatsApp
                        </a>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="bg-slate-900 border-t border-slate-800 py-12 relative z-10">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8 text-sm">
                    <div className="flex items-center gap-2 text-white">
                        <img src="/assets/logo.png" alt="SiG Remédios Logo" className="w-8 h-8 object-contain rounded-md border border-white/20 bg-slate-800" />
                        <span className="font-bold text-lg">SiG Remédios</span>
                    </div>
                    <div className="flex gap-8">
                        <a href="#" className="text-slate-400 hover:text-white transition-colors">Sobre</a>
                        <a href="#" className="text-slate-400 hover:text-white transition-colors">Privacidade</a>
                        <a href="#" className="text-slate-400 hover:text-white transition-colors">Termos</a>
                    </div>
                    <div className="text-white/60">
                        © {new Date().getFullYear()} Todos os direitos reservados. (v{__APP_VERSION__})
                    </div>
                </div>
            </footer>
        </div >
    );
};

const featuresList = [
    {
        icon: <Users className="w-8 h-8 text-blue-600" />,
        color: "blue",
        title: "Compartilhamento Familiar",
        description: "Conecte cuidadores e familiares em tempo real. Quem ama, cuida junto e fica sempre sincronizado."
    },
    {
        icon: <Bell className="w-8 h-8 text-purple-600" />,
        color: "purple",
        title: "Lembretes Inteligentes",
        description: "Nossa IA avisa a hora exata da medicação. Esqueça o medo de perder uma dose importante."
    },
    {
        icon: <Activity className="w-8 h-8 text-rose-600" />,
        color: "rose",
        title: "Diário de Saúde",
        description: "Monitore Pressão, Glicose, Peso e Humor. Gráficos vitais completos para o controle da sua evolução."
    },
    {
        icon: <Pill className="w-8 h-8 text-pink-600" />,
        color: "pink",
        title: "Controle de Estoque",
        description: "Baixa automática a cada dose tomada. O sistema avisa você dias antes do remédio acabar."
    },
    {
        icon: <LifeBuoy className="w-8 h-8 text-teal-600" />,
        color: "teal",
        title: "Suporte VIP Integrado",
        description: "Teve dúvida? Chame nosso suporte humanizado direto pelo App ou WhatsApp. Você nunca está sozinho."
    },
    {
        icon: <BookOpen className="w-8 h-8 text-amber-600" />,
        color: "amber",
        title: "Manual Interativo",
        description: "Aprenda a usar cada recurso com nosso guia visual passo a passo. Tecnologia acessível para todas as idades."
    },
    {
        icon: <FileText className="w-8 h-8 text-cyan-600" />,
        color: "cyan",
        title: "Relatórios Médicos",
        description: "Gere históricos detalhados em PDF para seu médico. Mostre a evolução do tratamento com dados reais."
    },
    {
        icon: <Calendar className="w-8 h-8 text-indigo-600" />,
        color: "indigo",
        title: "Google Agenda",
        description: "Integração nativa. Seus horários de medicação sincronizados direto no seu calendário pessoal."
    },
    {
        icon: <Shield className="w-8 h-8 text-red-600" />,
        color: "red",
        title: "SOS Digital",
        description: "Cartão de emergência vital. Socorristas acessam tipagem sanguínea, alergias e remédios em 1 clique."
    },
    {
        icon: <Share2 className="w-8 h-8 text-violet-600" />,
        color: "violet",
        title: "Envio Multi-Canal",
        description: "Você escolhe como compartilhar: gerar PDF, enviar por Email, mandar no WhatsApp ou Imprimir. Tudo em 1 clique."
    },
    {
        icon: <Lock className="w-8 h-8 text-slate-700" />,
        color: "slate",
        title: "Segurança dos Dados",
        description: "Tecnologia de criptografia avançada. Seus dados médicos blindados e acessíveis somente a você ou quem compartilhar."
    }
];

const FeatureCard = ({ icon, title, description, delay, index }) => {
    // Alternating gradient logic
    const isAlternating = index % 2 !== 0;

    // Row-based Animation Logic (assuming 3 columns for LG, 2 for MD, 1 for mobile)
    // To keep it simple but "different per line", we can alternate entrance direction based on index parity.
    // Even items: Fade In Left
    // Odd items: Fade In Right

    // We add 'animate-shake' on hover manually via CSS or Tailwind utility extend if available.
    // Since 'animate-shake' might not be in standard utils, we'll use a standard transform wiggle effect.

    return (
        <div
            className={`
                p-5 rounded-2xl border transition-all duration-300 group w-full relative overflow-hidden
                ${isAlternating
                    ? 'bg-gradient-to-br from-indigo-50 via-blue-100 to-indigo-200 border-indigo-200 hover:shadow-indigo-200/50'
                    : 'bg-gradient-to-br from-white via-indigo-50 to-blue-50 border-indigo-100 hover:shadow-blue-100/50'
                }
                hover:shadow-xl
            `}
            style={{
                // Removed animationDelay to stop entrance staggering if it disrupts reading, 
                // but user specifically complained about "screen moving" (continuous animation).
                // I will keep entrance delay if it's just once, but remove continuous float.
                animationDelay: delay
            }}
        >
            <div className={`w-12 h-12 rounded-xl shadow-sm flex items-center justify-center mb-4 border transition-transform duration-300 group-hover:scale-110 group-hover:animate-pulse ${isAlternating ? 'bg-white border-indigo-100' : 'bg-white border-slate-100'}`}>
                {icon}
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3 break-words relative z-10">{title}</h3>
            <p className="text-slate-600 leading-relaxed text-sm md:text-base relative z-10">{description}</p>
        </div>
    );
};

export default Landing;

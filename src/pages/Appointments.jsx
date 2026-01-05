import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import {
    Calendar,
    Plus,
    MoreVertical,
    MapPin,
    User,
    Stethoscope,
    FileText,
    CheckCircle2,
    XCircle,
    Clock,
    Search,
    Filter,
    ChevronRight,
    CalendarDays,
    X
} from 'lucide-react';
import { format, parseISO, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import clsx from 'clsx';
import { Phone, MessageSquare, MapPin as MapPinIcon, Building2, ChevronLeft, ChevronRight as ChevronRightIcon, List } from 'lucide-react';
import Pagination from '../components/ui/Pagination';
import Shimmer from '../components/ui/Shimmer';
import ConfirmationModal from '../components/ui/ConfirmationModal';

const Appointments = () => {
    const { user, appointments, addAppointment, updateAppointment, deleteAppointment, patients, specialties, loadingData } = useApp();
    const navigate = useNavigate();
    const [viewMode, setViewMode] = useState('list'); // 'list' or 'calendar'
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDay, setSelectedDay] = useState(new Date());
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [editingAppointment, setEditingAppointment] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterDate, setFilterDate] = useState(''); // YYYY-MM-DD
    const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
    const [isModalStatusOpen, setIsModalStatusOpen] = useState(false);
    const [isPatientDropdownOpen, setIsPatientDropdownOpen] = useState(false);
    const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
    const [minLoading, setMinLoading] = useState(true);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 4;

    // Delete Modal
    const [appointmentToDelete, setAppointmentToDelete] = useState(null);

    const dropdownRef = React.useRef(null);
    const modalStatusDropdownRef = React.useRef(null);
    const patientDropdownRef = React.useRef(null);

    // Especialidades Buscáveis
    const [specialtySearch, setSpecialtySearch] = useState('');
    const [showSpecialties, setShowSpecialties] = useState(false);

    const [formData, setFormData] = useState({
        patientId: '',
        doctorName: '',
        specialtyId: '',
        specialtyText: '',
        datePart: '', // Added for dd/mm/yyyy localization
        timePart: '', // Added for hh:mm localization
        appointmentDate: '',
        locationName: '',
        address: '',
        contactPhone: '',
        whatsappPhone: '',
        notes: '',
        status: 'scheduled'
    });

    const [patientSearchTerm, setPatientSearchTerm] = useState('');

    const hasManagementPermission = (patientId) => {
        if (!user || !patientId) return false;
        const patient = patients.find(p => p.id === patientId);
        if (!patient) return false;

        // Owner always has permission
        if (patient.userId === user.id) return true;

        // Check accepted shares with 'edit' permission
        const myShare = patient.patient_shares?.find(s =>
            s.shared_with_email?.toLowerCase() === user.email?.toLowerCase() &&
            s.accepted_at
        );
        return myShare?.permission === 'edit';
    };

    const handleOpenModal = (appointment = null) => {
        if (appointment) {
            setEditingAppointment(appointment);

            // Fix date format for datetime-local (YYYY-MM-DDTHH:MM)
            let dateStr = '';
            if (appointment.appointmentDate) {
                const dateObj = new Date(appointment.appointmentDate);
                // Adjust to local ISO string without timezone suffix
                const tzOffset = dateObj.getTimezoneOffset() * 60000;
                const localISODate = new Date(dateObj.getTime() - tzOffset).toISOString().slice(0, 16);
                dateStr = localISODate;
            }

            setFormData({
                patientId: appointment.patientId,
                doctorName: appointment.doctorName || '',
                specialtyId: appointment.specialtyId || '',
                specialtyText: appointment.specialtyText || '',
                datePart: dateStr ? dateStr.split('T')[0] : '',
                timePart: dateStr ? dateStr.split('T')[1] : '',
                appointmentDate: dateStr,
                locationName: appointment.locationName || '',
                address: appointment.address || '',
                contactPhone: appointment.contactPhone || '',
                whatsappPhone: appointment.whatsappPhone || '',
                notes: appointment.notes || '',
                status: appointment.status
            });
            setSpecialtySearch(appointment.specialty || '');
        } else {
            setEditingAppointment(null);
            setFormData({
                patientId: patients.length > 0 ? patients[0].id : '',
                doctorName: '',
                specialtyId: '',
                specialtyText: '',
                datePart: selectedDay ? format(selectedDay, 'yyyy-MM-dd') : '',
                timePart: '09:00',
                appointmentDate: '',
                locationName: '',
                address: '',
                contactPhone: '',
                whatsappPhone: '',
                notes: '',
                status: 'scheduled'
            });
            setSpecialtySearch('');
        }
        setIsModalOpen(true);
        setIsModalStatusOpen(false); // Reset dropdown state on open
        setIsPatientDropdownOpen(false); // Reset patient dropdown
        setPatientSearchTerm(''); // Reset patient search
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            // Recombine date and time
            const finalData = { ...formData };
            if (formData.datePart && formData.timePart) {
                finalData.appointmentDate = `${formData.datePart}T${formData.timePart}`;
            }

            if (editingAppointment) {
                await updateAppointment(editingAppointment.id, finalData);
            } else {
                await addAppointment(finalData);
            }
            setIsModalOpen(false);
        } catch (error) {
            console.error('Error saving appointment:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteClick = (appointment) => {
        setAppointmentToDelete(appointment);
        setIsModalOpen(false); // Close edit modal if open
    };

    const confirmDelete = async () => {
        if (appointmentToDelete) {
            try {
                await deleteAppointment(appointmentToDelete.id);
                setAppointmentToDelete(null);
            } catch (error) {
                console.error('Error deleting appointment:', error);
            }
        }
    };

    const filteredAppointments = appointments.filter(app => {
        const matchesSearch =
            (app.doctorName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (app.specialty?.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (app.patients?.name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (app.locationName?.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesStatus = filterStatus === 'all' || app.status === filterStatus;

        const matchesDate = !filterDate || (app.appointmentDate && app.appointmentDate.startsWith(filterDate));

        return matchesSearch && matchesStatus && matchesDate;
    });

    const filteredSpecialties = specialties.filter(s =>
        s.name.toLowerCase().includes(specialtySearch.toLowerCase())
    ).slice(0, 10);

    const filteredPatients = patients.filter(p =>
        hasManagementPermission(p.id) &&
        p.name.toLowerCase().includes(patientSearchTerm.toLowerCase())
    );

    // Close dropdown on click outside & window resize tracking
    React.useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsStatusDropdownOpen(false);
            }
            if (modalStatusDropdownRef.current && !modalStatusDropdownRef.current.contains(event.target)) {
                setIsModalStatusOpen(false);
            }
            if (patientDropdownRef.current && !patientDropdownRef.current.contains(event.target)) {
                setIsPatientDropdownOpen(false);
            }
        };

        const handleResize = () => setWindowWidth(window.innerWidth);

        document.addEventListener('mousedown', handleClickOutside);
        window.addEventListener('resize', handleResize);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    // Min Shimmer Duration
    React.useEffect(() => {
        const timer = setTimeout(() => setMinLoading(false), 1000);
        return () => clearTimeout(timer);
    }, []);

    const statusOptions = [
        { value: 'all', label: 'Todos os Status', emoji: '🔍' },
        { value: 'scheduled', label: 'Agendadas', emoji: '📅' },
        { value: 'completed', label: 'Realizadas', emoji: '✅' },
        { value: 'cancelled', label: 'Canceladas', emoji: '❌' }
    ];

    const modalStatusOptions = [
        { value: 'scheduled', label: 'Agendada', emoji: '📅' },
        { value: 'completed', label: 'Realizada', emoji: '✅' },
        { value: 'cancelled', label: 'Cancelada', emoji: '❌' }
    ];

    const selectedStatusEmoji = statusOptions.find(opt => opt.value === filterStatus)?.emoji || '🔍';
    const selectedStatusLabel = statusOptions.find(opt => opt.value === filterStatus)?.label || 'Todos';

    // Calendar logic
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

    const getAppointmentsForDay = (day) => {
        return appointments.filter(app => isSameDay(parseISO(app.appointmentDate), day));
    };

    const finalFilteredAppointments = viewMode === 'list'
        ? filteredAppointments
        : getAppointmentsForDay(selectedDay).filter(app => {
            const matchesSearch =
                (app.doctorName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (app.specialty?.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (app.patients?.name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (app.locationName?.toLowerCase().includes(searchTerm.toLowerCase()));
            const matchesStatus = filterStatus === 'all' || app.status === filterStatus;
            return matchesSearch && matchesStatus;
        });

    // Pagination Logic
    const totalPages = Math.ceil(finalFilteredAppointments.length / ITEMS_PER_PAGE);
    const paginatedAppointments = viewMode === 'list'
        ? finalFilteredAppointments.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)
        : finalFilteredAppointments; // No pagination for calendar view usually, or explicit if needed. User asked for pagination "of 6", usually implies list.

    const statusMap = {
        scheduled: { label: 'Agendada', color: 'text-blue-600 bg-blue-50 border-blue-100', icon: Clock },
        completed: { label: 'Realizada', color: 'text-emerald-600 bg-emerald-50 border-emerald-100', icon: CheckCircle2 },
        cancelled: { label: 'Cancelada', color: 'text-rose-600 bg-rose-50 border-rose-100', icon: XCircle }
    };

    const formatPhone = (val) => {
        if (!val) return "";
        const numbers = val.replace(/\D/g, "");
        const len = numbers.length;

        if (len <= 2) return numbers;
        if (len <= 6) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
        if (len <= 10) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
        return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
    };

    // Shimmer Loading State
    if (loadingData || minLoading) {
        return (
            <div className="space-y-6 pb-20 lg:pb-8 px-2 sm:px-0 max-w-full overflow-x-hidden">
                {/* Header Shimmer */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-1 sm:px-0">
                    <div>
                        <Shimmer className="h-8 w-64 rounded-xl mb-2" />
                        <Shimmer className="h-4 w-48 rounded-lg" />
                    </div>
                    <div className="flex gap-3">
                        <Shimmer className="h-10 w-32 rounded-xl" />
                        <Shimmer className="h-10 w-32 rounded-xl" />
                    </div>
                </div>

                {/* Filters Shimmer */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 px-1 sm:px-0">
                    <Shimmer className="h-14 w-full rounded-3xl md:col-span-6" />
                    <Shimmer className="h-14 w-full rounded-2xl md:col-span-3" />
                    <Shimmer className="h-14 w-full rounded-2xl md:col-span-3" />
                </div>

                {/* Grid Shimmer */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 md:gap-6 px-1 sm:px-0">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 md:p-7 border border-slate-100 dark:border-slate-800 shadow-sm">
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex items-center gap-3">
                                    <Shimmer className="w-12 h-12 rounded-xl" />
                                    <div className="space-y-2">
                                        <Shimmer className="h-5 w-40 rounded-lg" />
                                        <Shimmer className="h-3 w-24 rounded-lg" />
                                    </div>
                                </div>
                                <Shimmer className="w-20 h-6 rounded-full" />
                            </div>
                            <div className="space-y-3">
                                <Shimmer className="h-4 w-full rounded-lg" />
                                <Shimmer className="h-4 w-3/4 rounded-lg" />
                                <Shimmer className="h-4 w-1/2 rounded-lg" />
                            </div>
                            <div className="mt-6 flex gap-2">
                                <Shimmer className="h-10 flex-1 rounded-lg" />
                                <Shimmer className="h-10 w-10 rounded-lg" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-20 lg:pb-8 px-2 sm:px-0 max-w-full overflow-x-hidden">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-1 sm:px-0">
                <div className="animate-in fade-in slide-in-from-left duration-500">
                    <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3 tracking-tight">
                        <div className="p-2 bg-emerald-500/10 rounded-2xl">
                            <CalendarDays className="text-[#10b981]" size={32} />
                        </div>
                        Consultas Médicas
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base mt-1 font-medium italic pl-1">
                        Organize sua rotina de saúde com elegância.
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-3">
                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-full sm:w-auto">
                        <button
                            onClick={() => setViewMode('list')}
                            className={clsx(
                                "flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-1.5 rounded-lg text-sm font-bold transition-all",
                                viewMode === 'list' ? "bg-white dark:bg-slate-700 text-[#10b981] shadow-sm" : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
                            )}
                        >
                            <List size={18} />
                            Lista
                        </button>
                        <button
                            onClick={() => setViewMode('calendar')}
                            className={clsx(
                                "flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-1.5 rounded-lg text-sm font-bold transition-all",
                                viewMode === 'calendar' ? "bg-white dark:bg-slate-700 text-[#10b981] shadow-sm" : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
                            )}
                        >
                            <CalendarDays size={18} />
                            Calendário
                        </button>
                    </div>
                    <button
                        onClick={() => handleOpenModal()}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#10b981] hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02] active:scale-95 text-sm"
                    >
                        <Plus size={20} />
                        Agendar
                    </button>
                </div>
            </div>

            {viewMode === 'calendar' && (
                <div className="animate-in zoom-in-95 duration-300 mx-1 sm:mx-0">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-4 shadow-xl shadow-slate-200/50 dark:shadow-none transition-all">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-black text-slate-900 dark:text-white capitalize flex items-center gap-2">
                                <span className="w-2 h-8 bg-[#10b981] rounded-full"></span>
                                {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
                            </h2>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                                    className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-slate-500 transition-colors"
                                >
                                    <ChevronLeft size={20} />
                                </button>
                                <button
                                    onClick={() => {
                                        const now = new Date();
                                        setCurrentMonth(now);
                                        setSelectedDay(now);
                                        setFilterDate(format(now, 'yyyy-MM-dd'));
                                    }}
                                    className="px-3 py-1 text-xs font-bold text-[#10b981] hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                                >
                                    Hoje
                                </button>
                                <button
                                    onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                                    className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-slate-500 transition-colors"
                                >
                                    <ChevronRightIcon size={20} />
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-7 gap-px mb-1">
                            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                                <div key={day} className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider py-1">
                                    {day}
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-7 gap-2">
                            {calendarDays.map((day, idx) => {
                                const dayApps = getAppointmentsForDay(day);
                                const isSelected = isSameDay(day, selectedDay);
                                const isCurrentMonth = isSameMonth(day, monthStart);
                                const isToday = isSameDay(day, new Date());

                                // Multi-status Visual Logic
                                const uniqueStatuses = [...new Set(dayApps.map(a => a.status))];
                                const hasScheduled = uniqueStatuses.includes('scheduled');
                                const hasCompleted = uniqueStatuses.includes('completed');
                                const hasCancelled = uniqueStatuses.includes('cancelled');

                                // Determine dynamic styles
                                let containerStyles = {};
                                let dynamicClasses = "";

                                if (isSelected && dayApps.length === 0) {
                                    dynamicClasses = "bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-200 dark:shadow-emerald-900/20";
                                } else if (isToday && dayApps.length === 0) {
                                    dynamicClasses = "bg-emerald-50 border-emerald-200 text-[#10b981] dark:bg-emerald-900/20 dark:border-emerald-800";
                                } else if (dayApps.length > 0) {
                                    const primaryStatus = hasScheduled ? 'scheduled' : (hasCompleted ? 'completed' : 'cancelled');
                                    const statusHexColors = {
                                        scheduled: "#3b82f6",
                                        completed: "#10b981",
                                        cancelled: "#f43f5e"
                                    };

                                    const statusClasses = {
                                        scheduled: "bg-blue-50/50 dark:bg-blue-900/10 border-blue-200/50 dark:border-blue-800/30",
                                        completed: "bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-200/50 dark:border-emerald-800/30",
                                        cancelled: "bg-rose-50/50 dark:bg-rose-900/10 border-rose-200/50 dark:border-rose-800/30"
                                    };
                                    dynamicClasses = statusClasses[primaryStatus] + " text-slate-700 dark:text-slate-300";

                                    // Multi-status Border Gradient
                                    if (uniqueStatuses.length > 1) {
                                        const gradientColors = uniqueStatuses.map(s => statusHexColors[s]).join(', ');
                                        if (isSelected) {
                                            containerStyles = {
                                                background: `linear-gradient(#059669, #059669) padding-box, linear-gradient(135deg, ${gradientColors}) border-box`,
                                                border: '4px solid transparent'
                                            };
                                            dynamicClasses = "text-white shadow-xl shadow-emerald-200/50 dark:shadow-emerald-900/40 scale-105 z-10";
                                        } else {
                                            containerStyles = {
                                                background: `linear-gradient(var(--bg-day), var(--bg-day)) padding-box, linear-gradient(135deg, ${gradientColors}) border-box`,
                                                border: '4px solid transparent'
                                            };
                                            dynamicClasses = "bg-white dark:bg-slate-900 [--bg-day:theme(colors.white)] dark:[--bg-day:theme(colors.slate.900)] text-slate-700 dark:text-slate-300 hover:scale-105";
                                        }
                                    } else {
                                        // SINGLE STATUS BORDER
                                        if (isSelected) {
                                            dynamicClasses = "bg-emerald-600 text-white shadow-xl shadow-emerald-200/50 dark:shadow-emerald-900/40 scale-105 z-10 border-[4px]";
                                            containerStyles = { borderColor: statusHexColors[primaryStatus] };
                                        } else {
                                            const ringColors = {
                                                scheduled: "ring-blue-500/20 border-blue-200/50 dark:border-blue-800/30",
                                                completed: "ring-emerald-500/20 border-emerald-200/50 dark:border-emerald-800/30",
                                                cancelled: "ring-rose-500/20 border-rose-200/50 dark:border-rose-800/30"
                                            };
                                            dynamicClasses += ` ring-[4px] ${ringColors[primaryStatus] || ringColors.scheduled} ring-offset-1 ring-offset-emerald-50/20 shadow-sm`;
                                        }
                                    }
                                } else {
                                    dynamicClasses = "bg-white dark:bg-slate-900 border-transparent text-slate-700 dark:text-slate-300";
                                    if (!isCurrentMonth) dynamicClasses += " opacity-20";
                                }

                                return (
                                    <button
                                        key={idx}
                                        onClick={() => {
                                            setSelectedDay(day);
                                            setFilterDate(format(day, 'yyyy-MM-dd'));
                                        }}
                                        style={containerStyles}
                                        className={clsx(
                                            "relative h-11 sm:h-14 flex flex-col items-center justify-center rounded-xl transition-all duration-300",
                                            dynamicClasses,
                                            !isCurrentMonth && dayApps.length === 0 && "opacity-20 pointer-events-none"
                                        )}
                                    >
                                        <span className="text-sm font-bold">{format(day, 'd')}</span>
                                        {dayApps.length > 0 && (
                                            <div className="absolute bottom-1.5 flex gap-1.5">
                                                {hasScheduled && (
                                                    <div className={clsx("w-1.5 h-1.5 rounded-full ring-1", isSelected ? "bg-blue-400 ring-white/50" : "bg-blue-500 ring-transparent shadow-[0_0_8px_rgba(59,130,246,0.5)]")} />
                                                )}
                                                {hasCompleted && (
                                                    <div className={clsx("w-1.5 h-1.5 rounded-full ring-1", isSelected ? "bg-emerald-400 ring-white/50" : "bg-emerald-500 ring-transparent shadow-[0_0_8px_rgba(16,185,129,0.5)]")} />
                                                )}
                                                {hasCancelled && (
                                                    <div className={clsx("w-1.5 h-1.5 rounded-full ring-1", isSelected ? "bg-rose-400 ring-white/50" : "bg-rose-500 ring-transparent shadow-[0_0_8px_rgba(244,63,94,0.5)]")} />
                                                )}
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Status Legend */}
                        <div className="mt-4 pt-4 border-t border-slate-50 dark:border-slate-800/50 flex flex-wrap items-center justify-center gap-4 sm:gap-6">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.4)]" />
                                <span className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Agendada</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.4)]" />
                                <span className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Realizada</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.4)]" />
                                <span className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Cancelada</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Filters & Search - Senior UI Polish */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 px-1 sm:px-0">
                <div className="md:col-span-6 relative group">
                    <label htmlFor="main-search-input" className="sr-only">Buscar consultas</label>
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#10b981] transition-colors" size={18} />
                    <input
                        id="main-search-input"
                        name="search"
                        autoComplete="off"
                        type="text"
                        placeholder={windowWidth < 640 ? "🔎 Médico, especialidade ou paciente..." : "🔎 Buscar por médico, especialidade ou paciente..."}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-11 pr-4 py-4 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-3xl shadow-lg shadow-slate-200/20 dark:shadow-none focus:ring-4 focus:ring-[#10b981]/10 focus:border-[#10b981] outline-none transition-all dark:text-white placeholder:text-slate-400 text-sm md:text-base font-semibold"
                    />
                </div>

                <div className="md:col-span-3 relative flex items-center">
                    <div className="absolute left-4 z-10 text-slate-400">
                        <Calendar size={18} />
                    </div>
                    <input
                        type="date"
                        value={filterDate}
                        onChange={(e) => {
                            setFilterDate(e.target.value);
                            if (e.target.value) {
                                setSelectedDay(parseISO(e.target.value));
                                setViewMode('list');
                            }
                        }}
                        className="w-full pl-11 pr-10 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm focus:ring-2 focus:ring-[#10b981]/10 focus:border-[#10b981] outline-none transition-all dark:text-white text-sm font-medium hover:border-slate-300 dark:hover:border-slate-700 appearance-none"
                    />
                    {filterDate && (
                        <button
                            onClick={() => {
                                setFilterDate('');
                                setCurrentPage(1);
                            }}
                            className="absolute right-3 p-1.5 text-slate-400 hover:text-rose-500 transition-colors bg-white dark:bg-slate-900"
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>

                {/* Custom Emoji Dropdown - Status Filter */}
                <div className="md:col-span-3 relative" ref={dropdownRef}>
                    <button
                        onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                        className="w-full h-full flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm focus:ring-2 focus:ring-[#10b981]/20 focus:border-[#10b981] outline-none transition-all dark:text-white text-sm md:text-base font-medium hover:border-slate-300 dark:hover:border-slate-700"
                    >
                        <div className="flex items-center gap-3">
                            <span className="text-xl leading-none">{selectedStatusEmoji}</span>
                            <span className="truncate">{selectedStatusLabel}</span>
                        </div>
                        <ChevronRight className={clsx("text-slate-400 transition-transform duration-200", isStatusDropdownOpen ? "rotate-90" : "rotate-0")} size={18} />
                    </button>

                    {isStatusDropdownOpen && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                            <div className="p-2 space-y-1">
                                {statusOptions.map((option) => (
                                    <button
                                        key={option.value}
                                        onClick={() => {
                                            setFilterStatus(option.value);
                                            setIsStatusDropdownOpen(false);
                                        }}
                                        className={clsx(
                                            "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left",
                                            filterStatus === option.value
                                                ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
                                                : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                                        )}
                                    >
                                        <span className="text-xl leading-none">{option.emoji}</span>
                                        {option.label}
                                        {filterStatus === option.value && <CheckCircle2 size={16} className="ml-auto" />}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Appointments Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 md:gap-6 px-1 sm:px-0">
                {paginatedAppointments.length > 0 ? (
                    paginatedAppointments.map((app) => (
                        <div
                            key={app.id}
                            className="group bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 p-6 md:p-7 shadow-xl shadow-slate-200/40 dark:shadow-none hover:shadow-2xl hover:shadow-emerald-500/10 dark:hover:bg-slate-800/50 transition-all duration-500 relative overflow-hidden flex flex-col h-full"
                        >
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl flex items-center justify-center text-emerald-600">
                                        <Stethoscope size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-[#10b981] transition-colors line-clamp-1">
                                            {app.doctorName || 'Médico não informado'}
                                        </h3>
                                        <p className="text-xs text-[#10b981] font-semibold uppercase tracking-wider">
                                            {app.specialty || 'Clínico Geral'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={clsx(
                                        "text-[10px] font-bold px-2 py-1 rounded-full border",
                                        statusMap[app.status || 'scheduled'].color
                                    )}>
                                        {statusMap[app.status || 'scheduled'].label}
                                    </span>
                                    {hasManagementPermission(app.patientId) && (
                                        <button
                                            onClick={() => handleOpenModal(app)}
                                            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                                        >
                                            <MoreVertical size={18} />
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2.5">
                                <div className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-400">
                                    <Clock size={16} className="text-[#10b981]/70" />
                                    <span className="font-semibold text-slate-900 dark:text-white">
                                        {format(new Date(app.appointmentDate), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                    </span>
                                </div>

                                {app.locationName && (
                                    <div className="flex items-start gap-2.5 text-sm text-slate-600 dark:text-slate-400">
                                        <Building2 size={16} className="text-[#10b981]/70 mt-0.5" />
                                        <span className="font-medium text-slate-800 dark:text-slate-200">{app.locationName}</span>
                                    </div>
                                )}

                                {app.address && (
                                    <div className="flex items-start gap-2.5 text-sm text-slate-500 dark:text-slate-500">
                                        <MapPinIcon size={16} className="text-slate-400 mt-0.5" />
                                        <span className="line-clamp-2">{app.address}</span>
                                    </div>
                                )}

                                <div className="flex flex-wrap gap-4 mt-1">
                                    {app.contactPhone && (
                                        <div className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-[#10b981] transition-colors">
                                            <Phone size={14} />
                                            {app.contactPhone}
                                        </div>
                                    )}
                                    {app.whatsappPhone && (
                                        <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                                            <MessageSquare size={14} />
                                            {app.whatsappPhone}
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-400 pt-1">
                                    <User size={16} className="text-[#10b981]/70" />
                                    <span className="font-medium truncate">Paciente: {app.patients?.name || 'Não identificado'}</span>
                                </div>
                            </div>

                            {app.notes && (
                                <div className="mt-4 pt-3 border-t border-slate-50 dark:border-slate-800">
                                    <div className="flex items-start gap-2 text-sm text-slate-500 dark:text-slate-500">
                                        <FileText size={14} className="mt-0.5" />
                                        <p className="italic line-clamp-2">{app.notes}</p>
                                    </div>
                                </div>
                            )}

                            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 pt-1">
                                {app.address && (
                                    <div className="flex-1 flex gap-2">
                                        <a
                                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(app.address + (app.locationName ? ' ' + app.locationName : ''))}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex-1 flex items-center justify-center gap-1.5 text-xs font-bold py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 transition-colors"
                                            title="Abrir no Google Maps"
                                        >
                                            <MapPinIcon size={14} />
                                            Maps
                                        </a>
                                        <a
                                            href={`https://waze.com/ul?q=${encodeURIComponent(app.address)}&navigate=yes`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex-1 flex items-center justify-center gap-1.5 text-xs font-bold py-2 rounded-lg bg-[#33ccff]/10 text-[#0582ad] border border-[#33ccff]/30 hover:bg-[#33ccff]/20 transition-colors"
                                            title="Abrir no Waze"
                                        >
                                            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                                                <path d="M18.503 13.068a2.501 2.501 0 0 1-5.003 0c0-.14.01-.277.032-.41l-2.028-.671a2.501 2.501 0 0 1-5.006 0 2.5 2.5 0 0 1 1.708-2.37l1.411-3.692A7.135 7.135 0 0 1 12 5.068c3.94 0 7.135 3.194 7.135 7.135 0 .23-.01.458-.032.682l1.638.541a.5.5 0 0 1 .163.844l-2.401 1.831c.022-.249.034-.5.034-.755a8.136 8.136 0 0 0-8.135-8.135 8.136 8.136 0 0 0-8.136 8.135c0 1.25.28 2.433.784 3.492l-1.018 2.665a1 1 0 0 0 1.266 1.266l2.665-1.018a8.12 8.12 0 0 0 4.439 1.295c4.493 0 8.135-3.642 8.135-8.135 0-.173-.005-.345-.015-.516l2.13.705a1.5 1.5 0 0 0 .49-2.532l-3.361-2.563a3.502 3.502 0 0 0-2.39-4.862l-1.41-3.693a1 1 0 0 0-1.88 0l-1.411 3.693a3.502 3.502 0 0 0-2.39 4.862l-3.36 2.563a1.5 1.5 0 0 0 .489 2.532l2.13-.705c-.01.171-.015.343-.015.516 0 4.493 3.642 8.135 8.135 8.135.804 0 1.583-.116 2.316-.334l.684.26a1 1 0 0 0 1.266-1.266l-.26-.684c.677-.732 1.21-1.579 1.576-2.51l3.053 1.012a.5.5 0 0 0 .61-.643l-1.442-3.771a3.501 3.501 0 0 0 2.215-3.32z" />
                                            </svg>
                                            Waze
                                        </a>
                                    </div>
                                )}
                                <div className="flex gap-2 min-w-fit">
                                    {app.status === 'scheduled' && hasManagementPermission(app.patientId) && (
                                        <button
                                            onClick={() => updateAppointment(app.id, { status: 'completed' })}
                                            className="flex-1 flex items-center justify-center gap-1.5 text-xs font-bold py-2 px-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/10 text-emerald-600 border border-emerald-100 dark:border-emerald-900/30 hover:bg-emerald-100 transition-colors whitespace-nowrap"
                                        >
                                            <CheckCircle2 size={14} />
                                            Realizada
                                        </button>
                                    )}

                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="md:col-span-2 py-16 flex flex-col items-center justify-center bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-slate-100 dark:border-slate-800">
                        <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center mb-4 text-slate-300 dark:text-slate-700">
                            {viewMode === 'calendar' ? <CalendarDays size={40} /> : <Calendar size={40} />}
                        </div>
                        <h3 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white mb-2 text-center px-4">
                            {viewMode === 'calendar'
                                ? `Nenhuma consulta em ${format(selectedDay, "dd/MM/yyyy", { locale: ptBR })}`
                                : 'Nenhuma consulta encontrada'
                            }
                        </h3>
                        <p className="text-slate-500 dark:text-slate-400 text-center max-w-sm px-6 text-sm md:text-base leading-relaxed">
                            {viewMode === 'calendar'
                                ? 'Selecione outro dia no calendário ou agende uma nova consulta.'
                                : 'Você não tem consultas agendadas que correspondam aos filtros atuais.'
                            }
                        </p>
                    </div>
                )}
            </div>

            {/* Pagination (Only in List View) */}
            {viewMode === 'list' && totalPages > 1 && (
                <div className="px-1 sm:px-0">
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                    />
                </div>
            )}

            {/* Modal de Cadastro/Edição */}
            {
                isModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-start sm:items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto pt-20 sm:pt-4">
                        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-100 dark:border-slate-800 my-8">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                                    {editingAppointment ? 'Editar Consulta' : 'Agendar Nova Consulta'}
                                </h2>
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="p-2 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full transition-colors"
                                >
                                    <XCircle size={24} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label id="patient-label" htmlFor="patient-select" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Paciente</label>
                                    <div className="relative" ref={patientDropdownRef}>
                                        <button
                                            type="button"
                                            id="patient-select"
                                            aria-labelledby="patient-label patient-select"
                                            onClick={() => setIsPatientDropdownOpen(!isPatientDropdownOpen)}
                                            className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#10b981] outline-none transition-all dark:text-white text-left"
                                        >
                                            <span className="truncate">
                                                {patients.find(p => p.id === formData.patientId)?.name || 'Selecione o paciente'}
                                            </span>
                                            <ChevronRight className={clsx("text-slate-400 transition-transform duration-200", isPatientDropdownOpen ? "rotate-90" : "rotate-0")} size={16} />
                                        </button>

                                        {isPatientDropdownOpen && (
                                            <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-[120] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 max-h-60 overflow-y-auto">
                                                <div className="p-2 border-b border-slate-100 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800 z-10">
                                                    <label htmlFor="patient-search-input" className="sr-only">Buscar paciente</label>
                                                    <input
                                                        type="text"
                                                        name="patientSearch"
                                                        id="patient-search-input"
                                                        aria-label="Buscar paciente"
                                                        autoComplete="off"
                                                        placeholder="Buscar paciente..."
                                                        value={patientSearchTerm}
                                                        onChange={(e) => setPatientSearchTerm(e.target.value)}
                                                        className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg outline-none focus:border-emerald-500 transition-colors dark:text-white"
                                                        autoFocus
                                                        onClick={(e) => e.stopPropagation()}
                                                    />
                                                </div>
                                                <div className="p-1 space-y-0.5">
                                                    {filteredPatients.length > 0 ? (
                                                        filteredPatients.map((patient) => (
                                                            <button
                                                                key={patient.id}
                                                                type="button"
                                                                onClick={() => {
                                                                    setFormData({ ...formData, patientId: patient.id });
                                                                    setIsPatientDropdownOpen(false);
                                                                }}
                                                                className={clsx(
                                                                    "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left",
                                                                    formData.patientId === patient.id
                                                                        ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
                                                                        : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                                                                )}
                                                            >
                                                                <span className="truncate flex-1">{patient.name}</span>
                                                                {formData.patientId === patient.id && <CheckCircle2 size={14} className="ml-auto flex-shrink-0" />}
                                                            </button>
                                                        ))
                                                    ) : (
                                                        <div className="px-3 py-2 text-sm text-slate-400 italic text-center">
                                                            Nenhum paciente encontrado.
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="relative">
                                        <label htmlFor="specialty-input" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Especialidade</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <Stethoscope className="text-slate-400" size={18} />
                                            </div>
                                            <input
                                                id="specialty-input"
                                                name="specialty"
                                                type="text"
                                                required
                                                autoComplete="off"
                                                placeholder="Ex: Cardiologia"
                                                value={specialtySearch}
                                                onChange={(e) => {
                                                    setSpecialtySearch(e.target.value);
                                                    setShowSpecialties(true);
                                                    setFormData({ ...formData, specialtyId: '', specialtyText: e.target.value });
                                                }}
                                                onFocus={() => setShowSpecialties(true)}
                                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#10b981] outline-none transition-all dark:text-white"
                                            />
                                        </div>
                                        {showSpecialties && specialtySearch.length > 0 && (
                                            <div className="absolute z-[110] left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                                                {filteredSpecialties.length > 0 ? (
                                                    filteredSpecialties.map(s => (
                                                        <button
                                                            key={s.id}
                                                            type="button"
                                                            onClick={() => {
                                                                setFormData({ ...formData, specialtyId: s.id, specialtyText: s.name });
                                                                setSpecialtySearch(s.name);
                                                                setShowSpecialties(false);
                                                            }}
                                                            className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                                                        >
                                                            {s.name}
                                                        </button>
                                                    ))
                                                ) : (
                                                    <div className="px-4 py-2 text-sm text-slate-400 italic">
                                                        Nenhuma especialidade oficial encontrada. Usando texto personalizado.
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <label htmlFor="doctor-input" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Médico(a)</label>
                                        <input
                                            id="doctor-input"
                                            name="doctorName"
                                            type="text"
                                            required
                                            autoComplete="name"
                                            placeholder="Ex: Dr. Leonardo SiG"
                                            value={formData.doctorName}
                                            onChange={(e) => setFormData({ ...formData, doctorName: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#10b981] outline-none transition-all dark:text-white"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label htmlFor="date-input" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Data</label>
                                            <input
                                                id="date-input"
                                                name="datePart"
                                                required
                                                type="date"
                                                value={formData.datePart}
                                                onChange={(e) => setFormData({ ...formData, datePart: e.target.value })}
                                                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#10b981] outline-none transition-all dark:text-white"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="time-input" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Horário</label>
                                            <input
                                                id="time-input"
                                                name="timePart"
                                                required
                                                type="time"
                                                value={formData.timePart}
                                                onChange={(e) => setFormData({ ...formData, timePart: e.target.value })}
                                                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#10b981] outline-none transition-all dark:text-white"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label id="status-label" htmlFor="status-select" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Status</label>
                                        <div className="relative" ref={modalStatusDropdownRef}>
                                            <button
                                                type="button"
                                                id="status-select"
                                                aria-labelledby="status-label status-select"
                                                onClick={() => setIsModalStatusOpen(!isModalStatusOpen)}
                                                className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#10b981] outline-none transition-all dark:text-white text-left"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <span className="text-lg leading-none">
                                                        {modalStatusOptions.find(opt => opt.value === formData.status)?.emoji}
                                                    </span>
                                                    <span>
                                                        {modalStatusOptions.find(opt => opt.value === formData.status)?.label}
                                                    </span>
                                                </div>
                                                <ChevronRight className={clsx("text-slate-400 transition-transform duration-200", isModalStatusOpen ? "rotate-90" : "rotate-0")} size={16} />
                                            </button>

                                            {isModalStatusOpen && (
                                                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-[120] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                                    <div className="p-1 space-y-0.5">
                                                        {modalStatusOptions.map((option) => (
                                                            <button
                                                                key={option.value}
                                                                type="button"
                                                                onClick={() => {
                                                                    setFormData({ ...formData, status: option.value });
                                                                    setIsModalStatusOpen(false);
                                                                }}
                                                                className={clsx(
                                                                    "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left",
                                                                    formData.status === option.value
                                                                        ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
                                                                        : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                                                                )}
                                                            >
                                                                <span className="text-lg leading-none">{option.emoji}</span>
                                                                {option.label}
                                                                {formData.status === option.value && <CheckCircle2 size={14} className="ml-auto" />}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="location-input" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Local (Clínica/Hospital)</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <Building2 className="text-slate-400" size={18} />
                                            </div>
                                            <input
                                                id="location-input"
                                                name="locationName"
                                                type="text"
                                                autoComplete="off"
                                                placeholder="Ex: Clínica SiG Saúde"
                                                value={formData.locationName}
                                                onChange={(e) => setFormData({ ...formData, locationName: e.target.value })}
                                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#10b981] outline-none transition-all dark:text-white"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label htmlFor="address-input" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Endereço</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <MapPin className="text-slate-400" size={18} />
                                            </div>
                                            <input
                                                id="address-input"
                                                name="address"
                                                type="text"
                                                autoComplete="street-address"
                                                placeholder="Ex: Av. Central, 123 - Sala 4"
                                                value={formData.address}
                                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#10b981] outline-none transition-all dark:text-white"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="contact-phone-input" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Telefone Contato</label>
                                        <input
                                            id="contact-phone-input"
                                            name="contactPhone"
                                            type="tel"
                                            autoComplete="tel"
                                            placeholder="(00) 00000-0000"
                                            value={formData.contactPhone}
                                            onChange={(e) => setFormData({ ...formData, contactPhone: formatPhone(e.target.value) })}
                                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#10b981] outline-none transition-all dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="whatsapp-input" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Telefone ZAP</label>
                                        <input
                                            id="whatsapp-input"
                                            name="whatsappPhone"
                                            type="tel"
                                            autoComplete="tel"
                                            placeholder="(00) 00000-0000"
                                            value={formData.whatsappPhone}
                                            onChange={(e) => setFormData({ ...formData, whatsappPhone: formatPhone(e.target.value) })}
                                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#10b981] outline-none transition-all dark:text-white"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="notes-input" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Notas / Procedimentos</label>
                                    <textarea
                                        id="notes-input"
                                        name="notes"
                                        autoComplete="off"
                                        placeholder="O que levar? Jejum necessário? Notas pós-consulta..."
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        rows={3}
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#10b981] outline-none transition-all dark:text-white resize-none"
                                    />
                                </div>

                                <div className="flex flex-col-reverse md:flex-row gap-3 pt-4">
                                    {editingAppointment && (
                                        <button
                                            type="button"
                                            onClick={() => handleDeleteClick(editingAppointment)}
                                            className="flex-1 px-4 py-3 rounded-xl border border-rose-200 text-rose-600 font-bold hover:bg-rose-50 transition-colors"
                                        >
                                            Desmarcar
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="flex-1 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="flex-[2] px-4 py-3 rounded-xl bg-[#10b981] text-white font-bold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                                    >
                                        {isLoading ? 'Salvando...' : editingAppointment ? 'Salvar Alterações' : 'Agendar Agora'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            <ConfirmationModal
                isOpen={!!appointmentToDelete}
                onClose={() => setAppointmentToDelete(null)}
                onConfirm={confirmDelete}
                title="Desmarcar Consulta"
                description={
                    appointmentToDelete ? (
                        <span>
                            Tem certeza que deseja desmarcar a consulta com:
                            <br /><br />
                            <strong className="text-slate-900 block font-bold text-lg leading-tight">
                                {appointmentToDelete.doctorName}
                            </strong>
                            <span className="text-slate-500 text-sm block mt-1">
                                {appointmentToDelete.specialty}
                            </span>
                            <br />
                            <span className="block text-red-600 font-medium">
                                Essa ação não pode ser desfeita.
                            </span>
                        </span>
                    ) : "Confirmar exclusão?"
                }
            />
        </div>
    );
};

export default Appointments;

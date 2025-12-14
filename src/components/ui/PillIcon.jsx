import React from 'react';

const PillIcon = ({ shape = 'round', color = '#e2e8f0', size = 32, className = '' }) => {
    // Colors map to hex values usually, but we accept direct hex codes
    // Or we could map Tailwind colors to hex for SVG filling
    const getColor = (c) => {
        const colors = {
            white: '#f1f5f9', // slate-100
            blue: '#3b82f6', // blue-500
            red: '#ef4444', // red-500
            green: '#22c55e', // green-500
            yellow: '#eab308', // yellow-500
            purple: '#a855f7', // purple-500
            orange: '#f97316', // orange-500
            pink: '#ec4899', // pink-500
            black: '#1e293b', // slate-800
        };
        return colors[c] || c || '#e2e8f0';
    };

    const fill = getColor(color);

    const commonProps = {
        width: size,
        height: size,
        viewBox: "0 0 24 24",
        fill: fill,
        stroke: "#94a3b8", // slate-400 border
        strokeWidth: "1.5",
        className: `transition-all ${className}`,
        strokeLinecap: "round",
        strokeLinejoin: "round"
    };

    // Shapes
    switch (shape) {
        case 'capsule':
            return (
                <svg {...commonProps}>
                    <path d="M12 2a7 7 0 0 1 7 7v6a7 7 0 0 1-14 0V9a7 7 0 0 1 7-7z" transform="rotate(45, 12, 12)" />
                    <line x1="8.5" y1="8.5" x2="15.5" y2="15.5" stroke="currentColor" strokeOpacity="0.3" transform="rotate(45, 12, 12)" />
                </svg>
            );
        case 'oval': // Oblong
            return (
                <svg {...commonProps}>
                    <rect x="2" y="6" width="20" height="12" rx="6" />
                    <line x1="12" y1="6" x2="12" y2="18" stroke="currentColor" strokeOpacity="0.2" />
                </svg>
            );
        case 'liquid': // Drop / Bottle
            return (
                <svg {...commonProps} fill="none" strokeWidth="2">
                    <path d="M12 2L12 22" stroke="transparent" /> {/* Spacer */}
                    <path d="M14.666 8H9.334a1 1 0 0 0-.965 1.25l2.835 11.085a2 2 0 0 0 1.936 1.498h.857a-2 2 0 0 0 1.935-1.498l3.666-11.085A1 1 0 0 0 17 8z" fill={fill} stroke="#94a3b8" />
                    <path d="M10 5h4v3h-4z" fill="#cbd5e1" stroke="#94a3b8" /> {/* Cap */}
                </svg>
            );
        case 'triangle':
            return (
                <svg {...commonProps}>
                    <path d="M12 3l10 18H2L12 3z" strokeLinejoin="round" />
                </svg>
            );
        case 'square':
            return (
                <svg {...commonProps}>
                    <rect x="4" y="4" width="16" height="16" rx="2" />
                </svg>
            );
        case 'round':
        default:
            return (
                <svg {...commonProps}>
                    <circle cx="12" cy="12" r="9" />
                    <line x1="12" y1="3" x2="12" y2="21" stroke="currentColor" strokeOpacity="0.2" />
                </svg>
            );
    }
};

export default PillIcon;

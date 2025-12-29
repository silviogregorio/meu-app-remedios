import React from 'react';

const CustomUserLock = ({ size = 32, className }) => {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            {/* Person - Dark Blue */}
            <g className="text-slate-900 dark:text-slate-100">
                <circle cx="7" cy="7" r="3" fill="currentColor" />
                <path d="M7 11c-2.5 0-4.5 1.5-4.5 3.5V20h9v-5.5c0-2-2-3.5-4.5-3.5z" fill="currentColor" />
            </g>

            {/* Padlock - Bright Blue */}
            <g className="text-blue-500">
                <rect x="13" y="12" width="9" height="8" rx="1.5" fill="currentColor" />
                <path d="M14.5 12V9.5c0-1.7 1.3-3 3-3s3 1.3 3 3V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <circle cx="17.5" cy="16" r="1" fill="white" />
            </g>
        </svg>
    );
};

export default CustomUserLock;

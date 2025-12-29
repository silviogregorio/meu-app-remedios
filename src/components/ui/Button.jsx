import React from 'react';
import clsx from 'clsx';

const Button = ({
    children,
    onClick,
    variant = 'primary',
    size = 'md',
    className,
    type = 'button',
    fullWidth = false,
    disabled = false,
    'aria-label': ariaLabel, // Support explicit aria-label
    ...rest // Pass through other props like aria-* attributes
}) => {
    const baseStyles = "inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/50 focus-visible:ring-offset-2";

    const variants = {
        primary: "bg-primary text-white shadow-lg shadow-primary/30 hover:bg-primary-dark hover:shadow-primary/40",
        secondary: "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600 shadow-sm",
        ghost: "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200",
        danger: "bg-danger text-white shadow-lg shadow-danger/30 hover:bg-rose-600",
        outline: "border-2 border-primary text-primary hover:bg-primary-light"
    };

    // Minimum touch target sizes for accessibility (WCAG 2.5.5)
    // All sizes now meet or exceed 44px minimum, md+ meets 48px recommended
    const sizes = {
        sm: "px-4 py-2.5 text-sm min-h-[44px]",
        md: "px-6 py-3 text-base min-h-[48px]",
        lg: "px-8 py-3.5 text-lg min-h-[52px]",
        senior: "px-10 py-4 text-xl min-h-[56px] font-black tracking-wide",
        icon: "p-3 min-h-[48px] min-w-[48px]"
    };

    return (
        <button
            type={type}
            className={clsx(
                baseStyles,
                variants[variant],
                sizes[size],
                fullWidth && "w-full",
                className
            )}
            onClick={onClick}
            disabled={disabled}
            aria-label={ariaLabel}
            aria-disabled={disabled || undefined}
            {...rest}
        >
            {children}
        </button>
    );
};

export default Button;

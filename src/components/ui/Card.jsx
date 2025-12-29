import React from 'react';
import clsx from 'clsx';

const Card = ({ children, className, onClick, 'aria-label': ariaLabel, role }) => {
    // Determine appropriate role for clickable cards
    const computedRole = role || (onClick ? 'button' : undefined);

    return (
        <div
            onClick={onClick}
            role={computedRole}
            tabIndex={onClick ? 0 : undefined}
            aria-label={ariaLabel}
            onKeyDown={onClick ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onClick(e);
                }
            } : undefined}
            className={clsx(
                "bg-slate-50/40 dark:bg-slate-900 rounded-2xl shadow-soft border border-slate-100 dark:border-slate-800 overflow-hidden transition-all duration-300",
                onClick && "cursor-pointer hover:shadow-lg hover:-translate-y-1 hover:border-primary/20 dark:hover:border-primary/20 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/50 focus-visible:ring-offset-2",
                className
            )}
        >
            {children}
        </div>
    );
};

export const CardTitle = ({ children, className }) => (
    <h3 className={clsx("font-bold text-lg text-slate-900 dark:text-white", className)}>
        {children}
    </h3>
);

export const CardHeader = ({ children, className }) => (
    <div className={clsx("px-6 py-4 border-b border-slate-50 dark:border-slate-800", className)}>
        {children}
    </div>
);

export const CardContent = ({ children, className }) => (
    <div className={clsx("p-6", className)}>
        {children}
    </div>
);

export const CardFooter = ({ children, className }) => (
    <div className={clsx("px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800", className)}>
        {children}
    </div>
);

export default Card;

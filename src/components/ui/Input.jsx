import React from 'react';
import clsx from 'clsx';

const Input = ({
    label,
    type = 'text',
    placeholder,
    value,
    onChange,
    required = false,
    className,
    containerClassName,
    onBlur,
    disabled
}) => {
    return (
        <div className={clsx("flex flex-col gap-1.5", containerClassName)}>
            {label && (
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                    {label} {required && <span className="text-danger">*</span>}
                </label>
            )}
            <input
                type={type}
                className={clsx(
                    "w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500",
                    "focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-200",
                    "disabled:bg-slate-50 dark:disabled:bg-slate-800 disabled:text-slate-500",
                    className
                )}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                onBlur={onBlur}
                required={required}
                disabled={disabled}
            />
        </div>
    );
};

export default Input;

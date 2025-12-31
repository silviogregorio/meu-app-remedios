import React, { useState } from 'react';
import clsx from 'clsx';
import { Eye, EyeOff } from 'lucide-react';

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
    disabled,
    id,
    name,
    autoComplete,
    error, // Support error messages
    helperText, // Support helper text
    'aria-describedby': ariaDescribedBy,
    ...rest // Capture other props
}) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPasswordField = type === 'password';
    const inputType = isPasswordField && showPassword ? 'text' : type;

    // Generate IDs for accessibility
    const inputId = id || name || undefined;
    const errorId = error ? `${inputId}-error` : undefined;
    const helperId = helperText ? `${inputId}-helper` : undefined;

    // Combine describedby IDs
    const describedBy = [ariaDescribedBy, errorId, helperId].filter(Boolean).join(' ') || undefined;

    return (
        <div className={clsx("flex flex-col gap-1.5", containerClassName)}>
            {label && (
                <label htmlFor={inputId} className="text-base font-bold text-slate-800 dark:text-slate-200 ml-1 mb-1">
                    {label} {required && <span className="text-danger" aria-hidden="true">*</span>}
                    {required && <span className="sr-only">(obrigatório)</span>}
                </label>
            )}
            <div className="relative">
                <input
                    id={inputId}
                    name={name}
                    type={inputType}
                    className={clsx(
                        "w-full px-4 py-2.5 rounded-xl border bg-white dark:bg-slate-900 text-base text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/10 transition-all duration-200",
                        "disabled:bg-slate-50 dark:disabled:bg-slate-800 disabled:text-slate-500",
                        error
                            ? "border-danger focus:border-danger focus-visible:ring-danger/30"
                            : "border-slate-200 dark:border-slate-700 focus:border-primary",
                        isPasswordField && "pr-14", // Extra padding for icon
                        className
                    )}
                    placeholder={placeholder}
                    value={value}
                    onChange={onChange}
                    onBlur={onBlur}
                    required={required}
                    disabled={disabled}
                    autoComplete={autoComplete}
                    aria-invalid={error ? 'true' : undefined}
                    aria-describedby={describedBy}
                    aria-required={required || undefined}
                    {...rest}
                />
                {isPasswordField && (
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-2 min-h-[48px] min-w-[48px] flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                        tabIndex={-1}
                        aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                        aria-pressed={showPassword}
                    >
                        {showPassword ? (
                            <EyeOff size={20} aria-hidden="true" />
                        ) : (
                            <Eye size={20} aria-hidden="true" />
                        )}
                    </button>
                )}
            </div>
            {/* Error message */}
            {error && (
                <p id={errorId} className="text-sm text-danger ml-1 flex items-center gap-1" role="alert">
                    <span aria-hidden="true">⚠️</span> {error}
                </p>
            )}
            {/* Helper text */}
            {helperText && !error && (
                <p id={helperId} className="text-sm text-slate-500 ml-1">
                    {helperText}
                </p>
            )}
        </div>
    );
};

export default Input;

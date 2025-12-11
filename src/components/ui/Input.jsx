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
    disabled
}) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPasswordField = type === 'password';
    const inputType = isPasswordField && showPassword ? 'text' : type;

    return (
        <div className={clsx("flex flex-col gap-1.5", containerClassName)}>
            {label && (
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                    {label} {required && <span className="text-danger">*</span>}
                </label>
            )}
            <div className="relative">
                <input
                    type={inputType}
                    className={clsx(
                        "w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500",
                        "focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-200",
                        "disabled:bg-slate-50 dark:disabled:bg-slate-800 disabled:text-slate-500",
                        isPasswordField && "pr-12", // Extra padding for icon
                        className
                    )}
                    placeholder={placeholder}
                    value={value}
                    onChange={onChange}
                    onBlur={onBlur}
                    required={required}
                    disabled={disabled}
                />
                {isPasswordField && (
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                        tabIndex={-1}
                    >
                        {showPassword ? (
                            <EyeOff size={20} />
                        ) : (
                            <Eye size={20} />
                        )}
                    </button>
                )}
            </div>
        </div>
    );
};

export default Input;

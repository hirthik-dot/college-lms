import { forwardRef } from 'react';

const Input = forwardRef(function Input(
    {
        label,
        id,
        type = 'text',
        error,
        helperText,
        className = '',
        required = false,
        ...props
    },
    ref
) {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
        <div className={`space-y-1.5 ${className}`}>
            {label && (
                <label
                    htmlFor={inputId}
                    className="block text-sm font-medium text-surface-700"
                >
                    {label}
                    {required && <span className="text-danger-500 ml-0.5">*</span>}
                </label>
            )}
            <input
                ref={ref}
                id={inputId}
                type={type}
                className={`
          w-full px-3.5 py-2.5 rounded-lg border text-sm
          placeholder:text-surface-400
          transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-offset-0
          ${error
                        ? 'border-danger-400 focus:ring-danger-500 focus:border-danger-500'
                        : 'border-surface-300 focus:ring-primary-500 focus:border-primary-500'
                    }
        `}
                {...props}
            />
            {error && <p className="text-sm text-danger-500">{error}</p>}
            {helperText && !error && (
                <p className="text-sm text-surface-500">{helperText}</p>
            )}
        </div>
    );
});

export default Input;

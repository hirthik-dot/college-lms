const variantStyles = {
    default: 'bg-surface-100 text-surface-700',
    primary: 'bg-primary-100 text-primary-700',
    success: 'bg-accent-100 text-accent-700',
    warning: 'bg-warning-100 text-warning-700',
    danger: 'bg-danger-100 text-danger-700',
    info: 'bg-blue-100 text-blue-700',
};

const sizeStyles = {
    sm: 'px-2 py-0.5 text-2xs',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm',
};

export default function Badge({
    children,
    variant = 'default',
    size = 'md',
    dot = false,
    className = '',
}) {
    return (
        <span
            className={`
        inline-flex items-center gap-1 font-medium rounded-full
        ${variantStyles[variant]} ${sizeStyles[size]} ${className}
      `}
        >
            {dot && (
                <span
                    className={`w-1.5 h-1.5 rounded-full ${variant === 'success'
                            ? 'bg-accent-500'
                            : variant === 'danger'
                                ? 'bg-danger-500'
                                : variant === 'warning'
                                    ? 'bg-warning-500'
                                    : variant === 'primary'
                                        ? 'bg-primary-500'
                                        : 'bg-surface-500'
                        }`}
                />
            )}
            {children}
        </span>
    );
}

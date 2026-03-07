export default function Card({
    children,
    className = '',
    padding = 'p-6',
    hover = false,
    onClick,
    ...props
}) {
    return (
        <div
            onClick={onClick}
            className={`
        bg-white rounded-xl border border-surface-200 shadow-card
        ${hover ? 'hover:shadow-card-hover hover:-translate-y-0.5 cursor-pointer' : ''}
        transition-all duration-200 ease-out
        ${padding} ${className}
      `}
            {...props}
        >
            {children}
        </div>
    );
}

export function CardHeader({ children, className = '' }) {
    return (
        <div className={`flex items-center justify-between mb-4 ${className}`}>
            {children}
        </div>
    );
}

export function CardTitle({ children, className = '' }) {
    return (
        <h3 className={`text-lg font-semibold text-surface-900 ${className}`}>
            {children}
        </h3>
    );
}

export function CardContent({ children, className = '' }) {
    return <div className={className}>{children}</div>;
}

import { getInitials } from '../../utils/helpers';

const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
};

const colorPalette = [
    'bg-primary-500',
    'bg-accent-500',
    'bg-indigo-500',
    'bg-pink-500',
    'bg-amber-500',
    'bg-teal-500',
    'bg-violet-500',
    'bg-rose-500',
];

function hashName(name) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash);
}

export default function Avatar({
    name = '',
    src,
    size = 'md',
    className = '',
}) {
    const initials = getInitials(name);
    const bgColor = colorPalette[hashName(name) % colorPalette.length];

    if (src) {
        return (
            <img
                src={src}
                alt={name}
                className={`
          rounded-full object-cover ring-2 ring-white
          ${sizeClasses[size]} ${className}
        `}
            />
        );
    }

    return (
        <div
            className={`
        rounded-full flex items-center justify-center
        text-white font-semibold ring-2 ring-white
        ${bgColor} ${sizeClasses[size]} ${className}
      `}
            title={name}
        >
            {initials}
        </div>
    );
}

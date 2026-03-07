import { useEffect, useRef } from 'react';
import { HiX } from 'react-icons/hi';

export default function Modal({
    isOpen,
    onClose,
    title,
    children,
    size = 'md',
    className = '',
}) {
    const overlayRef = useRef(null);

    const sizeClasses = {
        sm: 'max-w-sm',
        md: 'max-w-lg',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl',
        full: 'max-w-[90vw]',
    };

    // Close on Escape
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            document.addEventListener('keydown', handleEsc);
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.removeEventListener('keydown', handleEsc);
            document.body.style.overflow = '';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const handleOverlayClick = (e) => {
        if (e.target === overlayRef.current) onClose();
    };

    return (
        <div
            ref={overlayRef}
            onClick={handleOverlayClick}
            className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center
                 bg-black/50 backdrop-blur-sm animate-fade-in"
        >
            <div
                className={`
          bg-white rounded-2xl shadow-2xl w-full mx-4
          animate-scale-in ${sizeClasses[size]} ${className}
        `}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-surface-200">
                    <h2 className="text-lg font-semibold text-surface-900">{title}</h2>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-lg text-surface-400 hover:text-surface-600
                       hover:bg-surface-100 transition-colors"
                    >
                        <HiX className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">{children}</div>
            </div>
        </div>
    );
}

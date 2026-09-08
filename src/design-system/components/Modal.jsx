import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '../cn';

const Modal = ({
                   open,
                   onClose,
                   title,
                   description,
                   size = 'md',
                   closeOnBackdrop = true,
                   closeOnEsc = true,
                   showCloseButton = true,
                   footer,
                   children,
                   className = '',
               }) => {
    useEffect(() => {
        if (!open || !closeOnEsc) return;
        const handler = (e) => e.key === 'Escape' && onClose?.();
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [open, closeOnEsc, onClose]);

    useEffect(() => {
        if (!open) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = prev; };
    }, [open]);

    const sizeStyles = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl',
        full: 'max-w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)]',
    };

    return (
        <AnimatePresence>
            {open && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 bg-neutral-900/50 backdrop-blur-sm z-50"
                        onClick={closeOnBackdrop ? onClose : undefined}
                    />

                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                            className={cn(
                                'w-full bg-white rounded-2xl shadow-xl pointer-events-auto',
                                'flex flex-col max-h-[90vh]',
                                sizeStyles[size],
                                className,
                            )}
                            onClick={(e) => e.stopPropagation()}
                        >

                            {(title || showCloseButton) && (
                                <div className="flex items-start justify-between p-6 pb-4">
                                    <div className="flex-1 pr-4">
                                        {title && <h2 className="text-h2 text-neutral-900">{title}</h2>}
                                        {description && (
                                            <p className="text-body text-neutral-600 mt-1">
                                                {description}
                                            </p>
                                        )}
                                    </div>
                                    {showCloseButton && (
                                        <button
                                            onClick={onClose}
                                            className="p-2 -mr-2 -mt-2 rounded-md hover:bg-neutral-100 transition-colors text-neutral-500 hover:text-neutral-800"
                                            aria-label="Închide"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    )}
                                </div>
                            )}

                            <div className="px-6 pb-6 overflow-y-auto flex-1">
                                {children}
                            </div>

                            {footer && (
                                <div className="border-t border-neutral-100 px-6 py-4 flex items-center justify-end gap-3">
                                    {footer}
                                </div>
                            )}
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
};

export default Modal;
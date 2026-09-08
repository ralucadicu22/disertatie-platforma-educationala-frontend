import { motion } from 'framer-motion';
import { cn } from '../cn';
const ProgressBar = ({
                         value = 0,
                         variant = 'primary',
                         size = 'md',
                         showLabel = false,
                         label,
                         animated = true,
                         className = '',
                         ...props
                     }) => {
    const clampedValue = Math.max(0, Math.min(100, value));

    const trackStyles = {
        sm: 'h-1',
        md: 'h-2',
        lg: 'h-3',
    };

    const fillVariants = {
        primary: 'bg-hero-primary',
        accent: 'bg-accent-500',
        warm: 'bg-hero-warm',
        success: 'bg-success-warm',
        warning: 'bg-warning-500',
    };

    return (
        <div className={cn('w-full', className)} {...props}>
            <div className={cn('relative w-full bg-neutral-100 rounded-full overflow-hidden', trackStyles[size])}>
                <motion.div
                    initial={animated ? { width: 0 } : { width: `${clampedValue}%` }}
                    animate={{ width: `${clampedValue}%` }}
                    transition={{
                        duration: animated ? 0.8 : 0,
                        ease: [0.4, 0, 0.2, 1],
                    }}
                    className={cn('h-full rounded-full', fillVariants[variant])}
                />
            </div>
            {showLabel && (
                <div className="flex justify-end mt-1">
                    <span className="text-caption text-neutral-600">
                        {label ?? `${Math.round(clampedValue)}%`}
                    </span>
                </div>
            )}
        </div>
    );
};

export default ProgressBar;
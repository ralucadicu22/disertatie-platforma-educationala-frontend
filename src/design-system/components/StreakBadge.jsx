import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';
import { cn } from '../cn';

const StreakBadge = ({
                         days = 0,
                         size = 'md',
                         variant = 'light',
                         className = '',
                     }) => {
    const sizeStyles = {
        sm: {
            wrap: 'px-3 py-1.5 gap-1.5',
            flame: 'w-4 h-4',
            days: 'text-caption',
            label: 'text-[9px]',
        },
        md: {
            wrap: 'px-4 py-2 gap-2',
            flame: 'w-5 h-5',
            days: 'text-h3',
            label: 'text-[10px]',
        },
        lg: {
            wrap: 'px-5 py-3 gap-2.5',
            flame: 'w-6 h-6',
            days: 'text-h2',
            label: 'text-caption',
        },
    };

    const s = sizeStyles[size];

    const variantStyles = variant === 'solid'
        ? 'bg-hero-warm text-white shadow-glow-warm'
        : 'bg-white border-2 border-warm-200 text-warm-700';

    return (
        <div className={cn(
            'inline-flex items-center rounded-full',
            s.wrap,
            variantStyles,
            className,
        )}>
            <motion.div
                animate={{
                    scale: [1, 1.15, 1],
                    rotate: [0, -5, 5, 0],
                }}
                transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                }}
            >
                <Flame className={cn(s.flame, variant === 'solid' ? 'text-white' : 'text-warm-500')} fill="currentColor" />
            </motion.div>
            <div className="flex items-baseline gap-1">
                <span className={cn('font-display font-bold leading-none', s.days)}>{days}</span>
                <span className={cn('font-bold uppercase tracking-wider opacity-80', s.label)}>
                    zile
                </span>
            </div>
        </div>
    );
};

export default StreakBadge;
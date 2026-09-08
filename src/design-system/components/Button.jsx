import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from '../cn';

const Button = ({
                    variant = 'primary',
                    size = 'md',
                    icon: Icon,
                    iconPosition = 'left',
                    loading = false,
                    fullWidth = false,
                    disabled = false,
                    className = '',
                    children,
                    ...props
                }) => {

    const variantStyles = {
        primary:
            'bg-hero-primary text-white shadow-glow-primary hover:shadow-lg hover:brightness-110 active:brightness-95',
        secondary:
            'bg-white text-neutral-800 border-2 border-neutral-200 hover:border-primary-300 hover:bg-primary-50 shadow-sm',
        ghost:
            'bg-transparent text-neutral-700 hover:bg-neutral-100 active:bg-neutral-200',
        warm:
            'bg-hero-warm text-white shadow-glow-warm hover:shadow-lg hover:brightness-105 active:brightness-95',
        success:
            'bg-success-500 text-white shadow-glow-success hover:bg-success-600 active:bg-success-700',
        danger:
            'bg-danger-500 text-white hover:bg-danger-600 active:bg-danger-700',
    };

    const sizeStyles = {
        sm: 'text-caption px-3 py-1.5 gap-1.5 rounded-md min-h-[32px]',
        md: 'text-body px-4 py-2.5 gap-2 rounded-md min-h-[40px]',
        lg: 'text-body-lg px-6 py-3 gap-2 rounded-lg min-h-[48px]',
    };

    const iconSize = {
        sm: 'w-4 h-4',
        md: 'w-5 h-5',
        lg: 'w-5 h-5',
    };

    const isDisabled = disabled || loading;

    return (
        <motion.button
            whileHover={!isDisabled ? { scale: 1.02 } : {}}
            whileTap={!isDisabled ? { scale: 0.98 } : {}}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            className={cn(
                'inline-flex items-center justify-center font-semibold',
                'transition-all duration-200',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                variantStyles[variant],
                sizeStyles[size],
                fullWidth && 'w-full',
                className,
            )}
            disabled={isDisabled}
            {...props}
        >
            {loading ? (
                <Loader2 className={cn(iconSize[size], 'animate-spin')} />
            ) : (
                <>
                    {Icon && iconPosition === 'left' && <Icon className={iconSize[size]} />}
                    {children}
                    {Icon && iconPosition === 'right' && <Icon className={iconSize[size]} />}
                </>
            )}
        </motion.button>
    );
};

export default Button;
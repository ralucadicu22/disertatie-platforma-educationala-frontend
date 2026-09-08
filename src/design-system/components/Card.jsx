import { motion } from 'framer-motion';
import { cn } from '../cn';

const Card = ({
                  variant = 'default',
                  padding = 'md',
                  interactive = false,
                  onClick,
                  as: Component = 'div',
                  className = '',
                  children,
                  ...props
              }) => {
    const variantStyles = {
        default: 'bg-white border border-neutral-200 shadow-sm',
        hero: 'bg-hero-primary text-white shadow-glow-primary border-0',
        warm: 'bg-card-soft-warm border border-warm-200',
        cool: 'bg-card-soft-cool border border-primary-200',
        fresh: 'bg-card-soft-fresh border border-success-200',
    };

    const paddingStyles = {
        none: '',
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
    };

    const clickable = interactive || !!onClick;

    if (clickable) {
        return (
            <motion.div
                whileHover={{ y: -2, boxShadow: '0 12px 32px rgba(28, 25, 23, 0.12)' }}
                whileTap={{ scale: 0.99 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                onClick={onClick}
                className={cn(
                    'rounded-xl transition-all cursor-pointer',
                    variantStyles[variant],
                    paddingStyles[padding],
                    className,
                )}
                {...props}
            >
                {children}
            </motion.div>
        );
    }

    return (
        <Component
            className={cn(
                'rounded-xl',
                variantStyles[variant],
                paddingStyles[padding],
                className,
            )}
            {...props}
        >
            {children}
        </Component>
    );
};

export default Card;
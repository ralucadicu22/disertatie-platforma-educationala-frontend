import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '../cn';

const StatCard = ({
                      label,
                      value,
                      suffix,
                      icon: Icon,
                      variant = 'primary',
                      trend,
                      progress,
                      hint,
                      onClick,
                      className = '',
                      ...props
                  }) => {
    const variantStyles = {
        primary: {
            iconBg: 'bg-primary-100',
            iconColor: 'text-primary-600',
            border: 'border-primary-100',
            valueColor: 'text-primary-900',
            labelColor: 'text-primary-700',
            progressVariant: 'primary',
        },
        accent: {
            iconBg: 'bg-accent-100',
            iconColor: 'text-accent-600',
            border: 'border-accent-100',
            valueColor: 'text-accent-900',
            labelColor: 'text-accent-700',
            progressVariant: 'accent',
        },
        warm: {
            iconBg: 'bg-warm-100',
            iconColor: 'text-warm-600',
            border: 'border-warm-100',
            valueColor: 'text-warm-900',
            labelColor: 'text-warm-700',
            progressVariant: 'warm',
        },
        success: {
            iconBg: 'bg-success-100',
            iconColor: 'text-success-600',
            border: 'border-success-100',
            valueColor: 'text-success-900',
            labelColor: 'text-success-700',
            progressVariant: 'success',
        },
        warning: {
            iconBg: 'bg-warning-100',
            iconColor: 'text-warning-700',
            border: 'border-warning-100',
            valueColor: 'text-warning-900',
            labelColor: 'text-warning-700',
            progressVariant: 'warning',
        },
    };

    const s = variantStyles[variant];
    const clickable = !!onClick;

    const Wrapper = clickable ? motion.button : 'div';
    const wrapperProps = clickable
        ? {
            whileHover: { y: -2 },
            whileTap: { scale: 0.99 },
            transition: { type: 'spring', stiffness: 300, damping: 20 },
            onClick,
        }
        : {};

    return (
        <Wrapper
            className={cn(
                'bg-white border-2 rounded-xl p-5 text-left w-full',
                s.border,
                clickable && 'cursor-pointer hover:shadow-md transition-shadow',
                className,
            )}
            {...wrapperProps}
            {...props}
        >
            <div className="flex items-start justify-between mb-3">
                {Icon && (
                    <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center', s.iconBg)}>
                        <Icon className={cn('w-6 h-6', s.iconColor)} />
                    </div>
                )}
                {trend && (
                    <div className={cn(
                        'flex items-center gap-1 text-caption font-bold',
                        trend.value >= 0 ? 'text-success-600' : 'text-danger-600'
                    )}>
                        {trend.value >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                        <span>{trend.value >= 0 ? '+' : ''}{trend.value}{trend.label ? ` ${trend.label}` : ''}</span>
                    </div>
                )}
            </div>

            <div className={cn('text-micro uppercase', s.labelColor)}>{label}</div>
            <div className="flex items-baseline gap-1 mt-1">
                <span className={cn('font-display font-bold text-stat-md leading-none', s.valueColor)}>
                    {value}
                </span>
                {suffix && (
                    <span className={cn('text-h3 font-semibold', s.labelColor)}>
                        {suffix}
                    </span>
                )}
            </div>

            {hint && !progress && (
                <p className="text-caption text-neutral-500 mt-2">{hint}</p>
            )}

            {progress != null && (
                <div className="mt-3 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                        transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
                        className={cn(
                            'h-full rounded-full',
                            variant === 'primary' && 'bg-hero-primary',
                            variant === 'warm' && 'bg-hero-warm',
                            variant === 'success' && 'bg-success-warm',
                            variant === 'accent' && 'bg-accent-500',
                            variant === 'warning' && 'bg-warning-500',
                        )}
                    />
                </div>
            )}
        </Wrapper>
    );
};

export default StatCard;
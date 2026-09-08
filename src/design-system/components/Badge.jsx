import { cn } from '../cn';

const Badge = ({
                   variant = 'neutral',
                   size = 'md',
                   icon: Icon,
                   dot = false,
                   className = '',
                   children,
                   ...props
               }) => {
    const variantStyles = {
        primary: 'bg-primary-100 text-primary-700 border border-primary-200',
        accent: 'bg-accent-100 text-accent-700 border border-accent-200',
        warm: 'bg-warm-100 text-warm-700 border border-warm-200',
        success: 'bg-success-100 text-success-700 border border-success-200',
        warning: 'bg-warning-100 text-warning-800 border border-warning-200',
        danger: 'bg-danger-100 text-danger-700 border border-danger-200',
        neutral: 'bg-neutral-100 text-neutral-700 border border-neutral-200',
    };

    const dotColors = {
        primary: 'bg-primary-500',
        accent: 'bg-accent-500',
        warm: 'bg-warm-500',
        success: 'bg-success-500',
        warning: 'bg-warning-500',
        danger: 'bg-danger-500',
        neutral: 'bg-neutral-500',
    };

    const sizeStyles = {
        sm: 'text-[10px] px-2 py-0.5 gap-1 rounded-md font-bold uppercase tracking-wider',
        md: 'text-caption px-2.5 py-1 gap-1.5 rounded-md',
    };

    const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5';

    return (
        <span
            className={cn(
                'inline-flex items-center',
                variantStyles[variant],
                sizeStyles[size],
                className,
            )}
            {...props}
        >
            {dot && <span className={cn('w-1.5 h-1.5 rounded-full', dotColors[variant])} />}
            {Icon && <Icon className={iconSize} />}
            {children}
        </span>
    );
};

export default Badge;
import { cn } from '../cn';

const EmptyState = ({
                        icon: Icon,
                        variant = 'neutral',
                        title,
                        description,
                        action,
                        size = 'md',
                        className = '',
                    }) => {
    const variantStyles = {
        primary: 'bg-primary-100 text-primary-500',
        warm: 'bg-warm-100 text-warm-500',
        success: 'bg-success-100 text-success-500',
        neutral: 'bg-neutral-100 text-neutral-400',
    };

    const sizeStyles = {
        sm: {
            iconWrap: 'w-16 h-16',
            icon: 'w-8 h-8',
            padding: 'py-8',
            title: 'text-h3',
            description: 'text-body',
        },
        md: {
            iconWrap: 'w-20 h-20',
            icon: 'w-10 h-10',
            padding: 'py-12',
            title: 'text-h2',
            description: 'text-body-lg',
        },
        lg: {
            iconWrap: 'w-28 h-28',
            icon: 'w-14 h-14',
            padding: 'py-16',
            title: 'text-display-2',
            description: 'text-body-lg',
        },
    };

    const s = sizeStyles[size];

    return (
        <div className={cn('flex flex-col items-center text-center px-6', s.padding, className)}>
            {Icon && (
                <div className={cn(
                    'rounded-full flex items-center justify-center mb-4',
                    s.iconWrap,
                    variantStyles[variant],
                )}>
                    <Icon className={s.icon} />
                </div>
            )}
            {title && <h3 className={cn('text-neutral-900 mb-2', s.title)}>{title}</h3>}
            {description && (
                <p className={cn('text-neutral-600 max-w-md mb-6', s.description)}>
                    {description}
                </p>
            )}
            {action && <div>{action}</div>}
        </div>
    );
};

export default EmptyState;
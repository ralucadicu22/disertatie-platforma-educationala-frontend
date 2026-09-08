import { cn } from '../cn';
import { gradientForString } from '../tokens';

const Avatar = ({
                    name = '?',
                    src,
                    size = 'md',
                    ring = false,
                    status = null,
                    className = '',
                    ...props
                }) => {
    const sizeStyles = {
        xs: 'w-6 h-6 text-[10px]',
        sm: 'w-8 h-8 text-caption',
        md: 'w-10 h-10 text-body',
        lg: 'w-14 h-14 text-body-lg',
        xl: 'w-16 h-16 text-h3',
        '2xl': 'w-20 h-20 text-h2',
    };

    const statusSize = {
        xs: 'w-1.5 h-1.5', sm: 'w-2 h-2', md: 'w-2.5 h-2.5',
        lg: 'w-3 h-3', xl: 'w-3.5 h-3.5', '2xl': 'w-4 h-4',
    };

    const statusColors = {
        online: 'bg-success-500',
        offline: 'bg-neutral-400',
        away: 'bg-warning-500',
    };

    const initials = name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0].toUpperCase())
        .join('');

    const gradient = gradientForString(name);

    return (
        <div className={cn('relative inline-flex flex-shrink-0', className)} {...props}>
            <div
                className={cn(
                    'inline-flex items-center justify-center rounded-full font-bold text-white overflow-hidden',
                    sizeStyles[size],
                    ring && 'ring-2 ring-white',
                )}
                style={!src ? { background: gradient } : undefined}
            >
                {src ? (
                    <img src={src} alt={name} className="w-full h-full object-cover" />
                ) : (
                    initials
                )}
            </div>
            {status && (
                <span
                    className={cn(
                        'absolute bottom-0 right-0 rounded-full ring-2 ring-white',
                        statusSize[size],
                        statusColors[status],
                    )}
                />
            )}
        </div>
    );
};

export default Avatar;
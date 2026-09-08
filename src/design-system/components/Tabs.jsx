import { motion } from 'framer-motion';
import { cn } from '../cn';

const Tabs = ({
                  value,
                  onChange,
                  options = [],
                  variant = 'underline',
                  fullWidth = false,
                  className = '',
              }) => {
    if (variant === 'pills') {
        return (
            <div className={cn(
                'inline-flex items-center gap-1 p-1 bg-neutral-100 rounded-md',
                fullWidth && 'w-full',
                className,
            )}>
                {options.map((opt) => {
                    const isActive = opt.value === value;
                    const Icon = opt.icon;
                    return (
                        <button
                            key={opt.value}
                            onClick={() => onChange?.(opt.value)}
                            className={cn(
                                'relative inline-flex items-center gap-2 px-4 py-2 rounded-md text-body font-semibold transition-colors',
                                fullWidth && 'flex-1 justify-center',
                                isActive ? 'text-primary-700' : 'text-neutral-600 hover:text-neutral-900',
                            )}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="pill-active"
                                    className="absolute inset-0 bg-white rounded-md shadow-sm"
                                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                />
                            )}
                            <span className="relative flex items-center gap-2">
                                {Icon && <Icon className="w-4 h-4" />}
                                {opt.label}
                                {opt.badge != null && (
                                    <span className={cn(
                                        'ml-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full',
                                        isActive ? 'bg-primary-100 text-primary-700' : 'bg-neutral-200 text-neutral-600'
                                    )}>
                                        {opt.badge}
                                    </span>
                                )}
                            </span>
                        </button>
                    );
                })}
            </div>
        );
    }

    return (
        <div className={cn(
            'flex items-center gap-1 border-b border-neutral-200',
            fullWidth && 'w-full',
            className,
        )}>
            {options.map((opt) => {
                const isActive = opt.value === value;
                const Icon = opt.icon;
                return (
                    <button
                        key={opt.value}
                        onClick={() => onChange?.(opt.value)}
                        className={cn(
                            'relative inline-flex items-center gap-2 px-4 py-3 text-body font-semibold transition-colors',
                            fullWidth && 'flex-1 justify-center',
                            isActive ? 'text-primary-600' : 'text-neutral-600 hover:text-neutral-900',
                        )}
                    >
                        {Icon && <Icon className="w-4 h-4" />}
                        {opt.label}
                        {opt.badge != null && (
                            <span className={cn(
                                'text-[10px] font-bold px-1.5 py-0.5 rounded-full',
                                isActive ? 'bg-primary-100 text-primary-700' : 'bg-neutral-200 text-neutral-600'
                            )}>
                                {opt.badge}
                            </span>
                        )}
                        {isActive && (
                            <motion.div
                                layoutId="underline-active"
                                className="absolute bottom-0 left-0 right-0 h-0.5 bg-hero-primary"
                                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                            />
                        )}
                    </button>
                );
            })}
        </div>
    );
};

export default Tabs;
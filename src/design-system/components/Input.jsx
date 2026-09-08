import { forwardRef } from 'react';
import { cn } from '../cn';

const Input = forwardRef(({
                              label,
                              error,
                              hint,
                              icon: Icon,
                              iconRight: IconRight,
                              size = 'md',
                              fullWidth = true,
                              className = '',
                              id,
                              ...props
                          }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).slice(2, 9)}`;

    const sizeStyles = {
        sm: 'h-9 text-caption px-3',
        md: 'h-11 text-body px-4',
        lg: 'h-14 text-body-lg px-5',
    };

    const iconSize = {
        sm: 'w-4 h-4',
        md: 'w-5 h-5',
        lg: 'w-5 h-5',
    };

    const iconPadding = {
        sm: Icon ? 'pl-9' : IconRight ? 'pr-9' : '',
        md: Icon ? 'pl-11' : IconRight ? 'pr-11' : '',
        lg: Icon ? 'pl-12' : IconRight ? 'pr-12' : '',
    };

    return (
        <div className={cn(fullWidth && 'w-full', className)}>
            {label && (
                <label
                    htmlFor={inputId}
                    className="block text-caption text-neutral-700 mb-1.5"
                >
                    {label}
                </label>
            )}
            <div className="relative">
                {Icon && (
                    <div className={cn(
                        'absolute left-0 top-0 h-full flex items-center justify-center pointer-events-none text-neutral-400',
                        size === 'sm' ? 'w-9' : size === 'md' ? 'w-11' : 'w-12'
                    )}>
                        <Icon className={iconSize[size]} />
                    </div>
                )}
                <input
                    ref={ref}
                    id={inputId}
                    className={cn(
                        'w-full bg-white border-2 rounded-md',
                        'placeholder:text-neutral-400',
                        'transition-all duration-200',
                        'focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-100',
                        'disabled:bg-neutral-50 disabled:cursor-not-allowed disabled:text-neutral-500',
                        sizeStyles[size],
                        iconPadding[size],
                        error
                            ? 'border-danger-300 focus:border-danger-500 focus:ring-danger-100'
                            : 'border-neutral-200 hover:border-neutral-300',
                    )}
                    {...props}
                />
                {IconRight && (
                    <div className={cn(
                        'absolute right-0 top-0 h-full flex items-center justify-center pointer-events-none text-neutral-400',
                        size === 'sm' ? 'w-9' : size === 'md' ? 'w-11' : 'w-12'
                    )}>
                        <IconRight className={iconSize[size]} />
                    </div>
                )}
            </div>
            {error && (
                <p className="mt-1.5 text-caption text-danger-600">{error}</p>
            )}
            {hint && !error && (
                <p className="mt-1.5 text-caption text-neutral-500">{hint}</p>
            )}
        </div>
    );
});

Input.displayName = 'Input';

export default Input;
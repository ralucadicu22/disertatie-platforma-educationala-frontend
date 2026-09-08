import { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../cn';


const Select = forwardRef(({
                               label,
                               error,
                               hint,
                               size = 'md',
                               fullWidth = true,
                               options = [],
                               placeholder,
                               className = '',
                               id,
                               ...props
                           }, ref) => {
    const selectId = id || `select-${Math.random().toString(36).slice(2, 9)}`;

    const sizeStyles = {
        sm: 'h-9 text-caption pl-3 pr-9',
        md: 'h-11 text-body pl-4 pr-11',
        lg: 'h-14 text-body-lg pl-5 pr-12',
    };
    const normalizedOptions = options.map((opt) =>
        typeof opt === 'string' ? { value: opt, label: opt } : opt
    );

    return (
        <div className={cn(fullWidth && 'w-full', className)}>
            {label && (
                <label
                    htmlFor={selectId}
                    className="block text-caption text-neutral-700 mb-1.5"
                >
                    {label}
                </label>
            )}
            <div className="relative">
                <select
                    ref={ref}
                    id={selectId}
                    className={cn(
                        'w-full bg-white border-2 rounded-md appearance-none cursor-pointer',
                        'transition-all duration-200',
                        'focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-100',
                        'disabled:bg-neutral-50 disabled:cursor-not-allowed disabled:text-neutral-500',
                        sizeStyles[size],
                        error
                            ? 'border-danger-300 focus:border-danger-500 focus:ring-danger-100'
                            : 'border-neutral-200 hover:border-neutral-300',
                    )}
                    {...props}
                >
                    {placeholder && (
                        <option value="" disabled>
                            {placeholder}
                        </option>
                    )}
                    {normalizedOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
                <div className={cn(
                    'absolute right-0 top-0 h-full flex items-center justify-center pointer-events-none text-neutral-400',
                    size === 'sm' ? 'w-9' : size === 'md' ? 'w-11' : 'w-12'
                )}>
                    <ChevronDown className={size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'} />
                </div>
            </div>
            {error && <p className="mt-1.5 text-caption text-danger-600">{error}</p>}
            {hint && !error && <p className="mt-1.5 text-caption text-neutral-500">{hint}</p>}
        </div>
    );
});

Select.displayName = 'Select';

export default Select;
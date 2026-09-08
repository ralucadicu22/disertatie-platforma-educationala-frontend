import { forwardRef } from 'react';
import { cn } from '../cn';

const Textarea = forwardRef(({
                                 label,
                                 error,
                                 hint,
                                 rows = 4,
                                 resize = 'vertical',
                                 maxLength,
                                 fullWidth = true,
                                 className = '',
                                 id,
                                 value,
                                 ...props
                             }, ref) => {
    const textareaId = id || `textarea-${Math.random().toString(36).slice(2, 9)}`;

    const resizeStyles = {
        none: 'resize-none',
        vertical: 'resize-y',
        horizontal: 'resize-x',
        both: 'resize',
    };

    const currentLength = typeof value === 'string' ? value.length : 0;

    return (
        <div className={cn(fullWidth && 'w-full', className)}>
            {label && (
                <label
                    htmlFor={textareaId}
                    className="block text-caption text-neutral-700 mb-1.5"
                >
                    {label}
                </label>
            )}
            <textarea
                ref={ref}
                id={textareaId}
                rows={rows}
                maxLength={maxLength}
                value={value}
                className={cn(
                    'w-full bg-white border-2 rounded-md px-4 py-3 text-body',
                    'placeholder:text-neutral-400',
                    'transition-all duration-200',
                    'focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-100',
                    'disabled:bg-neutral-50 disabled:cursor-not-allowed disabled:text-neutral-500',
                    resizeStyles[resize],
                    error
                        ? 'border-danger-300 focus:border-danger-500 focus:ring-danger-100'
                        : 'border-neutral-200 hover:border-neutral-300',
                )}
                {...props}
            />
            <div className="flex justify-between items-start mt-1.5">
                <div>
                    {error && <p className="text-caption text-danger-600">{error}</p>}
                    {hint && !error && <p className="text-caption text-neutral-500">{hint}</p>}
                </div>
                {maxLength && (
                    <span className={cn(
                        'text-caption',
                        currentLength > maxLength * 0.9 ? 'text-warning-600' : 'text-neutral-400'
                    )}>
                        {currentLength}/{maxLength}
                    </span>
                )}
            </div>
        </div>
    );
});

Textarea.displayName = 'Textarea';

export default Textarea;
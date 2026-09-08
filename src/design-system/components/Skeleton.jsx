import { cn } from '../cn';

const Skeleton = ({
                      variant = 'text',
                      width,
                      height,
                      lines = 1,
                      className = '',
                      style,
                      ...props
                  }) => {
    const variantStyles = {
        text: 'h-4 rounded-md',
        title: 'h-7 rounded-md',
        avatar: 'rounded-full',
        card: 'rounded-xl',
        rect: 'rounded-md',
    };

    if (variant === 'text' && lines > 1) {
        return (
            <div className={cn('space-y-2', className)} {...props}>
                {Array.from({ length: lines }).map((_, i) => (
                    <div
                        key={i}
                        className={cn('skeleton', variantStyles.text)}
                        style={{
                            width: i === lines - 1 ? '75%' : '100%',
                        }}
                    />
                ))}
            </div>
        );
    }

    return (
        <div
            className={cn('skeleton', variantStyles[variant], className)}
            style={{ width, height, ...style }}
            {...props}
        />
    );
};

export default Skeleton;
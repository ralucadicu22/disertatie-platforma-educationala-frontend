import { motion } from 'framer-motion';
import { cn } from '../cn';
const ProgressRing = ({
                          value = 0,
                          size = 80,
                          strokeWidth = 8,
                          variant = 'primary',
                          className = '',
                          children,
                          ...props
                      }) => {
    const clampedValue = Math.max(0, Math.min(100, value));
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;

    const colors = {
        primary: '#8B5CF6',
        accent: '#EC4899',
        warm: '#FB923C',
        success: '#22C55E',
        warning: '#F59E0B',
    };

    const gradientId = `grad-${variant}`;

    const gradientDefs = {
        primary: (
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#6366F1" />
                <stop offset="50%" stopColor="#8B5CF6" />
                <stop offset="100%" stopColor="#EC4899" />
            </linearGradient>
        ),
        warm: (
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FDBA74" />
                <stop offset="100%" stopColor="#F472B6" />
            </linearGradient>
        ),
        success: (
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#4ADE80" />
                <stop offset="100%" stopColor="#FBBF24" />
            </linearGradient>
        ),
    };

    const stroke = gradientDefs[variant] ? `url(#${gradientId})` : colors[variant];

    return (
        <div
            className={cn('relative inline-flex items-center justify-center', className)}
            style={{ width: size, height: size }}
            {...props}
        >
            <svg width={size} height={size} className="-rotate-90">
                {gradientDefs[variant] && <defs>{gradientDefs[variant]}</defs>}
                {/* Track (fundal) */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="#F5F5F4"
                    strokeWidth={strokeWidth}
                    fill="none"
                />
                {/* Fill (progres) */}
                <motion.circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={stroke}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    fill="none"
                    initial={{ strokeDasharray: `0 ${circumference}` }}
                    animate={{
                        strokeDasharray: `${(clampedValue / 100) * circumference} ${circumference}`,
                    }}
                    transition={{ duration: 1, ease: [0.4, 0, 0.2, 1] }}
                />
            </svg>
            {children && (
                <div className="absolute inset-0 flex items-center justify-center">
                    {children}
                </div>
            )}
        </div>
    );
};

export default ProgressRing;
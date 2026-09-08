import { motion } from 'framer-motion';
import { cn } from '../cn';
import Avatar from './Avatar';

const HeroBanner = ({
                        greeting,
                        subtitle,
                        avatar,
                        variant = 'primary',
                        action,
                        children,
                        className = '',
                    }) => {
    const variantStyles = {
        primary: 'bg-hero-primary shadow-glow-primary',
        warm: 'bg-hero-warm shadow-glow-warm',
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            className={cn(
                'relative overflow-hidden rounded-2xl text-white p-6 md:p-8',
                variantStyles[variant],
                className,
            )}
        >

            <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/10 pointer-events-none" />
            <div className="absolute -bottom-20 right-20 w-40 h-40 rounded-full bg-white/5 pointer-events-none" />

            <div className="relative flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-4 min-w-0">
                    {avatar && (
                        <Avatar
                            name={avatar.name}
                            src={avatar.src}
                            size="xl"
                            ring
                        />
                    )}
                    <div className="min-w-0">
                        {greeting && (
                            <h1 className="text-h1 text-white leading-tight truncate">
                                {greeting}
                            </h1>
                        )}
                        {subtitle && (
                            <p className="text-body-lg text-white/80 mt-1">
                                {subtitle}
                            </p>
                        )}
                    </div>
                </div>
                {action && <div className="flex-shrink-0">{action}</div>}
            </div>

            {children && (
                <div className="relative mt-6">
                    {children}
                </div>
            )}
        </motion.div>
    );
};

export default HeroBanner;
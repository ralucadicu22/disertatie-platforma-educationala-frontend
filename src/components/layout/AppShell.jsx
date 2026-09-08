import { useNavigate } from 'react-router-dom';
import { LogOut, ChevronLeft } from 'lucide-react';
import { Avatar, Button } from '../../design-system/components';
import { cn } from '../../design-system/cn';

const AppShell = ({ user, title, back, children, maxWidth = '4xl' }) => {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
    };

    const maxWidthClass = {
        md: 'max-w-3xl',
        lg: 'max-w-4xl',
        xl: 'max-w-5xl',
        '2xl': 'max-w-6xl',
        '4xl': 'max-w-7xl',
        full: 'max-w-full',
    }[maxWidth];

    return (
        <div className="min-h-screen bg-neutral-50">
            <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-neutral-200">
                <div className={cn('mx-auto px-4 md:px-6 h-16 flex items-center justify-between', maxWidthClass)}>
                    <div className="flex items-center gap-3 min-w-0">
                        {back && (
                            <button
                                onClick={() => navigate(back.to)}
                                className="p-2 -ml-2 rounded-md hover:bg-neutral-100 transition-colors text-neutral-600 hover:text-neutral-900"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                        )}
                        <div className="flex items-center gap-2 min-w-0">
                            <div className="w-8 h-8 rounded-md bg-hero-primary flex items-center justify-center flex-shrink-0">
                                <span className="text-white font-bold text-caption">E</span>
                            </div>
                            {title && (
                                <h1 className="text-body-lg font-bold text-neutral-900 truncate">
                                    {title}
                                </h1>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {user && (
                            <div className="hidden md:flex items-center gap-2">
                                <Avatar name={user.name} size="sm" />
                                <div className="text-body font-semibold text-neutral-800 truncate max-w-[160px]">
                                    {user.name}
                                </div>
                            </div>
                        )}
                        <Button variant="ghost" size="sm" icon={LogOut} onClick={handleLogout}>
                            <span className="hidden md:inline">Iesire</span>
                        </Button>
                    </div>
                </div>
            </header>
            <main className={cn('mx-auto px-4 md:px-6 py-6 md:py-8', maxWidthClass)}>
                {children}
            </main>
        </div>
    );
};

export default AppShell;
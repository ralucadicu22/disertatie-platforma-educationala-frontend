import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Home, Users, BookOpen, MessageSquare, BarChart3,
    Settings, LogOut, Menu, X, School, Link2,
    UserCheck, ClipboardList, Inbox,
} from 'lucide-react';
import { Avatar, Badge } from '../../design-system/components';
import { cn } from '../../design-system/cn';

import { impersonation } from '../../utils/impersonation';
import ViewAsDropdown from "../impersonation/ViewAsDropdown.jsx";

const NAV_LINKS = {
    ELEV: [
        { to: '/',                  icon: Home,          label: 'Acasă' },
        { to: '/progres',           icon: BarChart3,     label: 'Progresul meu' },
        { to: '/feedback-inbox',    icon: Inbox,         label: 'Mesaje' },
    ],
    PROFESOR: [
        { to: '/clase',             icon: School,        label: 'Clasele mele' },
        { to: '/asignare-quizuri',  icon: BookOpen,      label: 'Quiz-uri' },
        { to: '/feedback-elevi',    icon: MessageSquare, label: 'Feedback elevi' },
        { to: '/profesor',          icon: BarChart3,     label: 'Dashboard' },
    ],
    PARINTE: [
        { to: '/parinte',           icon: Home,          label: 'Dashboard' },
    ],
    EDITOR: [
        { to: '/',                  icon: Home,          label: 'Produse' },

    ],
    ADMIN: [
        { to: '/clase',             icon: School,        label: 'Clase' },
        { to: '/asignare-quizuri',  icon: BookOpen,      label: 'Quiz-uri' },
        { to: '/admin/parinti',     icon: Link2,         label: 'Părinți-Copii' },
        { to: '/admin/review',      icon: UserCheck,     label: 'Review' },
        { to: '/profesor',          icon: BarChart3,     label: 'Dashboard' },
        { to: '/admin/content', icon: Settings, label: 'Conținut' },
        { to: '/admin/users', icon: Users, label: 'Utilizatori' },
    ],
};

const Navbar = ({ unreadCount = 0 }) => {
    const navigate = useNavigate();
    const [mobileOpen, setMobileOpen] = useState(false);

    const user = JSON.parse(localStorage.getItem('user') || 'null');
    const role = user?.role || 'ELEV';
    const links = NAV_LINKS[role] || NAV_LINKS.ELEV;

    const isImpersonating = impersonation.isActive();
    const stickyTop = isImpersonating ? 'top-10' : 'top-0';

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
    };

    return (
        <>
            <nav className={cn(
                'hidden md:flex sticky z-40 w-full bg-white/90 backdrop-blur-md border-b border-neutral-200',
                stickyTop
            )}>
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between w-full">

                    <div
                        className="flex items-center gap-2 cursor-pointer"
                        onClick={() => navigate('/')}
                    >
                        <div className="w-8 h-8 rounded-md bg-hero-primary flex items-center justify-center">
                            <span className="text-white font-bold text-caption">E</span>
                        </div>
                        <span className="text-body-lg font-bold text-neutral-900">EduPlatform</span>
                    </div>

                    <div className="flex items-center gap-1">
                        {links.map((link) => {
                            const Icon = link.icon;
                            const isInbox = link.to === '/feedback-inbox';
                            return (
                                <NavLink
                                    key={link.to}
                                    to={link.to}
                                    className={({ isActive }) => cn(
                                        'relative flex items-center gap-2 px-3 py-2 rounded-md text-body font-semibold transition-all',
                                        isActive
                                            ? 'text-primary-700 bg-primary-50'
                                            : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                                    )}
                                >
                                    {({ isActive }) => (
                                        <>
                                            <Icon className="w-4 h-4" />
                                            {link.label}
                                            {isInbox && unreadCount > 0 && (
                                                <Badge variant="danger" size="sm">
                                                    {unreadCount}
                                                </Badge>
                                            )}
                                            {isActive && (
                                                <motion.div
                                                    layoutId="nav-active"
                                                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-hero-primary rounded-full"
                                                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                                />
                                            )}
                                        </>
                                    )}
                                </NavLink>
                            );
                        })}
                    </div>

                    <div className="flex items-center gap-3">
                        {role === 'ADMIN' && <ViewAsDropdown />}

                        <div className="flex items-center gap-2">
                            <Avatar name={user?.name || '?'} size="sm" />
                            <div className="text-right">
                                <div className="text-body font-semibold text-neutral-900 leading-tight">
                                    {user?.name}
                                </div>
                                <div className="text-caption text-neutral-500 leading-tight">
                                    {role}
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="p-2 rounded-md hover:bg-neutral-100 transition-colors text-neutral-500 hover:text-neutral-800"
                            title="Iesire"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </nav>

            <nav className={cn(
                'md:hidden sticky z-40 w-full bg-white/90 backdrop-blur-md border-b border-neutral-200',
                stickyTop
            )}>
                <div className="px-4 h-14 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-md bg-hero-primary flex items-center justify-center">
                            <span className="text-white font-bold text-[10px]">E</span>
                        </div>
                        <span className="text-body font-bold text-neutral-900">EduPlatform</span>
                    </div>
                    <div className="flex items-center gap-2">
                        {unreadCount > 0 && (
                            <Badge variant="danger" size="sm">{unreadCount}</Badge>
                        )}
                        <button
                            onClick={() => setMobileOpen((v) => !v)}
                            className="p-2 rounded-md hover:bg-neutral-100 transition-colors"
                        >
                            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>
                    </div>
                </div>

                <AnimatePresence>
                    {mobileOpen && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden border-t border-neutral-100 bg-white"
                        >
                            <div className="px-4 py-3 space-y-1">
                                <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-md mb-3">
                                    <Avatar name={user?.name || '?'} size="md" />
                                    <div>
                                        <div className="text-body font-semibold text-neutral-900">
                                            {user?.name}
                                        </div>
                                        <div className="text-caption text-neutral-500">{role}</div>
                                    </div>
                                </div>

                                {links.map((link) => {
                                    const Icon = link.icon;
                                    const isInbox = link.to === '/feedback-inbox';
                                    return (
                                        <NavLink
                                            key={link.to}
                                            to={link.to}
                                            onClick={() => setMobileOpen(false)}
                                            className={({ isActive }) => cn(
                                                'flex items-center gap-3 px-3 py-2.5 rounded-md text-body font-semibold transition-colors',
                                                isActive
                                                    ? 'text-primary-700 bg-primary-50'
                                                    : 'text-neutral-700 hover:bg-neutral-100'
                                            )}
                                        >
                                            <Icon className="w-5 h-5" />
                                            {link.label}
                                            {isInbox && unreadCount > 0 && (
                                                <Badge variant="danger" size="sm">{unreadCount}</Badge>
                                            )}
                                        </NavLink>
                                    );
                                })}

                                {role === 'ADMIN' && (
                                    <div className="pt-1 border-t border-neutral-100">
                                        <ViewAsDropdown />
                                    </div>
                                )}

                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-body font-semibold text-danger-600 hover:bg-danger-50 transition-colors mt-2"
                                >
                                    <LogOut className="w-5 h-5" />
                                    Ieșire
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </nav>
        </>
    );
};

export default Navbar;

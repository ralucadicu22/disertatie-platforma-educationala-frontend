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

import ViewAsDropdown from "../impersonation/ViewAsDropdown.jsx";

const ChevronLeft = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <polyline points="15 18 9 12 15 6" />
    </svg>
);
const ChevronRight = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 18 15 12 9 6" />
    </svg>
);


const NAV_LINKS = {
    ELEV: [
        { to: '/',                 icon: Home,          label: 'Acasă' },
        { to: '/progres',          icon: BarChart3,     label: 'Progresul meu' },
        { to: '/feedback-inbox',   icon: Inbox,         label: 'Mesaje' },
    ],
    PROFESOR: [
        { to: '/clase',            icon: School,        label: 'Clasele mele' },
        { to: '/asignare-quizuri', icon: BookOpen,      label: 'Quiz-uri' },
        { to: '/feedback-elevi',   icon: MessageSquare, label: 'Feedback elevi' },
        { to: '/profesor',         icon: BarChart3,     label: 'Dashboard' },
    ],
    PARINTE: [
        { to: '/parinte',          icon: Home,          label: 'Dashboard' },
    ],
    EDITOR: [
        { to: '/',                 icon: Home,          label: 'Produse' },
    ],
    ADMIN: [
        { to: '/clase',            icon: School,        label: 'Clase' },
        { to: '/asignare-quizuri', icon: BookOpen,      label: 'Quiz-uri' },
        { to: '/admin/parinti',    icon: Link2,         label: 'Părinți-Copii' },
        { to: '/admin/review',     icon: UserCheck,     label: 'Review' },
        { to: '/profesor',         icon: BarChart3,     label: 'Dashboard' },
        { to: '/admin/content',    icon: Settings,      label: 'Conținut' },
        { to: '/admin/users',      icon: Users,         label: 'Utilizatori' },
    ],
};

const Navbar = ({ unreadCount = 0 }) => {
    const navigate = useNavigate();
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    const user = JSON.parse(localStorage.getItem('user') || 'null');
    const role = user?.role || 'ELEV';
    const links = NAV_LINKS[role] || NAV_LINKS.ELEV;

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
    };

    const NavItem = ({ link }) => {
        const Icon = link.icon;
        const isInbox = link.to === '/feedback-inbox';
        return (
            <NavLink
                key={link.to}
                to={link.to}
                title={collapsed ? link.label : undefined}
                className={({ isActive }) => cn(
                    'relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-body font-semibold transition-all group',
                    collapsed ? 'justify-center' : '',
                    isActive
                        ? 'text-primary-700 bg-primary-50'
                        : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                )}
            >
                {({ isActive }) => (
                    <>
                        <Icon className={cn('w-5 h-5 flex-shrink-0', isActive ? 'text-primary-600' : '')} />
                        {!collapsed && (
                            <span className="truncate">{link.label}</span>
                        )}
                        {isInbox && unreadCount > 0 && (
                            <Badge variant="danger" size="sm"
                                   className={cn('flex-shrink-0', collapsed ? 'absolute top-1 right-1' : '')}>
                                {unreadCount}
                            </Badge>
                        )}
                        {/* Tooltip pe collapsed */}
                        {collapsed && (
                            <span className="absolute left-full ml-2 px-2 py-1 bg-neutral-900 text-white text-caption
                                             rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none
                                             transition-opacity z-50">
                                {link.label}
                            </span>
                        )}
                    </>
                )}
            </NavLink>
        );
    };


    const Sidebar = () => (
        <aside className={cn(
            'hidden md:flex flex-col h-full bg-white border-r border-neutral-200 transition-all duration-300 flex-shrink-0 overflow-hidden',
            collapsed ? 'w-16' : 'w-56'
        )}>

            <div className={cn(
                'flex items-center h-16 px-3 border-b border-neutral-100 flex-shrink-0',
                collapsed ? 'justify-center' : 'justify-between'
            )}>
                {!collapsed && (
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
                        <div className="w-7 h-7 rounded-md bg-hero-primary flex items-center justify-center flex-shrink-0">
                            <span className="text-white font-bold text-caption">E</span>
                        </div>
                        <span className="text-body font-bold text-neutral-900 truncate">EduPlatform</span>
                    </div>
                )}
                {collapsed && (
                    <div className="w-7 h-7 rounded-md bg-hero-primary flex items-center justify-center cursor-pointer"
                         onClick={() => navigate('/')}>
                        <span className="text-white font-bold text-caption">E</span>
                    </div>
                )}
                <button
                    onClick={() => setCollapsed(v => !v)}
                    className={cn(
                        'p-1.5 rounded-md text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors flex-shrink-0',
                        collapsed ? 'hidden' : ''
                    )}
                    title={collapsed ? 'Extinde' : 'Restrânge'}
                >
                    <ChevronLeft className="w-4 h-4" />
                </button>
            </div>


            <nav className="flex-1 overflow-y-auto min-h-0 py-3 px-2 space-y-0.5">
                {links.map(link => <NavItem key={link.to} link={link} />)}
            </nav>

            {role === 'ADMIN' && !collapsed && (
                <div className="px-2 pb-2 border-t border-neutral-100 pt-2">
                    <p className="text-micro text-neutral-400 uppercase tracking-wide px-3 mb-1.5 font-bold">
                        Vizualizează ca
                    </p>
                    <ViewAsDropdown compact />
                </div>
            )}
            {role === 'ADMIN' && collapsed && (
                <div className="px-2 pb-2 border-t border-neutral-100 pt-2 flex justify-center">
                    <ViewAsDropdown iconOnly />
                </div>
            )}

            <div className={cn(
                'border-t border-neutral-100 px-2 py-3 flex-shrink-0',
                collapsed ? 'flex flex-col items-center gap-2' : 'space-y-1'
            )}>
                {!collapsed && (
                    <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg">
                        <Avatar name={user?.name || '?'} size="sm" />
                        <div className="min-w-0">
                            <p className="text-caption font-semibold text-neutral-900 truncate">{user?.name}</p>
                            <p className="text-micro text-neutral-400">{role}</p>
                        </div>
                    </div>
                )}
                {collapsed && (
                    <div title={user?.name}>
                        <Avatar name={user?.name || '?'} size="sm" />
                    </div>
                )}
                <button
                    onClick={handleLogout}
                    title="Ieșire"
                    className={cn(
                        'flex items-center gap-2 px-2 py-2 rounded-lg text-caption font-semibold text-danger-600 hover:bg-danger-50 transition-colors w-full',
                        collapsed ? 'justify-center' : ''
                    )}
                >
                    <LogOut className="w-4 h-4 flex-shrink-0" />
                    {!collapsed && 'Ieșire'}
                </button>
            </div>

            {collapsed && (
                <button
                    onClick={() => setCollapsed(false)}
                    className="mx-auto mb-3 p-1.5 rounded-md text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
                    title="Extinde meniul"
                >
                    <ChevronRight className="w-4 h-4" />
                </button>
            )}
        </aside>
    );
    const MobileNav = () => (
        <div className="md:hidden">

            <div className="sticky top-0 z-40 flex items-center justify-between px-4 h-14
                            bg-white/90 backdrop-blur-md border-b border-neutral-200">
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
                    <div className="w-7 h-7 rounded-md bg-hero-primary flex items-center justify-center">
                        <span className="text-white font-bold text-[10px]">E</span>
                    </div>
                    <span className="text-body font-bold text-neutral-900">EduPlatform</span>
                </div>
                <div className="flex items-center gap-2">
                    {unreadCount > 0 && <Badge variant="danger" size="sm">{unreadCount}</Badge>}
                    <button
                        onClick={() => setMobileOpen(v => !v)}
                        className="p-2 rounded-md hover:bg-neutral-100 transition-colors"
                    >
                        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {mobileOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setMobileOpen(false)}
                            className="fixed inset-0 z-40 bg-black/30"
                        />
                        <motion.aside
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'spring', stiffness: 400, damping: 40 }}
                            className="fixed top-0 left-0 z-50 h-full w-64 bg-white shadow-xl flex flex-col"
                        >
                            <div className="flex items-center justify-between px-4 h-14 border-b border-neutral-100">
                                <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-md bg-hero-primary flex items-center justify-center">
                                        <span className="text-white font-bold text-[10px]">E</span>
                                    </div>
                                    <span className="text-body font-bold text-neutral-900">EduPlatform</span>
                                </div>
                                <button onClick={() => setMobileOpen(false)}
                                        className="p-1.5 rounded-md hover:bg-neutral-100 text-neutral-500">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="flex items-center gap-3 mx-3 mt-3 p-3 bg-neutral-50 rounded-xl">
                                <Avatar name={user?.name || '?'} size="md" />
                                <div>
                                    <p className="text-body font-semibold text-neutral-900">{user?.name}</p>
                                    <p className="text-caption text-neutral-400">{role}</p>
                                </div>
                            </div>

                            <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
                                {links.map(link => (
                                    <NavLink
                                        key={link.to}
                                        to={link.to}
                                        onClick={() => setMobileOpen(false)}
                                        className={({ isActive }) => cn(
                                            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-body font-semibold transition-colors',
                                            isActive ? 'text-primary-700 bg-primary-50' : 'text-neutral-700 hover:bg-neutral-100'
                                        )}
                                    >
                                        {(() => {
                                            const Icon = link.icon;
                                            const isInbox = link.to === '/feedback-inbox';
                                            return (
                                                <>
                                                    <Icon className="w-5 h-5" />
                                                    {link.label}
                                                    {isInbox && unreadCount > 0 && (
                                                        <Badge variant="danger" size="sm">{unreadCount}</Badge>
                                                    )}
                                                </>
                                            );
                                        })()}
                                    </NavLink>
                                ))}
                            </nav>

                            {role === 'ADMIN' && (
                                <div className="px-3 pb-2 border-t border-neutral-100 pt-3">
                                    <p className="text-micro text-neutral-400 uppercase tracking-wide px-3 mb-1.5 font-bold">
                                        Vizualizează ca
                                    </p>
                                    <ViewAsDropdown compact />
                                </div>
                            )}

                            <div className="border-t border-neutral-100 px-3 py-3">
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-body font-semibold text-danger-600 hover:bg-danger-50 transition-colors"
                                >
                                    <LogOut className="w-5 h-5" />
                                    Ieșire
                                </button>
                            </div>
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>
        </div>
    );

    return (
        <>
            <Sidebar />
            <MobileNav />
        </>
    );
};

export default Navbar;

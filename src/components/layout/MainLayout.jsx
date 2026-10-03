import Navbar from './Navbar';
import {impersonation} from "../../utils/impersonation.js";


const MainLayout = ({ children, unreadCount = 0 }) => {
    const hasBanner = impersonation.isActive();

    return (
        <div className={`flex h-screen overflow-hidden bg-neutral-50 ${hasBanner ? 'pt-11' : ''}`}>
            <Navbar unreadCount={unreadCount} />
            <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
                <main className="flex-1 overflow-y-auto">
                    <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default MainLayout;

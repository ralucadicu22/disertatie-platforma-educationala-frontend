import { Toaster, toast } from 'react-hot-toast';
import { CheckCircle2, AlertCircle, Info, XCircle } from 'lucide-react';

export const ToastProvider = () => (
    <Toaster
        position="top-right"
        gutter={12}
        toastOptions={{
            duration: 4000,
            style: {
                background: 'white',
                color: '#292524',
                padding: '12px 16px',
                borderRadius: '12px',
                boxShadow: '0 12px 32px rgba(28, 25, 23, 0.12)',
                fontSize: '14px',
                fontWeight: '500',
                fontFamily: 'Poppins, sans-serif',
                maxWidth: '380px',
                border: '1px solid #E7E5E4',
            },
        }}
    />
);

export const notify = {
    success: (message) => toast.custom((t) => (
        <div className={`${t.visible ? 'animate-slide-up' : 'opacity-0'} bg-white border border-neutral-200 rounded-md shadow-lg px-4 py-3 flex items-center gap-3 max-w-md`}>
            <div className="w-8 h-8 rounded-full bg-success-100 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-5 h-5 text-success-600" />
            </div>
            <span className="text-body text-neutral-800">{message}</span>
        </div>
    )),

    error: (message) => toast.custom((t) => (
        <div className={`${t.visible ? 'animate-slide-up' : 'opacity-0'} bg-white border border-neutral-200 rounded-md shadow-lg px-4 py-3 flex items-center gap-3 max-w-md`}>
            <div className="w-8 h-8 rounded-full bg-danger-100 flex items-center justify-center flex-shrink-0">
                <XCircle className="w-5 h-5 text-danger-600" />
            </div>
            <span className="text-body text-neutral-800">{message}</span>
        </div>
    )),

    warning: (message) => toast.custom((t) => (
        <div className={`${t.visible ? 'animate-slide-up' : 'opacity-0'} bg-white border border-neutral-200 rounded-md shadow-lg px-4 py-3 flex items-center gap-3 max-w-md`}>
            <div className="w-8 h-8 rounded-full bg-warning-100 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-warning-600" />
            </div>
            <span className="text-body text-neutral-800">{message}</span>
        </div>
    )),

    info: (message) => toast.custom((t) => (
        <div className={`${t.visible ? 'animate-slide-up' : 'opacity-0'} bg-white border border-neutral-200 rounded-md shadow-lg px-4 py-3 flex items-center gap-3 max-w-md`}>
            <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                <Info className="w-5 h-5 text-primary-600" />
            </div>
            <span className="text-body text-neutral-800">{message}</span>
        </div>
    )),
};
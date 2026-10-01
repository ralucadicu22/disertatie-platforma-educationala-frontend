import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/axios';
import { cn } from '../design-system/cn';

const ACCENTS = [
    'from-primary-500 to-accent-500',
    'from-primary-400 to-primary-600',
    'from-warm-400 to-accent-400',
    'from-danger-400 to-warm-500',
    'from-success-400 to-primary-400',
    'from-accent-500 to-accent-400',
];
const ICONS = ['📚', '🔢', '🎯', '⭐', '🧠', '🎨'];

export default function ProductDetailPage() {
    const { productId } = useParams();
    const [product, setProduct] = useState(null);
    const [modules, setModules] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        Promise.all([
            api.get(`/products/${productId}`),
            api.get(`/modules/product/${productId}`),
        ])
            .then(([p, m]) => { setProduct(p.data); setModules(m.data); })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [productId]);

    if (loading) return (
        <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    if (!product) return null;

    return (
        <div className="max-w-3xl mx-auto animate-fade-in">
            <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-1.5 text-body font-semibold text-neutral-500 hover:text-neutral-800 transition-colors mb-6"
            >
                ← Înapoi la produse
            </button>

            <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden mb-8 flex">
                <div className="w-48 flex-shrink-0">
                    {product.coverImageUrl ? (
                        <img src={product.coverImageUrl} alt={product.title} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full bg-hero-primary flex items-center justify-center text-5xl min-h-36">
                            📚
                        </div>
                    )}
                </div>
                <div className="p-6 flex flex-col justify-center">
                    <div className="flex gap-2 mb-3 flex-wrap">
                        {product.subject && (
                            <span className="px-2.5 py-1 bg-primary-100 text-primary-700 text-micro rounded-full font-bold uppercase tracking-wide">
                                {product.subject}
                            </span>
                        )}
                        {product.targetAgeGroup && (
                            <span className="px-2.5 py-1 bg-warning-100 text-warning-700 text-micro rounded-full font-bold">
                                {product.targetAgeGroup}
                            </span>
                        )}
                    </div>
                    <h1 className="text-h2 font-bold text-neutral-900 mb-2">{product.title}</h1>
                    <p className="text-body text-neutral-500 leading-relaxed mb-4">{product.description}</p>
                    <div>
                        <span className="text-stat-md font-bold text-primary-600">{modules.length}</span>
                        <span className="text-caption text-neutral-400 ml-1.5 uppercase tracking-wide font-bold">module</span>
                    </div>
                </div>
            </div>

            <p className="text-micro text-neutral-400 uppercase tracking-widest font-bold mb-3">
                Module disponibile
            </p>

            {modules.length === 0 ? (
                <div className="bg-white rounded-xl border-2 border-dashed border-neutral-200 p-10 text-center">
                    <p className="text-body text-neutral-400">Nu există module disponibile pentru acest produs.</p>
                </div>
            ) : (
                <div className="flex flex-col gap-3">
                    {modules.map((m, i) => (
                        <button
                            key={m.id}
                            onClick={() => navigate(`/module/${m.id}`)}
                            className="group flex items-center gap-4 bg-white rounded-xl border border-neutral-200 p-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 text-left w-full"
                        >
                            <div className={cn(
                                'w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0 bg-gradient-to-br text-white shadow-sm',
                                ACCENTS[i % ACCENTS.length]
                            )}>
                                {ICONS[i % ICONS.length]}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-micro text-neutral-400 uppercase tracking-wide font-bold mb-0.5">
                                    Modul {i + 1}
                                </p>
                                <p className="text-body-lg font-bold text-neutral-900">{m.title}</p>
                                <p className="text-caption text-neutral-500 truncate">{m.description}</p>
                            </div>
                            <div className="text-neutral-300 group-hover:text-neutral-500 group-hover:translate-x-1 transition-all">
                                →
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
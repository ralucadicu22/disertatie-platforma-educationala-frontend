import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { cn } from '../design-system/cn';

export default function ProductsPage() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        api.get('/products')
            .then(res => setProducts(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) return (
        <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    return (
        <>
            <p className="text-micro text-neutral-400 uppercase tracking-widest font-bold mb-3">
                Produse educaționale
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map(p => (
                    <button
                        key={p.id}
                        onClick={() => navigate(`/product/${p.id}`)}
                        className="group bg-white rounded-xl border border-neutral-200 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-200 text-left"
                    >
                        {/* Cover */}
                        <div className="h-36 overflow-hidden">
                            {p.coverImageUrl ? (
                                <img
                                    src={p.coverImageUrl}
                                    alt={p.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                            ) : (
                                <div className="w-full h-full bg-hero-primary flex items-center justify-center text-5xl">
                                    📚
                                </div>
                            )}
                        </div>

                        <div className="p-4">
                            <div className="flex gap-1.5 mb-2 flex-wrap">
                                {p.subject && (
                                    <span className="px-2 py-0.5 bg-primary-100 text-primary-700 text-micro rounded-full font-bold uppercase tracking-wide">
                                        {p.subject}
                                    </span>
                                )}
                                {p.targetAgeGroup && (
                                    <span className="px-2 py-0.5 bg-warning-100 text-warning-700 text-micro rounded-full font-bold">
                                        {p.targetAgeGroup}
                                    </span>
                                )}
                            </div>
                            <h3 className="text-body-lg font-bold text-neutral-900 mb-1 leading-snug">
                                {p.title}
                            </h3>
                            <p className="text-caption text-neutral-500 line-clamp-2 leading-relaxed">
                                {p.description}
                            </p>
                        </div>
                    </button>
                ))}
            </div>
        </>
    );
}
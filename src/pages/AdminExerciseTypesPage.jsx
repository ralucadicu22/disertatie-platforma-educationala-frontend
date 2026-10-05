import { useEffect, useState, useCallback } from 'react';
import { exerciseTypeApi } from '../api/exerciseTypeApi';
import { adminContentApi } from '../api/adminContentApi';
import { notify } from '../design-system/toast';
import { cn } from '../design-system/cn';
import { EXERCISE_TYPE_DEFINITIONS } from '../constants/exerciseTypes';

export default function AdminExerciseTypesPage() {
    const [activeTab, setActiveTab] = useState('global');
    const [globalConfigs, setGlobalConfigs] = useState([]);
    const [loadingGlobal, setLoadingGlobal] = useState(true);
    const [togglingType, setTogglingType] = useState(null);

    const [products, setProducts] = useState([]);
    const [selectedProductId, setSelectedProductId] = useState('');
    const [resolvedStatuses, setResolvedStatuses] = useState([]);
    const [loadingResolved, setLoadingResolved] = useState(false);
    const [togglingOverride, setTogglingOverride] = useState(null);

    const globalMap = Object.fromEntries(
        globalConfigs.map(c => [c.exerciseType, c])
    );

    const loadGlobalConfigs = useCallback(() => {
        setLoadingGlobal(true);
        exerciseTypeApi.getAllGlobalConfigs()
            .then(data => setGlobalConfigs(data))
            .catch(() => notify.error('Nu am putut încărca configurările globale'))
            .finally(() => setLoadingGlobal(false));
    }, []);

    useEffect(() => { loadGlobalConfigs(); }, [loadGlobalConfigs]);

    useEffect(() => {
        adminContentApi.getProducts()
            .then(data => setProducts(data || []))
            .catch(() => notify.error('Nu am putut încărca produsele'));
    }, []);

    useEffect(() => {
        if (!selectedProductId) { setResolvedStatuses([]); return; }
        setLoadingResolved(true);
        exerciseTypeApi.getResolvedStatusForProduct(Number(selectedProductId))
            .then(data => setResolvedStatuses(data))
            .catch(() => notify.error('Nu am putut încărca starea tipurilor pentru produs'))
            .finally(() => setLoadingResolved(false));
    }, [selectedProductId]);


    const handleGlobalToggle = async (exerciseType, currentEnabled) => {
        setTogglingType(exerciseType);
        try {
            const updated = await exerciseTypeApi.setGlobalEnabled(exerciseType, !currentEnabled);
            setGlobalConfigs(prev => {
                const exists = prev.find(c => c.exerciseType === exerciseType);
                if (exists) {
                    return prev.map(c => c.exerciseType === exerciseType ? updated : c);
                }
                return [...prev, updated];
            });
            notify.success(`Tipul "${exerciseType}" a fost ${!currentEnabled ? 'activat' : 'dezactivat'} global`);
        } catch {
            notify.error('Eroare la modificarea configurării globale');
        } finally {
            setTogglingType(null);
        }
    };

    const handleProductOverride = async (exerciseType, currentOverride, globalEnabled) => {
        if (!selectedProductId) return;
        setTogglingOverride(exerciseType);
        try {
            let newEnabled;
            if (currentOverride === null || currentOverride === undefined) {
                newEnabled = !globalEnabled;
            } else {
                newEnabled = null;
            }
            await exerciseTypeApi.setProductOverride(Number(selectedProductId), exerciseType, newEnabled);
            const updated = await exerciseTypeApi.getResolvedStatusForProduct(Number(selectedProductId));
            setResolvedStatuses(updated);
            notify.success(
                newEnabled === null
                    ? `Override eliminat pentru "${exerciseType}" — revine la global`
                    : `"${exerciseType}" ${newEnabled ? 'activat' : 'dezactivat'} pentru acest produs`
            );
        } catch {
            notify.error('Eroare la modificarea override-ului');
        } finally {
            setTogglingOverride(null);
        }
    };
    return (
        <div className="animate-fade-in">
            <div className="mb-6">
                <h1 className="text-h2 font-bold text-neutral-900 mb-1">
                    Tipuri de exerciții
                </h1>
                <p className="text-body text-neutral-500">
                    Activează sau dezactivează tipurile de exerciții la nivel global și per produs.
                </p>
            </div>

            {/* Tabs */}
            <div className="flex bg-neutral-100 rounded-lg p-1 mb-6 w-fit border border-neutral-200">
                {[
                    { key: 'global', label: '🌐 Config globală' },
                    { key: 'product', label: '📦 Override per produs' },
                ].map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={cn(
                            'px-5 py-2 rounded-md text-body font-semibold transition-all',
                            activeTab === tab.key
                                ? 'bg-white text-neutral-900 shadow-sm'
                                : 'text-neutral-500 hover:text-neutral-700'
                        )}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>


            {activeTab === 'global' && (
                <GlobalConfigTab
                    definitions={EXERCISE_TYPE_DEFINITIONS}
                    globalMap={globalMap}
                    loading={loadingGlobal}
                    togglingType={togglingType}
                    onToggle={handleGlobalToggle}
                />
            )}


            {activeTab === 'product' && (
                <ProductOverrideTab
                    products={products}
                    selectedProductId={selectedProductId}
                    onSelectProduct={setSelectedProductId}
                    resolvedStatuses={resolvedStatuses}
                    definitions={EXERCISE_TYPE_DEFINITIONS}
                    loading={loadingResolved}
                    togglingOverride={togglingOverride}
                    onToggleOverride={handleProductOverride}
                />
            )}
        </div>
    );
}

function GlobalConfigTab({ definitions, globalMap, loading, togglingType, onToggle }) {
    if (loading) return <LoadingSpinner />;

    return (
        <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
            <div className="px-4 py-3 bg-neutral-50 border-b border-neutral-200">
                <p className="text-caption font-bold text-neutral-500 uppercase tracking-wide">
                    Config globală — se aplică tuturor produselor unde nu există override
                </p>
            </div>
            <div className="divide-y divide-neutral-100">
                {definitions.map(def => {
                    const saved = globalMap[def.type];
                    const isEnabled = saved ? saved.enabled : true;
                    const isToggling = togglingType === def.type;

                    return (
                        <TypeRow
                            key={def.type}
                            def={def}
                            isEnabled={isEnabled}
                            isToggling={isToggling}
                            badge={null}
                            onToggle={() => !isToggling && onToggle(def.type, isEnabled)}
                        />
                    );
                })}
            </div>
        </div>
    );
}


function ProductOverrideTab({
                                products, selectedProductId, onSelectProduct,
                                resolvedStatuses, definitions,
                                loading, togglingOverride, onToggleOverride,
                            }) {

    const resolvedMap = Object.fromEntries(
        resolvedStatuses.map(s => [s.exerciseType, s])
    );

    return (
        <div className="flex flex-col gap-4">

            <div className="bg-white rounded-xl border border-neutral-200 p-4">
                <label className="block text-caption font-bold text-neutral-600 uppercase tracking-wide mb-2">
                    Selectează produsul
                </label>
                <select
                    value={selectedProductId}
                    onChange={e => onSelectProduct(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border-2 border-neutral-200 bg-white text-body text-neutral-900 focus:outline-none focus:border-primary-400 transition-colors"
                >
                    <option value="">— Alege un produs —</option>
                    {products.map(p => (
                        <option key={p.id} value={String(p.id)}>
                            {p.title} {p.subject ? `(${p.subject})` : ''}
                        </option>
                    ))}
                </select>
            </div>

            {selectedProductId && (
                <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
                    <div className="px-4 py-3 bg-neutral-50 border-b border-neutral-200 flex items-center justify-between">
                        <p className="text-caption font-bold text-neutral-500 uppercase tracking-wide">
                            Tipuri de exerciții pentru produs
                        </p>
                        <p className="text-caption text-neutral-400">
                            Override suprascrie config globală · Click pe buton pentru a reseta la global
                        </p>
                    </div>

                    {loading ? (
                        <div className="py-10 flex items-center justify-center">
                            <LoadingSpinner />
                        </div>
                    ) : (
                        <div className="divide-y divide-neutral-100">
                            {definitions.map(def => {
                                const resolved = resolvedMap[def.type];
                                const isEffectiveEnabled = resolved ? resolved.effectiveEnabled : true;
                                const globalEnabled = resolved ? resolved.globalEnabled : true;
                                const productOverride = resolved ? resolved.productOverride : null;
                                const isToggling = togglingOverride === def.type;

                                let badge = null;
                                if (productOverride !== null && productOverride !== undefined) {
                                    badge = (
                                        <span className="px-2 py-0.5 text-micro font-bold rounded-full bg-accent-100 text-accent-700">
                                            OVERRIDE
                                        </span>
                                    );
                                }

                                return (
                                    <TypeRow
                                        key={def.type}
                                        def={def}
                                        isEnabled={isEffectiveEnabled}
                                        isToggling={isToggling}
                                        badge={badge}
                                        globalEnabled={globalEnabled}
                                        hasOverride={productOverride !== null && productOverride !== undefined}
                                        onToggle={() => !isToggling && onToggleOverride(def.type, productOverride, globalEnabled)}
                                    />
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {!selectedProductId && (
                <div className="bg-white rounded-xl border-2 border-dashed border-neutral-200 p-10 text-center">
                    <div className="text-3xl mb-2">📦</div>
                    <p className="text-body font-semibold text-neutral-500">
                        Selectează un produs pentru a gestiona override-urile
                    </p>
                </div>
            )}
        </div>
    );
}
function TypeRow({ def, isEnabled, isToggling, badge, globalEnabled, hasOverride, onToggle }) {
    return (
        <div className="flex items-center gap-4 px-4 py-3 hover:bg-neutral-50 transition-colors">
            {/* Icon */}
            <div className={cn(
                'w-10 h-10 rounded-lg flex items-center justify-center text-lg flex-shrink-0',
                isEnabled ? 'bg-primary-50' : 'bg-neutral-100'
            )}>
                <span className={isEnabled ? '' : 'grayscale opacity-50'}>{def.icon}</span>
            </div>


            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                    <span className={cn(
                        'text-body font-semibold',
                        isEnabled ? 'text-neutral-900' : 'text-neutral-400'
                    )}>
                        {def.label}
                    </span>
                    {def.implemented && (
                        <span className="px-1.5 py-0.5 bg-success-100 text-success-700 text-micro rounded font-bold">
                            IMPLEMENTAT
                        </span>
                    )}
                    {badge}
                </div>
                <p className="text-caption text-neutral-400 truncate">{def.description}</p>

                {hasOverride && (
                    <p className="text-micro text-neutral-400 mt-0.5">
                        Global: {globalEnabled ? '✓ activ' : '✗ inactiv'} · Click pentru a reseta la global
                    </p>
                )}
            </div>


            <button
                onClick={onToggle}
                disabled={isToggling}
                title={isEnabled ? 'Dezactivează' : 'Activează'}
                className={cn(
                    'relative inline-flex items-center h-6 rounded-full w-11 transition-colors duration-200 flex-shrink-0',
                    isToggling && 'opacity-50 cursor-wait',
                    isEnabled ? 'bg-primary-500' : 'bg-neutral-300'
                )}
            >
                <span className={cn(
                    'inline-block w-4 h-4 transform bg-white rounded-full shadow transition-transform duration-200',
                    isEnabled ? 'translate-x-6' : 'translate-x-1'
                )} />
            </button>
        </div>
    );
}

function LoadingSpinner() {
    return (
        <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
    );
}

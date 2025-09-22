import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Asset } from '../types.ts';
import { getAssetDetails, getBrokerageSuggestions, getDividendYield } from '../services/geminiService.ts';
import { useDebounce } from '../hooks/useDebounce.ts';
import { Loader2, X, ArrowRight, Check, AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';

interface AssetModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (asset: Omit<Asset, 'id' | 'historicoPreco' | 'cotacaoBase' | 'order_index'> & { id?: number }) => void;
    asset: Asset | null;
}

const formInputClasses = "block w-full bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-700 rounded-lg py-2.5 px-4 text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition disabled:opacity-70 disabled:cursor-not-allowed";

const initialFormState = {
    ticker: '', nome: '', pais: '', categoria: 'Ações', corretora: '',
    quantidade: '', precoCompra: '', cotacaoAtual: '', dividendYield: '', 
    moedaCompra: 'BRL' as 'BRL' | 'USD' | 'USDT',
    moedaCotacao: 'BRL' as 'BRL' | 'USD',
    riskProfile: 'Moderado' as 'Seguro' | 'Moderado' | 'Arriscado',
    alertActive: false, alertPriceSuperior: '', alertPriceInferior: '',
};

const USD_BRL_RATE = 5.25;

const AssetModal: React.FC<AssetModalProps> = ({ isOpen, onClose, onSave, asset }) => {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState(initialFormState);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisError, setAnalysisError] = useState<string | null>(null);
    const [analysisSuccess, setAnalysisSuccess] = useState(false);
    const [brokerageSuggestions, setBrokerageSuggestions] = useState<string[]>([]);
    
    const debouncedTicker = useDebounce(formData.ticker, 500);

    const brlFormatter = useMemo(() => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }), []);
    const usdFormatter = useMemo(() => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }), []);

    const formatPurchaseCurrency = useCallback((value: number) => {
        if (formData.moedaCompra === 'USD' || formData.moedaCompra === 'USDT') {
            return usdFormatter.format(value);
        }
        return brlFormatter.format(value);
    }, [formData.moedaCompra, brlFormatter, usdFormatter]);
    
    const formatMarketCurrency = useCallback((value: number) => {
        if (formData.moedaCotacao === 'USD') {
            return usdFormatter.format(value);
        }
        return brlFormatter.format(value);
    }, [formData.moedaCotacao, brlFormatter, usdFormatter]);


    const resetAndClose = () => {
        setFormData(initialFormState);
        setStep(1);
        setAnalysisError(null);
        setAnalysisSuccess(false);
        onClose();
    };

    useEffect(() => {
        if (isOpen) {
            if (asset) {
                setFormData({
                    ticker: asset.ticker, nome: asset.nome, pais: asset.pais, categoria: asset.categoria, corretora: asset.corretora,
                    quantidade: String(asset.quantidade), precoCompra: String(asset.precoCompra), dividendYield: String(asset.dividendYield * 100),
                    cotacaoAtual: String(asset.cotacaoAtual),
                    moedaCompra: asset.moedaCompra || 'BRL',
                    moedaCotacao: asset.moedaCotacao || (asset.categoria === 'Cripto' || asset.pais === 'EUA' ? 'USD' : 'BRL'),
                    riskProfile: asset.riskProfile, alertActive: asset.alertActive ?? false,
                    alertPriceSuperior: String(asset.alertPriceSuperior ?? ''), alertPriceInferior: String(asset.alertPriceInferior ?? ''),
                });
                setAnalysisSuccess(true);
            } else {
                const savedBrokerage = localStorage.getItem('lastUsedBrokerage');
                setFormData(prev => ({ ...initialFormState, corretora: savedBrokerage || '' }));
                setAnalysisSuccess(false);
            }
            setStep(1);
        }
    }, [asset, isOpen]);

    useEffect(() => {
        const fetchBrokerages = async () => {
            if (formData.pais) {
                const suggestions = await getBrokerageSuggestions(formData.pais);
                setBrokerageSuggestions(suggestions);
            } else { setBrokerageSuggestions([]); }
        };
        fetchBrokerages();
    }, [formData.pais]);
    
    const modalConfig = useMemo(() => {
        const base = { tickerLabel: 'Código do Ativo', tickerPlaceholder: 'Ex: PETR4', priceLabel: 'Preço Médio Compra', brokerLabel: 'Corretora', disableRisk: false };
        switch (formData.categoria) {
            case 'Cripto': return { ...base, tickerLabel: 'Símbolo', tickerPlaceholder: 'Ex: BTC', priceLabel: 'Custo Médio', brokerLabel: 'Exchange', disableRisk: true };
            case 'Tesouro Direto': return { ...base, tickerLabel: 'Nome do Título', tickerPlaceholder: 'Ex: Tesouro Selic 2029', brokerLabel: 'Corretora / Banco', disableRisk: true };
            case 'FIIs': return { ...base, tickerPlaceholder: 'Ex: MXRF11', disableRisk: true };
            default: return base;
        }
    }, [formData.categoria]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { id, value, type } = e.target;
        if (id === 'ticker') {
             setAnalysisSuccess(false);
             setAnalysisError(null);
        }
        if (type === 'checkbox') setFormData(prev => ({ ...prev, [id]: (e.target as HTMLInputElement).checked }));
        else setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleAnalyzeTicker = useCallback(async (ticker: string) => {
        if (!ticker) return;
        setIsAnalyzing(true);
        setAnalysisError(null);
        setAnalysisSuccess(false);
        try {
            const details = await getAssetDetails(ticker);
            const dy = await getDividendYield(ticker, details.pais);
            setFormData(prev => ({ 
                ...prev, 
                nome: details.nome, 
                categoria: details.categoria, 
                pais: details.pais, 
                cotacaoAtual: details.cotacaoAtual.toString(),
                moedaCotacao: details.moedaCotacao,
                dividendYield: dy.toString() 
            }));
            setAnalysisSuccess(true);
        } catch (error) {
            setAnalysisError("Não foi possível buscar os dados. Verifique o código ou preencha manualmente.");
            setAnalysisSuccess(false);
        } finally {
            setIsAnalyzing(false);
        }
    }, []);

    useEffect(() => {
        const isEditing = !!asset;
        if (debouncedTicker && !isEditing) {
            handleAnalyzeTicker(debouncedTicker);
        }
    }, [debouncedTicker, asset, handleAnalyzeTicker]);


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const assetToSave = {
            ...formData, 
            id: asset?.id, 
            quantidade: parseFloat(formData.quantidade), 
            precoCompra: parseFloat(formData.precoCompra) || 0,
            cotacaoAtual: parseFloat(formData.cotacaoAtual) || 0,
            dividendYield: parseFloat(formData.dividendYield) / 100 || 0, 
            riskProfile: formData.riskProfile,
            alertPriceSuperior: formData.alertPriceSuperior ? parseFloat(formData.alertPriceSuperior) : undefined,
            alertPriceInferior: formData.alertPriceInferior ? parseFloat(formData.alertPriceInferior) : undefined,
        } as Omit<Asset, 'historicoPreco' | 'cotacaoBase' | 'order_index'> & { id?: number};
        if (assetToSave.corretora) localStorage.setItem('lastUsedBrokerage', assetToSave.corretora);
        onSave(assetToSave);
        resetAndClose();
    };

    const isStep1Valid = formData.ticker && formData.nome && formData.categoria && formData.pais;
    const isStep2Valid = formData.quantidade && formData.corretora;
    
    const quantidadeNum = parseFloat(formData.quantidade) || 0;
    const precoCompraNum = parseFloat(formData.precoCompra) || 0;
    const cotacaoAtualNum = parseFloat(formData.cotacaoAtual) || 0;

    const purchaseRate = (formData.moedaCompra === 'USD' || formData.moedaCompra === 'USDT') ? USD_BRL_RATE : 1;
    const custoTotalCompraEmBRL = (quantidadeNum * precoCompraNum) * purchaseRate;

    const currentRate = formData.moedaCotacao === 'USD' ? USD_BRL_RATE : 1;
    const valorMercadoAtualEmBRL = (quantidadeNum * cotacaoAtualNum) * currentRate;

    const renderProgressBar = () => (
        <div className="flex items-center mb-6">
            {['Identificação', 'Posição', 'Alertas'].map((title, index) => {
                const stepNumber = index + 1;
                const isCompleted = step > stepNumber;
                const isActive = step === stepNumber;
                return (
                    <React.Fragment key={stepNumber}>
                        <div className="flex flex-col items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold transition-colors ${isCompleted ? 'bg-sky-600 text-white' : isActive ? 'bg-sky-100 dark:bg-sky-900/50 text-sky-600 dark:text-sky-300 border-2 border-sky-500' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}>
                                {isCompleted ? <Check size={16} /> : stepNumber}
                            </div>
                            <p className={`mt-2 text-xs font-semibold ${isActive || isCompleted ? 'text-slate-700 dark:text-slate-200' : 'text-slate-400'}`}>{title}</p>
                        </div>
                        {stepNumber < 3 && <div className={`flex-1 h-1 mx-2 transition-colors ${isCompleted ? 'bg-sky-600' : 'bg-slate-200 dark:bg-slate-700'}`}></div>}
                    </React.Fragment>
                );
            })}
        </div>
    );
    
    const renderStepContent = () => {
        switch (step) {
            case 1: return (
                <div className="space-y-4">
                    <div>
                        <label htmlFor="ticker" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">{modalConfig.tickerLabel}</label>
                        <div className="relative">
                            <input type="text" id="ticker" value={formData.ticker} onChange={handleChange} required placeholder={modalConfig.tickerPlaceholder} className={`${formInputClasses} pr-12`} disabled={!!asset} />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
                                {isAnalyzing ? (
                                    <Loader2 className="h-5 w-5 text-slate-400 animate-spin" />
                                ) : analysisSuccess ? (
                                    <CheckCircle className="h-5 w-5 text-emerald-500" />
                                ) : analysisError ? (
                                    <AlertCircle className="h-5 w-5 text-red-500" />
                                ) : null}
                            </div>
                        </div>
                        {analysisError && <p className="text-xs text-red-500 mt-1">{analysisError}</p>}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="nome" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">Nome</label>
                            <input type="text" id="nome" value={formData.nome} onChange={handleChange} required disabled={isAnalyzing} className={formInputClasses} />
                        </div>
                        <div>
                            <label htmlFor="categoria" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">Categoria</label>
                            <select id="categoria" value={formData.categoria} onChange={handleChange} required disabled={isAnalyzing} className={formInputClasses}>
                                <option>Ações</option> <option>Bancos</option> <option>FIIs</option> <option>Cripto</option> <option>Tesouro Direto</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label htmlFor="pais" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">País</label>
                        <input type="text" id="pais" value={formData.pais} onChange={handleChange} required disabled={isAnalyzing} placeholder="Ex: Brasil, EUA, Global" className={formInputClasses} />
                    </div>
                </div>
            );
            case 2: return (
                <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="quantidade" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">Quantidade</label>
                            <input type="number" step="0.000001" id="quantidade" value={formData.quantidade} onChange={handleChange} required className={formInputClasses} />
                        </div>
                        <div>
                            <label htmlFor="precoCompra" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">{modalConfig.priceLabel}</label>
                            <input type="number" step="any" id="precoCompra" value={formData.precoCompra} onChange={handleChange} placeholder="Opcional" className={formInputClasses} />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="moedaCompra" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">Moeda da Compra</label>
                        <select id="moedaCompra" value={formData.moedaCompra} onChange={handleChange} required className={formInputClasses}>
                            <option value="BRL">BRL (R$)</option>
                            <option value="USD">USD (US$)</option>
                            <option value="USDT">USDT (US$)</option>
                        </select>
                    </div>
                     {quantidadeNum > 0 && (
                        <div className="sm:col-span-2 mt-2 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700 space-y-2">
                            {precoCompraNum > 0 && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500 dark:text-slate-400">Custo Total (em BRL):</span>
                                    <span className="font-semibold text-slate-700 dark:text-slate-200">{brlFormatter.format(custoTotalCompraEmBRL)}</span>
                                </div>
                            )}
                            {cotacaoAtualNum > 0 && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500 dark:text-slate-400">Valor de Mercado (em BRL):</span>
                                    <span className="font-semibold text-slate-700 dark:text-slate-200">{brlFormatter.format(valorMercadoAtualEmBRL)}</span>
                                </div>
                            )}
                            {(formData.moedaCotacao === 'USD' || formData.moedaCompra === 'USD' || formData.moedaCompra === 'USDT') && (
                                 <p className="text-xs text-slate-400 text-center pt-1 border-t border-slate-200 dark:border-slate-700/50 mt-2">Câmbio utilizado: US$ 1,00 = R$ {USD_BRL_RATE.toFixed(2)}</p>
                            )}
                        </div>
                    )}
                    <div><label htmlFor="corretora" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">{modalConfig.brokerLabel}</label><input type="text" id="corretora" value={formData.corretora} onChange={handleChange} required list="brokerage-list" className={formInputClasses} /><datalist id="brokerage-list">{brokerageSuggestions.map(b => <option key={b} value={b} />)}</datalist></div>
                    <div><label htmlFor="riskProfile" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">Perfil de Risco</label><select id="riskProfile" value={formData.riskProfile} onChange={handleChange} disabled={modalConfig.disableRisk} className={formInputClasses}><option value="Seguro">Seguro</option><option value="Moderado">Moderado</option><option value="Arriscado">Arriscado</option></select></div>
                </div>
            );
            case 3: return (
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
                        <label htmlFor="alertActive" className="font-semibold text-slate-700 dark:text-slate-300">Ativar Alertas de Preço</label>
                        <label className="relative inline-flex items-center cursor-pointer"><input type="checkbox" id="alertActive" checked={formData.alertActive} onChange={handleChange} className="sr-only peer" /><div className="w-11 h-6 bg-slate-200 dark:bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-600"></div></label>
                    </div>
                    {formData.alertActive && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in-down">
                            <div><label htmlFor="alertPriceSuperior" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">Preço Alvo Superior</label><input type="number" step="0.01" id="alertPriceSuperior" value={formData.alertPriceSuperior} placeholder="Ex: 150.75" onChange={handleChange} className={formInputClasses} /></div>
                            <div><label htmlFor="alertPriceInferior" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">Preço Alvo Inferior</label><input type="number" step="0.01" id="alertPriceInferior" value={formData.alertPriceInferior} placeholder="Ex: 120.00" onChange={handleChange} className={formInputClasses} /></div>
                        </div>
                    )}
                </div>
            );
            default: return null;
        }
    };
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex justify-center items-end sm:items-center z-50 p-0 sm:p-4" onClick={resetAndClose}>
            <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-t-2xl sm:rounded-2xl shadow-2xl border-t border-slate-200 sm:border dark:border-slate-700 flex flex-col h-[90vh] sm:h-auto sm:max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
                <header className="flex-shrink-0 flex items-start justify-between p-6 pb-4">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{asset ? 'Editar Ativo' : 'Adicionar Novo Ativo'}</h2>
                    <button onClick={resetAndClose} className="p-1.5 rounded-full text-slate-500 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-700"><X className="h-5 w-5"/></button>
                </header>
                <form onSubmit={handleSubmit} className="flex flex-col flex-grow overflow-hidden px-6">
                    {renderProgressBar()}
                    <div className="mt-8 flex-grow overflow-y-auto pr-2 -mr-2">
                        <div key={step} className="animate-slide-in-right">
                            {renderStepContent()}
                        </div>
                    </div>
                    <div className="flex-shrink-0 flex justify-end space-x-4 pt-6 mt-4 pb-6 border-t border-slate-200 dark:border-slate-700">
                        {step > 1 && <button type="button" onClick={() => setStep(s => s - 1)} className="py-2.5 px-6 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-lg font-semibold text-slate-700 dark:text-slate-300">Voltar</button>}
                        {step < 3 && <button type="button" onClick={() => setStep(s => s + 1)} disabled={step === 1 ? !isStep1Valid : !isStep2Valid} className="py-2.5 px-6 flex items-center gap-2 bg-sky-600 hover:bg-sky-500 rounded-lg font-semibold text-white disabled:opacity-50">Próximo <ArrowRight size={16}/></button>}
                        {step === 3 && <button type="submit" className="py-2.5 px-6 bg-sky-600 hover:bg-sky-500 rounded-lg font-semibold text-white">Salvar</button>}
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AssetModal;
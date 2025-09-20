import React, { useState, useEffect, useCallback } from 'react';
import { Asset } from '../types';
import { getDividendYield, getAssetDetails, getBrokerageSuggestions } from '../services/geminiService';
import { Sparkles, Loader2, X } from 'lucide-react';

interface AssetModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (asset: Omit<Asset, 'id' | 'historicoPreco' | 'cotacaoAtual' | 'cotacaoBase'> & { id?: number }) => void;
    asset: Asset | null;
}

const formInputClasses = "block w-full bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-700 rounded-lg py-2.5 px-4 text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition disabled:opacity-70";

const AssetModal: React.FC<AssetModalProps> = ({ isOpen, onClose, onSave, asset }) => {
    const [formData, setFormData] = useState({
        ticker: '',
        nome: '',
        pais: '',
        categoria: 'Ações',
        corretora: '',
        quantidade: '',
        precoCompra: '',
        dividendYield: '',
        riskProfile: 'Moderado',
        alertActive: false,
        alertPriceSuperior: '',
        alertPriceInferior: '',
    });

    const [isFetchingYield, setIsFetchingYield] = useState(false);
    const [isAutofilling, setIsAutofilling] = useState(false);
    const [brokerageSuggestions, setBrokerageSuggestions] = useState<string[]>([]);

    const initialFormState = {
        ticker: '',
        nome: '',
        pais: '',
        categoria: 'Ações',
        corretora: '',
        quantidade: '',
        precoCompra: '',
        dividendYield: '',
        riskProfile: 'Moderado',
        alertActive: false,
        alertPriceSuperior: '',
        alertPriceInferior: '',
    };

    useEffect(() => {
        if (asset) {
            setFormData({
                ticker: asset.ticker,
                nome: asset.nome,
                pais: asset.pais,
                categoria: asset.categoria,
                corretora: asset.corretora,
                quantidade: String(asset.quantidade),
                precoCompra: String(asset.precoCompra),
                dividendYield: String(asset.dividendYield * 100),
                riskProfile: asset.riskProfile,
                alertActive: asset.alertActive ?? false,
                alertPriceSuperior: String(asset.alertPriceSuperior ?? ''),
                alertPriceInferior: String(asset.alertPriceInferior ?? ''),
            });
        } else {
             setFormData(initialFormState);
        }
    }, [asset, isOpen]);

    useEffect(() => {
        const fetchBrokerages = async () => {
            if (formData.pais) {
                const suggestions = await getBrokerageSuggestions(formData.pais);
                setBrokerageSuggestions(suggestions);
            } else {
                setBrokerageSuggestions([]);
            }
        };
        fetchBrokerages();
    }, [formData.pais]);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { id, value, type } = e.target;
        if (type === 'checkbox') {
            const isChecked = (e.target as HTMLInputElement).checked;
            setFormData(prev => ({ ...prev, [id]: isChecked }));
        } else {
            setFormData(prev => ({ ...prev, [id]: value }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const assetToSave = {
            ...formData,
            id: asset?.id,
            quantidade: parseFloat(formData.quantidade),
            precoCompra: parseFloat(formData.precoCompra),
            dividendYield: parseFloat(formData.dividendYield) / 100 || 0,
            riskProfile: formData.categoria === 'Cripto' ? 'Arriscado' : (['FIIs', 'Tesouro Direto'].includes(formData.categoria) ? 'Seguro' : 'Moderado'),
            alertPriceSuperior: formData.alertPriceSuperior ? parseFloat(formData.alertPriceSuperior) : undefined,
            alertPriceInferior: formData.alertPriceInferior ? parseFloat(formData.alertPriceInferior) : undefined,
        } as Omit<Asset, 'historicoPreco' | 'cotacaoAtual' | 'cotacaoBase'> & { id?: number};
        onSave(assetToSave);
    };

    const handleFetchDividendYield = useCallback(async () => {
        if (!formData.ticker || !formData.pais) return;
        setIsFetchingYield(true);
        try {
            const result = await getDividendYield(formData.ticker, formData.pais);
            setFormData(prev => ({ ...prev, dividendYield: result.toString() }));
        } catch (error) {
            console.error("Failed to fetch dividend yield:", error);
        } finally {
            setIsFetchingYield(false);
        }
    }, [formData.ticker, formData.pais]);

    const handleTickerBlur = async () => {
        if (!formData.ticker) return;
        setIsAutofilling(true);
        try {
            const details = await getAssetDetails(formData.ticker);
            setFormData(prev => ({
                ...prev,
                nome: details.nome,
                categoria: details.categoria,
                pais: details.pais === 'Cripto' ? 'Global' : details.pais,
            }));
            await handleFetchDividendYield();
        } catch (error) {
            console.error("Failed to autofill asset details:", error);
            // Even if autofill fails, try to get DY if country is present
            if (formData.pais) await handleFetchDividendYield();
        } finally {
            setIsAutofilling(false);
        }
    };
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 w-full max-w-lg p-6 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700" onClick={(e) => e.stopPropagation()}>
                <header className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{asset ? 'Editar Ativo' : 'Adicionar Novo Ativo'}</h2>
                    <button onClick={onClose} className="p-1.5 rounded-full text-slate-500 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-700">
                        <X className="h-5 w-5"/>
                    </button>
                </header>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <fieldset className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
                        <legend className="text-base font-semibold text-slate-700 dark:text-slate-300 px-2">Informações do Ativo</legend>
                        <div className="grid grid-cols-2 gap-4 pt-2">
                            <div className="col-span-2 sm:col-span-1">
                                <label htmlFor="ticker" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">Código do Ativo</label>
                                <div className="relative">
                                    <input type="text" id="ticker" value={formData.ticker} onChange={handleChange} onBlur={handleTickerBlur} required className={formInputClasses} />
                                    {isAutofilling && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 animate-spin" />}
                                </div>
                            </div>
                            <div className="col-span-2 sm:col-span-1">
                                <label htmlFor="nome" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">Nome</label>
                                <input type="text" id="nome" value={formData.nome} onChange={handleChange} required disabled={isAutofilling} className={formInputClasses} />
                            </div>
                            <div className="col-span-2 sm:col-span-1">
                                <label htmlFor="categoria" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">Categoria</label>
                                <select id="categoria" value={formData.categoria} onChange={handleChange} required disabled={isAutofilling} className={formInputClasses}>
                                    <option>Ações</option> <option>Bancos</option> <option>FIIs</option> <option>Cripto</option> <option>Tesouro Direto</option>
                                </select>
                            </div>
                             <div className="col-span-2 sm:col-span-1">
                                <label htmlFor="pais" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">País</label>
                                <input type="text" id="pais" value={formData.pais} onChange={handleChange} required disabled={isAutofilling} className={formInputClasses} />
                            </div>
                        </div>
                    </fieldset>
                    
                    <fieldset className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
                        <legend className="text-base font-semibold text-slate-700 dark:text-slate-300 px-2">Detalhes da Posição</legend>
                         <div className="grid grid-cols-2 gap-4 pt-2">
                            <div>
                                <label htmlFor="quantidade" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">Quantidade</label>
                                <input type="number" step="0.000001" id="quantidade" value={formData.quantidade} onChange={handleChange} required className={formInputClasses} />
                            </div>
                            <div>
                                <label htmlFor="precoCompra" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">Preço Médio Compra</label>
                                <input type="number" step="0.01" id="precoCompra" value={formData.precoCompra} onChange={handleChange} required className={formInputClasses} />
                            </div>
                             <div>
                                <label htmlFor="corretora" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">Corretora</label>
                                <input type="text" id="corretora" value={formData.corretora} onChange={handleChange} required list="brokerage-list" className={formInputClasses} />
                                <datalist id="brokerage-list">
                                    {brokerageSuggestions.map(b => <option key={b} value={b} />)}
                                </datalist>
                            </div>
                            <div>
                                <label htmlFor="dividendYield" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">DY Anual (%)</label>
                                <div className="relative">
                                    <input type="number" step="0.01" id="dividendYield" value={formData.dividendYield} onChange={handleChange} placeholder="Ex: 5.5" className={`${formInputClasses} pr-10`} />
                                    <button
                                        type="button"
                                        onClick={handleFetchDividendYield}
                                        disabled={!formData.ticker || !formData.pais || isFetchingYield || isAutofilling}
                                        className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-500 hover:text-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                        title="Buscar DY com IA"
                                    >
                                        {isFetchingYield ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </fieldset>

                    <fieldset className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
                         <legend className="sr-only">Configuração de Alertas</legend>
                        <div className="flex items-center justify-between">
                            <label htmlFor="alertActive" className="font-semibold text-slate-700 dark:text-slate-300">Ativar Alertas de Preço</label>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" id="alertActive" checked={formData.alertActive} onChange={handleChange} className="sr-only peer" />
                                <div className="w-11 h-6 bg-slate-200 dark:bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-sky-300/50 dark:peer-focus:ring-sky-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-600"></div>
                            </label>
                        </div>
                         {formData.alertActive && (
                            <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                                <div>
                                    <label htmlFor="alertPriceSuperior" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">Preço Alvo Superior</label>
                                    <input type="number" step="0.01" id="alertPriceSuperior" value={formData.alertPriceSuperior} placeholder="Ex: 150.75" className={formInputClasses} />
                                </div>
                                <div>
                                    <label htmlFor="alertPriceInferior" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">Preço Alvo Inferior</label>
                                    <input type="number" step="0.01" id="alertPriceInferior" value={formData.alertPriceInferior} placeholder="Ex: 120.00" className={formInputClasses} />
                                </div>
                            </div>
                        )}
                    </fieldset>
                    
                    <div className="flex justify-end space-x-4 pt-2">
                        <button type="button" onClick={onClose} className="py-2.5 px-6 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-lg font-semibold text-slate-700 dark:text-slate-300 transition-colors">Cancelar</button>
                        <button type="submit" className="py-2.5 px-6 bg-sky-600 hover:bg-sky-500 rounded-lg font-semibold text-white transition-colors">Salvar</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AssetModal;
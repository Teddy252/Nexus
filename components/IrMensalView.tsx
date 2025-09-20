import React, { useState, useMemo, useEffect } from 'react';
import { Asset, SimulatedSale, TaxSummary } from '../types';
import { calculateMonthlyTax } from '../services/taxService';
import { generateDarfPdf } from '../services/pdfService';
import { getTaxExplanation } from '../services/geminiService';
import { useDebounce } from '../hooks/useDebounce';
import { Plus, Trash2, Calculator, BarChart, TrendingUp, FileText, AlertTriangle, BrainCircuit, Loader2 } from 'lucide-react';

const formatCurrency = (val: number) => `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const StatCard: React.FC<{ title: string; value: string; icon: React.ElementType, color: string }> = ({ title, value, icon: Icon, color }) => (
    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-4">
        <div className={`p-3 rounded-full bg-${color}-500/10`}>
            <Icon className={`h-6 w-6 text-${color}-500`} />
        </div>
        <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">{title}</p>
            <p className="text-xl font-bold text-slate-800 dark:text-slate-100">{value}</p>
        </div>
    </div>
);


const IrMensalView: React.FC<{ portfolioData: Asset[] }> = ({ portfolioData }) => {
    const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
    const [simulatedSales, setSimulatedSales] = useState<SimulatedSale[]>([]);
    const [saleForm, setSaleForm] = useState({ assetId: '', quantity: '', salePrice: '' });
    const [aiExplanation, setAiExplanation] = useState<string | null>(null);
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [aiError, setAiError] = useState<string | null>(null);

    const handleAddSale = (e: React.FormEvent) => {
        e.preventDefault();
        const asset = portfolioData.find(a => a.id === parseInt(saleForm.assetId));
        if (!asset) return;

        const quantity = parseFloat(saleForm.quantity);
        const salePrice = parseFloat(saleForm.salePrice);
        if (isNaN(quantity) || isNaN(salePrice) || quantity <= 0 || salePrice < 0) return;

        const profit = (salePrice - asset.precoCompra) * quantity;
        
        const newSale: SimulatedSale = {
            id: Date.now(),
            asset,
            date: month,
            quantity,
            salePrice,
            profit,
            assetCategory: asset.categoria,
        };
        setSimulatedSales(prev => [...prev, newSale]);
        setSaleForm({ assetId: '', quantity: '', salePrice: '' });
    };

    const handleDeleteSale = (id: number) => {
        setSimulatedSales(prev => prev.filter(s => s.id !== id));
    };

    const taxSummary: TaxSummary = useMemo(() => {
        const salesInMonth = simulatedSales.filter(s => s.date === month);
        return calculateMonthlyTax(salesInMonth);
    }, [simulatedSales, month]);
    
    const debouncedTaxSummary = useDebounce(taxSummary, 1500);

    useEffect(() => {
        const fetchExplanation = async () => {
            const salesInMonth = simulatedSales.filter(s => s.date === month);
            if (salesInMonth.length === 0) {
                setAiExplanation(null);
                setAiError(null);
                return;
            }

            setIsAiLoading(true);
            setAiError(null);
            try {
                const explanation = await getTaxExplanation(debouncedTaxSummary, salesInMonth);
                setAiExplanation(explanation);
            } catch (error: any) {
                setAiError(error.message || "Ocorreu um erro ao buscar a análise da IA.");
            } finally {
                setIsAiLoading(false);
            }
        };
        
        const hasSales = debouncedTaxSummary.totalSalesAcoes > 0 || debouncedTaxSummary.totalSalesCripto > 0 || debouncedTaxSummary.totalSalesFiis > 0;
        if (hasSales) {
           fetchExplanation();
        } else {
            setAiExplanation(null);
            setAiError(null);
        }

    }, [debouncedTaxSummary, month, simulatedSales]);

    const salesInSelectedMonth = simulatedSales.filter(s => s.date === month);

    const AiTaxAnalysis = () => (
        <div className="bg-white dark:bg-slate-800/80 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center">
                <BrainCircuit className="h-6 w-6 mr-3 text-purple-500" />
                Análise Tributária com IA
            </h2>
            {isAiLoading && (
                <div className="flex items-center text-slate-500 dark:text-slate-400">
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    <span>Analisando suas vendas...</span>
                </div>
            )}
            {aiError && !isAiLoading && (
                <div className="text-red-500 dark:text-red-400 text-sm">
                    <p><strong>Erro:</strong> {aiError}</p>
                </div>
            )}
            {aiExplanation && !isAiLoading && (
                <div
                    className="text-sm text-slate-600 dark:text-slate-300 space-y-2 prose dark:prose-invert"
                    dangerouslySetInnerHTML={{
                        __html: aiExplanation
                            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                             .replace(/^- (.*$)/gim, '<ul class="list-disc list-inside ml-4"><li>$1</li></ul>')
                            .replace(/<\/ul>\n<ul/g, '')
                    }}
                />
            )}
            {!isAiLoading && !aiError && !aiExplanation && (
                 <p className="text-slate-500 dark:text-slate-400 text-sm">Adicione uma venda para que a IA possa analisar os impostos.</p>
            )}
        </div>
    );

    return (
         <div className="max-w-6xl mx-auto">
            <header className="mb-8">
                <h1 className="text-4xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight mb-2">Calculadora de IR Mensal</h1>
                <p className="text-lg text-slate-500 dark:text-slate-400">Simule suas vendas e calcule o imposto de renda sobre ganhos de capital.</p>
            </header>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Coluna de Simulação */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white dark:bg-slate-800/80 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg">
                        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-1">Período de Apuração</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Selecione o mês da venda.</p>
                        <input
                            type="month"
                            value={month}
                            onChange={(e) => setMonth(e.target.value)}
                            className="w-full bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-700 rounded-lg py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-sky-500"
                        />
                    </div>

                    <div className="bg-white dark:bg-slate-800/80 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg">
                        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">Simular Venda</h2>
                        <form onSubmit={handleAddSale} className="space-y-4">
                            <div>
                                <label htmlFor="asset" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">Ativo da Carteira</label>
                                <select id="asset" value={saleForm.assetId} onChange={e => setSaleForm(f => ({ ...f, assetId: e.target.value }))} required className="w-full bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-700 rounded-lg py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-sky-500">
                                    <option value="">Selecione...</option>
                                    {portfolioData.map(a => <option key={a.id} value={a.id}>{a.ticker} ({a.nome})</option>)}
                                </select>
                            </div>
                             <div>
                                <label htmlFor="quantity" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">Quantidade Vendida</label>
                                <input type="number" step="any" id="quantity" placeholder="Ex: 100" value={saleForm.quantity} onChange={e => setSaleForm(f => ({ ...f, quantity: e.target.value }))} required className="w-full bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-700 rounded-lg py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-sky-500" />
                            </div>
                             <div>
                                <label htmlFor="salePrice" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">Preço de Venda (por unidade)</label>
                                <input type="number" step="any" id="salePrice" placeholder="Ex: 25.50" value={saleForm.salePrice} onChange={e => setSaleForm(f => ({ ...f, salePrice: e.target.value }))} required className="w-full bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-700 rounded-lg py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-sky-500" />
                            </div>
                            <button type="submit" className="w-full flex items-center justify-center gap-2 py-3 px-5 bg-sky-600 hover:bg-sky-500 rounded-lg font-semibold text-white transition-colors">
                                <Plus className="h-5 w-5" /> Adicionar Venda
                            </button>
                        </form>
                    </div>
                </div>

                 {/* Coluna de Resultados */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <StatCard title="Vendas (Ações)" value={formatCurrency(taxSummary.totalSalesAcoes)} icon={BarChart} color="sky" />
                        <StatCard title="Vendas (Cripto)" value={formatCurrency(taxSummary.totalSalesCripto)} icon={BarChart} color="amber" />
                        <StatCard title="Lucro/Prejuízo Total" value={formatCurrency(taxSummary.profitAcoes + taxSummary.profitFiis + taxSummary.profitCripto)} icon={TrendingUp} color="purple" />
                    </div>
                    
                     <div className="bg-gradient-to-br from-emerald-500 to-green-600 dark:from-emerald-600 dark:to-green-700 p-6 rounded-2xl shadow-2xl text-white">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-lg font-medium opacity-80">Imposto Devido (DARF)</p>
                                <p className="text-5xl font-bold tracking-tight">{formatCurrency(taxSummary.taxDue)}</p>
                            </div>
                             <button 
                                onClick={() => generateDarfPdf(month, taxSummary.taxDue)}
                                disabled={taxSummary.taxDue <= 0}
                                className="flex items-center gap-2 py-2.5 px-5 bg-white/20 hover:bg-white/30 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                             >
                                <FileText className="h-5 w-5" /> Gerar DARF
                            </button>
                        </div>
                    </div>

                    <AiTaxAnalysis />

                     <div className="bg-white dark:bg-slate-800/80 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg">
                        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">Vendas Simuladas em {new Date(month + '-02').toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}</h2>
                        <div className="max-h-96 overflow-y-auto">
                            {salesInSelectedMonth.length > 0 ? (
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-slate-200 dark:border-slate-700">
                                            <th className="p-3 font-semibold text-slate-600 dark:text-slate-300">Ativo</th>
                                            <th className="p-3 font-semibold text-slate-600 dark:text-slate-300 text-right">Quantidade</th>
                                            <th className="p-3 font-semibold text-slate-600 dark:text-slate-300 text-right">L/P</th>
                                            <th className="p-3 font-semibold text-slate-600 dark:text-slate-300 text-center">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {salesInSelectedMonth.map(sale => (
                                            <tr key={sale.id} className="border-b border-slate-100 dark:border-slate-800">
                                                <td className="p-3 font-medium text-slate-800 dark:text-slate-100">{sale.asset.ticker}</td>
                                                <td className="p-3 text-right text-slate-600 dark:text-slate-300">{sale.quantity.toLocaleString('pt-BR')}</td>
                                                <td className={`p-3 text-right font-semibold ${sale.profit >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>{formatCurrency(sale.profit)}</td>
                                                <td className="p-3 text-center">
                                                     <button onClick={() => handleDeleteSale(sale.id)} className="p-2 text-slate-500 hover:text-red-500 rounded-full"><Trash2 className="h-4 w-4" /></button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                                    <Calculator className="h-12 w-12 mx-auto mb-2" />
                                    <p className="font-semibold">Nenhuma venda simulada para este mês.</p>
                                    <p className="text-sm">Use o formulário ao lado para começar.</p>
                                </div>
                            )}
                        </div>
                    </div>
                     <div className="p-4 bg-amber-500/10 text-amber-800 dark:text-amber-200 rounded-2xl border border-amber-500/20 text-sm flex gap-3">
                        <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                        <div>
                            <span className="font-bold">Aviso:</span> Esta é uma ferramenta de simulação para fins educacionais. Os cálculos são baseados em regras gerais e podem não abranger todas as especificidades do seu caso. Consulte sempre um contador profissional.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default IrMensalView;
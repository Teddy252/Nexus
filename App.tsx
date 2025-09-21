import React, { useState, useContext, useMemo, useEffect, useCallback, useRef } from 'react';
import { AuthProvider } from './context/AuthContext';
import Dashboard from './Dashboard';
import { ThemeProvider } from './context/ThemeContext';
import { CurrencyProvider } from './context/CurrencyContext';
import { LanguageProvider } from './context/LanguageContext';
import SideNavBar from './components/SideNavBar';
import AuthPage from './components/AuthPage';
import { AuthContext } from './context/AuthContext';
import AccountView from './components/AccountView';
import DeclaracaoAnualView from './components/DeclaracaoAnualView';
import IrMensalView from './components/IrMensalView';
import ProventosView from './components/ProventosView';
import AssetModal from './components/AssetModal';
import AiInsightsModal from './components/AiInsightsModal';
import AiOptimizationModal from './components/AiOptimizationModal';
import NotificationBanner from './components/NotificationBanner';
import SelectionActionBar from './components/SelectionActionBar';
import { Asset, Provento, AiAnalysis, AiOptimizationAnalysis, PortfolioSuggestion, UserProfile, Notification, OptimizationStrategy } from './types';
import { IR_INFO_DATA } from './constants';
import { getPortfolioAnalysis, getPortfolioOptimization } from './services/geminiService';
import { supabase } from './services/supabaseClient';
import CarteiraView from './components/CarteiraView';
import AnalyticsView from './components/AnalyticsView';
import IaView from './components/IaView';
import NoticiasView from './components/NoticiasView';
import BottomNavBar from './components/BottomNavBar';
import StrategySelectionModal from './components/StrategySelectionModal';
import AddAssetChoiceModal from './components/AddAssetChoiceModal';
import ImportModal from './components/ImportModal';

// Helper function to map Supabase snake_case to frontend camelCase
const mapAssetFromDb = (dbAsset: any): Asset => ({
    id: dbAsset.id,
    ticker: dbAsset.ticker,
    nome: dbAsset.nome,
    categoria: dbAsset.categoria,
    quantidade: dbAsset.quantidade,
    precoCompra: dbAsset.preco_compra,
    cotacaoBase: dbAsset.cotacao_base,
    cotacaoAtual: dbAsset.cotacao_atual,
    corretora: dbAsset.corretora,
    pais: dbAsset.pais,
    riskProfile: dbAsset.risk_profile,
    historicoPreco: dbAsset.historico_preco,
    dividendYield: dbAsset.dividend_yield,
    alertActive: dbAsset.alert_active,
    alertPriceSuperior: dbAsset.alert_price_superior,
    alertPriceInferior: dbAsset.alert_price_inferior,
    order_index: dbAsset.order_index,
    user_id: dbAsset.user_id,
    created_at: dbAsset.created_at,
});

const mapProventoFromDb = (dbProvento: any): Provento => ({
    id: dbProvento.id,
    assetId: dbProvento.asset_id,
    date: dbProvento.date,
    value: dbProvento.value,
    type: dbProvento.type,
});


const MainApp: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
    const { currentUser } = useContext(AuthContext);
    const [portfolioData, setPortfolioData] = useState<Asset[]>([]);
    const [proventosData, setProventosData] = useState<Provento[]>([]);
    const [isDataLoaded, setIsDataLoaded] = useState(false);
    
    const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
    const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
    const [isAiModalOpen, setIsAiModalOpen] = useState(false);
    const [aiAnalysis, setAiAnalysis] = useState<AiAnalysis | null>(null);
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [aiError, setAiError] = useState<string | null>(null);
    const [isOptimizationModalOpen, setIsOptimizationModalOpen] = useState(false);
    const [optimizationAnalysis, setOptimizationAnalysis] = useState<AiOptimizationAnalysis | null>(null);
    const [isOptimizing, setIsOptimizing] = useState(false);
    const [optimizationError, setOptimizationError] = useState<string | null>(null);
    const [isStrategyModalOpen, setIsStrategyModalOpen] = useState(false);
    const [isAddAssetChoiceModalOpen, setIsAddAssetChoiceModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);


    const [activeView, setActiveView] = useState('dashboard');
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [activeNotifications, setActiveNotifications] = useState<Notification[]>([]);
    const triggeredAlertsRef = useRef<Set<number>>(new Set());
    const [selectedAssetIds, setSelectedAssetIds] = useState<Set<number>>(new Set());
    const [scrollToTicker, setScrollToTicker] = useState<string | null>(null);

    const loadUserData = useCallback(async () => {
        try {
            if (!currentUser) {
                // In production, a user must be logged in to see data.
                // The AuthProvider ensures this component isn't rendered without a user.
                // This is a safeguard.
                setPortfolioData([]);
                setProventosData([]);
                setIsDataLoaded(true);
                return;
            }
            // Production logic: fetch user data from Supabase.
            const { data: assetsData, error: assetsError } = await supabase
                .from('ativos')
                .select('*')
                .order('order_index');
                
            if (assetsError) throw assetsError;
            setPortfolioData((assetsData || []).map(mapAssetFromDb));

            const { data: proventosDb, error: proventosError } = await supabase
                .from('proventos')
                .select('*')
                .order('date', { ascending: false });

            if (proventosError) throw proventosError;

            setProventosData((proventosDb || []).map(mapProventoFromDb));
            
        } catch (error) {
            console.error("Erro ao carregar dados do usuário:", error);
            setPortfolioData([]); // Ensure portfolio is empty on error.
            setProventosData([]);
        } finally {
            setIsDataLoaded(true);
        }
    }, [currentUser]);

    useEffect(() => { loadUserData(); }, [loadUserData]);
    
    const formatCurrencyBRL = (val: number) => `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const derivedData = useMemo(() => {
        let patrimonioTotal = 0;
        let totalInvestido = 0;
        let totalGanhos = 0;
        let totalPerdas = 0;
        let proventosAnuaisEstimados = 0;
    
        portfolioData.forEach(asset => {
            const valorAtual = asset.cotacaoAtual * asset.quantidade;
            const custoTotal = asset.precoCompra * asset.quantidade;
            const lucroPrejuizo = valorAtual - custoTotal;
    
            patrimonioTotal += valorAtual;
            totalInvestido += custoTotal;
            proventosAnuaisEstimados += valorAtual * asset.dividendYield;
    
            if (lucroPrejuizo > 0) {
                totalGanhos += lucroPrejuizo;
            } else {
                totalPerdas += lucroPrejuizo;
            }
        });
    
        const lucroPrejuizoTotal = patrimonioTotal - totalInvestido;
        const lucroPrejuizoPercentual = totalInvestido > 0 ? (lucroPrejuizoTotal / totalInvestido) * 100 : 0;
    
        return {
            patrimonioTotal,
            totalInvestido,
            lucroPrejuizoTotal,
            lucroPrejuizoPercentual,
            proventosAnuaisEstimados,
            totalGanhos,
            totalPerdas
        };
    }, [portfolioData]);

    useEffect(() => {
        const newNotifications: Notification[] = [];
        const currentTriggeredIds = new Set<number>();

        portfolioData.forEach(asset => {
            const isTriggered = asset.alertActive && (
                (asset.alertPriceSuperior && asset.cotacaoAtual >= asset.alertPriceSuperior) ||
                (asset.alertPriceInferior && asset.cotacaoAtual <= asset.alertPriceInferior)
            );

            if (isTriggered) {
                currentTriggeredIds.add(asset.id);
                if (!triggeredAlertsRef.current.has(asset.id)) {
                    let message = '';
                    if (asset.alertPriceSuperior && asset.cotacaoAtual >= asset.alertPriceSuperior) {
                        message = `${asset.ticker} atingiu seu alerta superior de ${formatCurrencyBRL(asset.alertPriceSuperior)}.`;
                    } else if (asset.alertPriceInferior && asset.cotacaoAtual <= asset.alertPriceInferior) {
                        message = `${asset.ticker} atingiu seu alerta inferior de ${formatCurrencyBRL(asset.alertPriceInferior)}.`;
                    }
                    if (message) {
                        newNotifications.push({ id: asset.id, message });
                    }
                }
            }
        });

        triggeredAlertsRef.current = currentTriggeredIds;

        if (newNotifications.length > 0) {
            setActiveNotifications(prev => {
                const existingIds = new Set(prev.map(n => n.id));
                const filteredNew = newNotifications.filter(n => !existingIds.has(n.id));
                return [...prev, ...filteredNew];
            });
        }
    }, [portfolioData]);

    const handleDismissNotification = (id: number) => {
        setActiveNotifications(prev => prev.filter(n => n.id !== id));
    };

    const handleSaveAsset = async (assetData: Omit<Asset, 'id' | 'historicoPreco' | 'cotacaoAtual' | 'cotacaoBase' | 'order_index'> & { id?: number }) => {
        if (!currentUser) return;

        const isEditing = editingAsset && assetData.id;

        const payload = {
            ticker: assetData.ticker,
            nome: assetData.nome,
            pais: assetData.pais,
            categoria: assetData.categoria,
            corretora: assetData.corretora,
            quantidade: assetData.quantidade,
            preco_compra: assetData.precoCompra,
            dividend_yield: assetData.dividendYield,
            risk_profile: assetData.riskProfile,
            alert_active: assetData.alertActive,
            alert_price_superior: assetData.alertPriceSuperior,
            alert_price_inferior: assetData.alertPriceInferior,
            historico_preco: editingAsset?.historicoPreco || Array(7).fill(assetData.precoCompra),
            cotacao_base: editingAsset?.cotacaoBase || assetData.precoCompra,
            cotacao_atual: editingAsset?.cotacaoAtual || assetData.precoCompra,
        };

        if (isEditing) {
            const { error } = await supabase
                .from('ativos')
                .update(payload)
                .eq('id', editingAsset.id);

            if (error) { console.error('Error updating asset:', error); return; }
        } else {
            const maxOrderIndex = portfolioData.reduce((max, asset) => Math.max(asset.order_index, max), -1);
            
            const { error } = await supabase
                .from('ativos')
                .insert({ ...payload, user_id: currentUser.id, order_index: maxOrderIndex + 1 });
            
            if (error) { console.error('Error creating asset:', error); return; }
        }
        await loadUserData();
        setIsAssetModalOpen(false);
        setEditingAsset(null);
    };

    const handleEditAsset = (asset: Asset) => {
        setEditingAsset(asset);
        setIsAssetModalOpen(true);
    };

    const handleDeleteAsset = async (id: number) => {
        if (window.confirm("Tem certeza que deseja excluir este ativo?")) {
            const { error } = await supabase.from('ativos').delete().eq('id', id);
            if (error) { console.error('Error deleting asset:', error); return; }
            await loadUserData();
        }
    };

    const handleDuplicateAsset = async (id: number) => {
        const assetToDuplicate = portfolioData.find(asset => asset.id === id);
        if (!assetToDuplicate || !currentUser) return;

        const payload = {
            ticker: assetToDuplicate.ticker,
            nome: assetToDuplicate.nome,
            pais: assetToDuplicate.pais,
            categoria: assetToDuplicate.categoria,
            corretora: assetToDuplicate.corretora,
            quantidade: assetToDuplicate.quantidade,
            preco_compra: assetToDuplicate.precoCompra,
            dividend_yield: assetToDuplicate.dividendYield,
            risk_profile: assetToDuplicate.riskProfile,
            alert_active: assetToDuplicate.alertActive,
            alert_price_superior: assetToDuplicate.alertPriceSuperior,
            alert_price_inferior: assetToDuplicate.alertPriceInferior,
            historico_preco: assetToDuplicate.historicoPreco,
            cotacao_base: assetToDuplicate.cotacaoBase,
            cotacao_atual: assetToDuplicate.cotacaoAtual,
        };
        
        const maxOrderIndex = portfolioData.reduce((max, asset) => Math.max(asset.order_index, max), -1);

        const { error } = await supabase
            .from('ativos')
            .insert({ ...payload, user_id: currentUser.id, order_index: maxOrderIndex + 1 });
        
        if (error) { console.error('Error duplicating asset:', error); return; }
        await loadUserData();
    };
    
    const handleToggleAlert = async (id: number) => {
        const asset = portfolioData.find(a => a.id === id);
        if (!asset) return;

        const { error } = await supabase
            .from('ativos')
            .update({ alert_active: !asset.alertActive })
            .eq('id', id);
        
        if (error) { console.error("Error toggling alert:", error); return; }
        await loadUserData();
    };

    const handleOpenAiAnalysis = async () => {
        setIsAiModalOpen(true);
        setIsAiLoading(true);
        setAiError(null);
        try {
            const analysisResult = await getPortfolioAnalysis(portfolioData);
            setAiAnalysis(analysisResult);
        } catch (error) {
            setAiError("Não foi possível obter a análise da IA. Verifique sua chave de API e tente novamente.");
            console.error(error);
        } finally {
            setIsAiLoading(false);
        }
    };
    
    const handleOpenPortfolioOptimization = async (strategy: OptimizationStrategy) => {
        setIsStrategyModalOpen(false);
        setIsOptimizationModalOpen(true);
        setIsOptimizing(true);
        setOptimizationError(null);
        try {
            const result = await getPortfolioOptimization(portfolioData, strategy);
            setOptimizationAnalysis(result);
        } catch(error) {
            setOptimizationError("Não foi possível obter a otimização da IA. Tente novamente.");
            console.error(error);
        } finally {
            setIsOptimizing(false);
        }
    };
    
    const handleApplyOptimization = async (suggestions: PortfolioSuggestion[]) => {
        if (!currentUser) return;
        setIsOptimizationModalOpen(false);

        // FIX: Changed type from Promise<any>[] to PromiseLike<any>[] to correctly handle Supabase's "thenable" query builders.
        const dbOperations: PromiseLike<any>[] = [];

        suggestions.forEach(s => {
            const existingAsset = portfolioData.find(a => a.ticker === s.ticker);
            
            if (s.action === 'BUY') {
                if (existingAsset) {
                    const newQuantity = existingAsset.quantidade + s.quantidade;
                    dbOperations.push(supabase.from('ativos').update({ quantidade: newQuantity }).eq('id', existingAsset.id));
                } else {
                    const maxOrderIndex = portfolioData.reduce((max, asset) => Math.max(asset.order_index, max), -1) + dbOperations.length;
                    const newAssetPayload = {
                        user_id: currentUser.id,
                        ticker: s.ticker,
                        nome: s.nome,
                        categoria: s.categoria,
                        pais: s.pais,
                        quantidade: s.quantidade,
                        preco_compra: s.precoAtual,
                        cotacao_base: s.precoAtual,
                        cotacao_atual: s.precoAtual,
                        corretora: 'N/A',
                        risk_profile: 'Moderado',
                        historico_preco: Array(7).fill(s.precoAtual),
                        dividend_yield: 0,
                        order_index: maxOrderIndex + 1,
                    };
                    dbOperations.push(supabase.from('ativos').insert(newAssetPayload));
                }
            } else if (s.action === 'SELL') {
                if (existingAsset) {
                    const newQuantity = existingAsset.quantidade - s.quantidade;
                    if (newQuantity > 0) {
                        dbOperations.push(supabase.from('ativos').update({ quantidade: newQuantity }).eq('id', existingAsset.id));
                    } else {
                        dbOperations.push(supabase.from('ativos').delete().eq('id', existingAsset.id));
                    }
                }
            }
        });
        
        try {
            const results = await Promise.all(dbOperations);
            results.forEach(res => {
                if (res.error) console.error('Error during optimization operation:', res.error);
            });
        } catch (error) {
            console.error('Failed to apply all optimizations:', error);
        } finally {
            await loadUserData();
        }
    };

    const handleImportAssets = async (importedAssets: Asset[]) => {
        if (!currentUser || importedAssets.length === 0) return;
        
        let maxOrderIndex = portfolioData.reduce((max, asset) => Math.max(asset.order_index, max), -1);
        
        const newAssetPayloads = importedAssets.map(asset => {
            maxOrderIndex++;
            return {
                user_id: currentUser.id,
                order_index: maxOrderIndex,
                ticker: asset.ticker,
                nome: asset.nome,
                pais: asset.pais,
                categoria: asset.categoria,
                corretora: asset.corretora,
                quantidade: asset.quantidade,
                preco_compra: asset.precoCompra,
                dividend_yield: asset.dividendYield,
                risk_profile: asset.riskProfile,
                alert_active: asset.alertActive,
                alert_price_superior: asset.alertPriceSuperior,
                alert_price_inferior: asset.alertPriceInferior,
                historico_preco: asset.historicoPreco,
                cotacao_base: asset.cotacaoBase,
                cotacao_atual: asset.cotacaoAtual,
            };
        });

        const { error } = await supabase
            .from('ativos')
            .insert(newAssetPayloads);

        if (error) { console.error('Error importing assets:', error); return; }
        await loadUserData();
    };
    
    const handleReorderAssets = async (draggedId: number, targetId: number) => {
        let newPortfolio: Asset[] = [...portfolioData];
        const isMultiDrag = selectedAssetIds.has(draggedId);

        if (isMultiDrag && selectedAssetIds.size > 1) {
            const selectedAssets = newPortfolio.filter(p => selectedAssetIds.has(p.id));
            const remainingAssets = newPortfolio.filter(p => !selectedAssetIds.has(p.id));
            const targetIndex = remainingAssets.findIndex(p => p.id === targetId);

            if (targetIndex === -1) {
                newPortfolio = [...remainingAssets, ...selectedAssets];
            } else {
                newPortfolio = [
                    ...remainingAssets.slice(0, targetIndex),
                    ...selectedAssets,
                    ...remainingAssets.slice(targetIndex)
                ];
            }
        } else {
            const draggedIndex = newPortfolio.findIndex(p => p.id === draggedId);
            const targetIndex = newPortfolio.findIndex(p => p.id === targetId);
            if (draggedIndex === -1 || targetIndex === -1) return;
            const [draggedItem] = newPortfolio.splice(draggedIndex, 1);
            newPortfolio.splice(targetIndex, 0, draggedItem);
        }
        
        const orderedPortfolio = newPortfolio.map((asset, index) => ({...asset, order_index: index}));
        setPortfolioData(orderedPortfolio);

        const updates = orderedPortfolio.map((asset) => ({
            id: asset.id,
            order_index: asset.order_index,
        }));

        const { error } = await supabase.from('ativos').upsert(updates);

        if (error) {
            console.error('Error saving new order:', error);
            await loadUserData(); // Revert to DB state on failure
        }
    };
    
    const handleToggleAssetSelection = (id: number) => {
        setSelectedAssetIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };
    
    const handleToggleAllAssetsSelection = (assetIds: number[], areAllCurrentlySelected: boolean) => {
        setSelectedAssetIds(prev => {
            const newSet = new Set(prev);
            if (areAllCurrentlySelected) {
                assetIds.forEach(id => newSet.delete(id));
            } else {
                assetIds.forEach(id => newSet.add(id));
            }
            return newSet;
        });
    };

    const handleClearSelection = () => setSelectedAssetIds(new Set());
    
    const handleDeleteSelectedAssets = async () => {
        if (window.confirm(`Tem certeza que deseja excluir ${selectedAssetIds.size} ativos?`)) {
            const idsToDelete = Array.from(selectedAssetIds);
            const { error } = await supabase.from('ativos').delete().in('id', idsToDelete);
            if (error) {
                console.error('Error deleting selected assets:', error);
                return;
            }
            await loadUserData();
            handleClearSelection();
        }
    };

    const handleDuplicateSelectedAssets = async () => {
        if (!currentUser) return;
        const assetsToDuplicate = portfolioData.filter(asset => selectedAssetIds.has(asset.id));
        if (assetsToDuplicate.length === 0) return;

        let maxOrderIndex = portfolioData.reduce((max, asset) => Math.max(asset.order_index, max), -1);

        const newAssetPayloads = assetsToDuplicate.map(asset => {
            maxOrderIndex++;
            return {
                user_id: currentUser.id,
                order_index: maxOrderIndex,
                ticker: asset.ticker,
                nome: asset.nome,
                pais: asset.pais,
                categoria: asset.categoria,
                corretora: asset.corretora,
                quantidade: asset.quantidade,
                preco_compra: asset.precoCompra,
                dividend_yield: asset.dividendYield,
                risk_profile: asset.riskProfile,
                alert_active: asset.alertActive,
                alert_price_superior: asset.alertPriceSuperior,
                alert_price_inferior: asset.alertPriceInferior,
                historico_preco: asset.historicoPreco,
                cotacao_base: asset.cotacaoBase,
                cotacao_atual: asset.cotacaoAtual,
            };
        });

        const { error } = await supabase
            .from('ativos')
            .insert(newAssetPayloads);
        
        if (error) { console.error('Error duplicating selected assets:', error); return; }

        await loadUserData();
        handleClearSelection();
    };

    const handleSelectAssetAndNavigate = (ticker: string) => {
        setActiveView('carteira');
        setScrollToTicker(ticker);
    };

    const renderView = () => {
        const viewProps = {
            portfolioData,
            onEditAsset: handleEditAsset,
            onDeleteAsset: handleDeleteAsset,
            onDuplicateAsset: handleDuplicateAsset,
            onToggleAlert: handleToggleAlert,
            onReorderAssets: handleReorderAssets,
            selectedAssetIds,
            onToggleAssetSelection: handleToggleAssetSelection,
            onToggleAllAssets: handleToggleAllAssetsSelection,
        };

        switch (activeView) {
            case 'dashboard':
                return <Dashboard
                    portfolioData={portfolioData}
                    isDataLoaded={isDataLoaded}
                    onStartAddAssetFlow={() => setIsAddAssetChoiceModalOpen(true)}
                    onAiAnalysis={handleOpenAiAnalysis}
                    onOptimizePortfolio={() => setIsStrategyModalOpen(true)}
                    onLogout={onLogout}
                    onNavigate={setActiveView}
                    derivedData={derivedData}
                    onSelectAsset={handleSelectAssetAndNavigate}
                />;
            case 'carteira':
                return <CarteiraView 
                    {...viewProps}
                    scrollToTicker={scrollToTicker}
                    onScrollComplete={() => setScrollToTicker(null)}
                    onStartAddAssetFlow={() => setIsAddAssetChoiceModalOpen(true)}
                />;
            case 'proventos':
                return <ProventosView 
                    portfolioData={portfolioData} 
                    proventosData={proventosData} 
                    onStartAddAssetFlow={() => setIsAddAssetChoiceModalOpen(true)} 
                />;
            case 'analise':
                return <AnalyticsView 
                    portfolioData={portfolioData} 
                    onStartAddAssetFlow={() => setIsAddAssetChoiceModalOpen(true)} 
                />;
            case 'noticias':
                return <NoticiasView portfolioData={portfolioData} />;
            case 'declaracao':
                return <DeclaracaoAnualView portfolioData={portfolioData} irInfo={IR_INFO_DATA} loadingInfo={!isDataLoaded} error={null} />;
            case 'ir_mensal':
                return <IrMensalView portfolioData={portfolioData} />;
            case 'ia':
                return <IaView onAiAnalysis={handleOpenAiAnalysis} onOptimizePortfolio={() => setIsStrategyModalOpen(true)} />;
            case 'conta':
                return <AccountView />;
            default:
                return <div>Página não encontrada</div>;
        }
    };

    return (
        <div className="min-h-screen">
            <SideNavBar 
                activeView={activeView}
                onNavigate={setActiveView}
                isCollapsed={isSidebarCollapsed}
                onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                onLogout={onLogout}
            />
            <main className={`flex-grow transition-all duration-300 pb-16 lg:pb-0 ${isSidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
                 <div className="p-4 sm:p-6 lg:p-8">
                    {renderView()}
                </div>
            </main>
            
             <AssetModal
                isOpen={isAssetModalOpen}
                onClose={() => setIsAssetModalOpen(false)}
                onSave={handleSaveAsset}
                asset={editingAsset}
            />
            <AiInsightsModal 
                isOpen={isAiModalOpen}
                onClose={() => setIsAiModalOpen(false)}
                analysis={aiAnalysis}
                isLoading={isAiLoading}
                error={aiError}
            />
            <AiOptimizationModal
                isOpen={isOptimizationModalOpen}
                onClose={() => setIsOptimizationModalOpen(false)}
                analysis={optimizationAnalysis}
                isLoading={isOptimizing}
                error={optimizationError}
                onApply={handleApplyOptimization}
            />
            <StrategySelectionModal
                isOpen={isStrategyModalOpen}
                onClose={() => setIsStrategyModalOpen(false)}
                onSelectStrategy={handleOpenPortfolioOptimization}
            />
             <AddAssetChoiceModal
                isOpen={isAddAssetChoiceModalOpen}
                onClose={() => setIsAddAssetChoiceModalOpen(false)}
                onManualAdd={() => {
                    setIsAddAssetChoiceModalOpen(false);
                    setEditingAsset(null);
                    setIsAssetModalOpen(true);
                }}
                onImport={() => {
                    setIsAddAssetChoiceModalOpen(false);
                    setIsImportModalOpen(true);
                }}
            />
            <ImportModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                onImport={handleImportAssets}
            />
            <NotificationBanner
                notifications={activeNotifications}
                onDismiss={handleDismissNotification}
            />
            {selectedAssetIds.size > 0 && (
                <SelectionActionBar
                    count={selectedAssetIds.size}
                    onDuplicate={handleDuplicateSelectedAssets}
                    onDelete={handleDeleteSelectedAssets}
                    onClear={handleClearSelection}
                />
            )}
            <BottomNavBar activeView={activeView} onNavigate={setActiveView} />
        </div>
    );
};


const App: React.FC = () => {
    return (
        <ThemeProvider>
            <AuthProvider>
                <CurrencyProvider>
                    <LanguageProvider>
                        <AuthContext.Consumer>
                            {({ currentUser, logout }) => {
                                if (currentUser) {
                                    return <MainApp onLogout={logout} />;
                                }
                                return <AuthPage />;
                            }}
                        </AuthContext.Consumer>
                    </LanguageProvider>
                </CurrencyProvider>
            </AuthProvider>
        </ThemeProvider>
    );
};

export default App;
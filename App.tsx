import React, { useState, useContext, useMemo, useEffect, useCallback, useRef } from 'react';
import { AuthProvider } from './context/AuthContext';
import Dashboard from './Dashboard';
import { ThemeProvider } from './context/ThemeContext';
import SideNavBar from './components/SideNavBar';
import AuthPage from './components/AuthPage';
import { AuthContext } from './context/AuthContext';
import AccountView from './components/AccountView';
import DeclaracaoAnualView from './components/DeclaracaoAnualView';
import IrMensalView from './components/IrMensalView';
import AssetModal from './components/AssetModal';
import AiInsightsModal from './components/AiInsightsModal';
import AiOptimizationModal from './components/AiOptimizationModal';
import NotificationBanner from './components/NotificationBanner';
import { Asset, AiAnalysis, AiOptimizationAnalysis, PortfolioSuggestion, UserProfile, Notification } from './types';
// FIX: Corrected typo in constant name from INITIAL_PORTFOLFOLIO_DATA to INITIAL_PORTFOLIO_DATA.
import { INITIAL_PORTFOLIO_DATA, IR_INFO_DATA } from './constants';
import { getPortfolioAnalysis, getPortfolioOptimization } from './services/geminiService';
import { supabase } from './services/supabaseClient';
import { useDebounce } from './hooks/useDebounce';
import CarteiraView from './components/CarteiraView';
import IaView from './components/IaView';
import NoticiasView from './components/NoticiasView';

const MainApp: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
    // === State lifted from Dashboard ===
    const { currentUser } = useContext(AuthContext);
    const [portfolioData, setPortfolioData] = useState<Asset[]>([]);
    const [isDataLoaded, setIsDataLoaded] = useState(false);
    
    // Modals state
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

    // === Core App State ===
    const [activeView, setActiveView] = useState('dashboard');
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [activeNotifications, setActiveNotifications] = useState<Notification[]>([]);
    const triggeredAlertsRef = useRef<Set<number>>(new Set());

    // === Data Fetching and Persistence (lifted from Dashboard) ===
    const loadUserData = useCallback(async () => {
        try {
            if (!currentUser) {
// FIX: Corrected typo in constant name from INITIAL_PORTFOLFOLIO_DATA to INITIAL_PORTFOLIO_DATA.
                setPortfolioData(INITIAL_PORTFOLIO_DATA);
                return;
            }
            const { data, error } = await supabase.from('profiles').select('portfolio_data').eq('id', currentUser.id).single();
            if (error && error.code !== 'PGRST116') throw error;
// FIX: Corrected typo in constant name from INITIAL_PORTFOLFOLIO_DATA to INITIAL_PORTFOLIO_DATA.
            setPortfolioData(data?.portfolio_data || INITIAL_PORTFOLIO_DATA);
        } catch (error) {
            console.error("Erro ao carregar dados do usuário:", error);
// FIX: Corrected typo in constant name from INITIAL_PORTFOLFOLIO_DATA to INITIAL_PORTFOLIO_DATA.
            setPortfolioData(INITIAL_PORTFOLIO_DATA);
        } finally {
            setIsDataLoaded(true);
        }
    }, [currentUser]);
    
    const saveUserData = useCallback(async (portfolio_data: Asset[]) => {
        if (!currentUser) return;
        try {
            const { error } = await supabase.from('profiles').update({ portfolio_data }).eq('id', currentUser.id);
            if (error) throw error;
        } catch (error) {
            console.error("Erro ao salvar dados do usuário:", error);
        }
    }, [currentUser]);

    const debouncedPortfolioData = useDebounce(portfolioData, 2000);

    useEffect(() => { loadUserData(); }, [loadUserData]);
    
    useEffect(() => {
        if (isDataLoaded && debouncedPortfolioData.length > 0) {
            saveUserData(debouncedPortfolioData);
        }
    }, [debouncedPortfolioData, isDataLoaded, saveUserData]);
    
    const formatCurrency = (val: number) => `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

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
                        message = `${asset.ticker} atingiu seu alerta superior de ${formatCurrency(asset.alertPriceSuperior)}.`;
                    } else if (asset.alertPriceInferior && asset.cotacaoAtual <= asset.alertPriceInferior) {
                        message = `${asset.ticker} atingiu seu alerta inferior de ${formatCurrency(asset.alertPriceInferior)}.`;
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


    // === Handlers (lifted from Dashboard) ===
    const handleSaveAsset = (assetData: Omit<Asset, 'id' | 'historicoPreco' | 'cotacaoAtual' | 'cotacaoBase'> & { id?: number }) => {
        const newAssetData: Asset = {
            ...assetData,
            id: assetData.id ?? Date.now(),
            historicoPreco: editingAsset?.historicoPreco || Array(7).fill(assetData.precoCompra),
            cotacaoBase: editingAsset?.cotacaoBase || assetData.precoCompra,
            cotacaoAtual: editingAsset?.cotacaoAtual || assetData.precoCompra
        };

        if (editingAsset) {
            setPortfolioData(portfolioData.map(a => a.id === newAssetData.id ? newAssetData : a));
        } else {
            setPortfolioData([...portfolioData, newAssetData]);
        }
        setIsAssetModalOpen(false);
        setEditingAsset(null);
    };

    const handleEditAsset = (asset: Asset) => {
        setEditingAsset(asset);
        setIsAssetModalOpen(true);
    };

    const handleDeleteAsset = (id: number) => {
        if (window.confirm("Tem certeza que deseja excluir este ativo?")) {
            setPortfolioData(portfolioData.filter(a => a.id !== id));
        }
    };

    const handleDuplicateAsset = (id: number) => {
        const assetToDuplicate = portfolioData.find(asset => asset.id === id);
        if (!assetToDuplicate) return;

        const newAsset: Asset = {
            ...assetToDuplicate,
            id: Date.now(),
        };
        
        const originalIndex = portfolioData.findIndex(asset => asset.id === id);
        if (originalIndex === -1) return;

        const updatedPortfolio = [...portfolioData];
        updatedPortfolio.splice(originalIndex + 1, 0, newAsset);

        setPortfolioData(updatedPortfolio);
    };
    
    const handleToggleAlert = (id: number) => {
        setPortfolioData(portfolioData.map(asset => 
            asset.id === id ? { ...asset, alertActive: !asset.alertActive } : asset
        ));
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
    
    const handleOpenPortfolioOptimization = async () => {
        setIsOptimizationModalOpen(true);
        setIsOptimizing(true);
        setOptimizationError(null);
        try {
            const result = await getPortfolioOptimization(portfolioData);
            setOptimizationAnalysis(result);
        } catch(error) {
            setOptimizationError("Não foi possível obter a otimização da IA. Tente novamente.");
            console.error(error);
        } finally {
            setIsOptimizing(false);
        }
    };
    
    const handleApplyOptimization = (suggestions: PortfolioSuggestion[]) => {
        const updatedPortfolio = [...portfolioData];
        suggestions.forEach(s => {
            if (s.action === 'BUY') {
                 const existing = updatedPortfolio.find(a => a.ticker === s.ticker);
                 if(existing) {
                     existing.quantidade += s.quantidade;
                 } else {
                     updatedPortfolio.push({
                         id: Date.now() + Math.random(),
                         ticker: s.ticker,
                         nome: s.nome,
                         categoria: s.categoria,
                         pais: s.pais,
                         quantidade: s.quantidade,
                         precoCompra: s.precoAtual,
                         cotacaoBase: s.precoAtual,
                         cotacaoAtual: s.precoAtual,
                         corretora: 'N/A',
                         riskProfile: 'Moderado',
                         historicoPreco: Array(7).fill(s.precoAtual),
                         dividendYield: 0,
                     });
                 }
            } else if (s.action === 'SELL') {
                const existing = updatedPortfolio.find(a => a.ticker === s.ticker);
                if (existing) {
                    existing.quantidade -= s.quantidade;
                    if (existing.quantidade <= 0) {
                        const index = updatedPortfolio.findIndex(a => a.id === existing.id);
                        if (index > -1) updatedPortfolio.splice(index, 1);
                    }
                }
            }
        });
        setPortfolioData(updatedPortfolio);
        setIsOptimizationModalOpen(false);
    };

    const handleImportAssets = (importedAssets: Asset[]) => {
        setPortfolioData(prev => [...prev, ...importedAssets]);
    };
    
     const handleReorderAssets = (draggedId: number, targetId: number) => {
        const data = [...portfolioData];
        const draggedIndex = data.findIndex(p => p.id === draggedId);
        const targetIndex = data.findIndex(p => p.id === targetId);
        const [draggedItem] = data.splice(draggedIndex, 1);
        data.splice(targetIndex, 0, draggedItem);
        setPortfolioData(data);
    };


    const renderView = () => {
        const viewProps = {
            portfolioData,
            onEditAsset: handleEditAsset,
            onDeleteAsset: handleDeleteAsset,
            onDuplicateAsset: handleDuplicateAsset,
            onToggleAlert: handleToggleAlert,
            onReorderAssets: handleReorderAssets,
        };

        switch (activeView) {
            case 'dashboard':
                return <Dashboard
                    {...viewProps}
                    isDataLoaded={isDataLoaded}
                    onAddAsset={() => { setEditingAsset(null); setIsAssetModalOpen(true); }}
                    onAiAnalysis={handleOpenAiAnalysis}
                    onOptimizePortfolio={handleOpenPortfolioOptimization}
                    onImportPortfolio={handleImportAssets}
                    onLogout={onLogout}
                    onNavigate={setActiveView}
                />;
            case 'carteira':
                return <CarteiraView {...viewProps} />;
            case 'noticias':
                return <NoticiasView portfolioData={portfolioData} />;
            case 'declaracao':
                return <DeclaracaoAnualView portfolioData={portfolioData} irInfo={IR_INFO_DATA} loadingInfo={!isDataLoaded} error={null} />;
            case 'ir_mensal':
                return <IrMensalView portfolioData={portfolioData} />;
            case 'ia':
                return <IaView onAiAnalysis={handleOpenAiAnalysis} onOptimizePortfolio={handleOpenPortfolioOptimization} />;
            case 'conta':
                return <AccountView portfolioData={portfolioData}/>;
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
            <main className={`flex-grow transition-all duration-300 ${isSidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
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
            <NotificationBanner
                notifications={activeNotifications}
                onDismiss={handleDismissNotification}
            />
        </div>
    );
};


const App: React.FC = () => {
    return (
        <ThemeProvider>
            <AuthProvider>
                <AuthContext.Consumer>
                    {({ currentUser, logout }) => {
                        if (currentUser) {
                            return <MainApp onLogout={logout} />;
                        }
                        return <AuthPage />;
                    }}
                </AuthContext.Consumer>
            </AuthProvider>
        </ThemeProvider>
    );
};

export default App;
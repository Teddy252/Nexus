import React, { useState, useContext, useMemo, useEffect, useCallback, useRef, lazy, Suspense } from 'react';
import { AuthProvider } from './context/AuthContext.tsx';
import { ThemeProvider } from './context/ThemeContext.tsx';
import { CurrencyProvider } from './context/CurrencyContext.tsx';
import { LanguageProvider } from './context/LanguageContext.tsx';
import SideNavBar from './components/SideNavBar.tsx';
import AuthPage from './components/AuthPage.tsx';
import { AuthContext } from './context/AuthContext.tsx';
import AssetModal from './components/AssetModal.tsx';
import AiInsightsModal from './components/AiInsightsModal.tsx';
import AiOptimizationModal from './components/AiOptimizationModal.tsx';
import SelectionActionBar from './components/SelectionActionBar.tsx';
import { Asset, Provento, AiAnalysis, AiOptimizationAnalysis, PortfolioSuggestion, UserProfile, Notification, OptimizationStrategy, Message } from './types.ts';
import { IR_INFO_DATA } from './constants.ts';
import { getPortfolioAnalysis, getPortfolioOptimization } from './services/geminiService.ts';
import { supabase } from './services/supabaseClient.ts';
import BottomNavBar from './components/BottomNavBar.tsx';
import StrategySelectionModal from './components/StrategySelectionModal.tsx';
import AddAssetChoiceModal from './components/AddAssetChoiceModal.tsx';
import ImportModal from './components/ImportModal.tsx';
import MobileHeader from './components/MobileHeader.tsx';
import { Loader2 } from 'lucide-react';
import AddAssetButton from './components/AddAssetButton.tsx';
import NotificationBanner from './components/NotificationBanner.tsx';

// Lazy load view components
const Dashboard = lazy(() => import('./Dashboard.tsx'));
const CarteiraView = lazy(() => import('./components/CarteiraView.tsx'));
const ProventosView = lazy(() => import('./components/ProventosView.tsx'));
const AnalyticsView = lazy(() => import('./components/AnalyticsView.tsx'));
const NoticiasView = lazy(() => import('./components/NoticiasView.tsx'));
const DeclaracaoAnualView = lazy(() => import('./components/DeclaracaoAnualView.tsx'));
const IrMensalView = lazy(() => import('./components/IrMensalView.tsx'));
const IaView = lazy(() => import('./components/IaView.tsx'));
const NovatosView = lazy(() => import('./components/NovatosView.tsx'));
const NotificacoesView = lazy(() => import('./components/NotificacoesView.tsx'));
const AccountView = lazy(() => import('./components/AccountView.tsx'));

// Taxa de câmbio fixa para conversão de USD para BRL. Usada consistentemente em toda a aplicação.
const USD_BRL_RATE = 5.25;

const swipeableViews = ['dashboard', 'carteira', 'novatos', 'analise', 'ia'];
const viewTitles: { [key: string]: string } = {
    dashboard: 'Dashboard',
    carteira: 'Carteira',
    novatos: 'Primeiros Passos',
    analise: 'Análise',
    ia: 'Assistente AI',
    proventos: 'Proventos',
    noticias: 'Notícias',
    declaracao: 'Declaração Anual',
    ir_mensal: 'IR Mensal',
    notificacoes: 'Notificações',
    conta: 'Minha Conta',
};


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
    moedaCompra: dbAsset.moeda_compra || (dbAsset.categoria === 'Cripto' || dbAsset.pais === 'EUA' ? 'USD' : 'BRL'),
    moedaCotacao: dbAsset.moeda_cotacao || (dbAsset.categoria === 'Cripto' || dbAsset.pais === 'EUA' ? 'USD' : 'BRL'),
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

const mapNotificationFromDb = (dbNotification: any): Notification => ({
    id: dbNotification.id,
    type: dbNotification.type,
    title: dbNotification.title,
    message: dbNotification.message,
    isRead: dbNotification.is_read,
    createdAt: dbNotification.created_at,
    assetId: dbNotification.asset_id,
    user_id: dbNotification.user_id,
});


const LoadingFallback = () => (
    <div className="flex justify-center items-center h-full min-h-[calc(100vh-200px)]">
        <Loader2 className="h-10 w-10 text-sky-500 animate-spin" />
    </div>
);

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
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [bannerNotification, setBannerNotification] = useState<Notification | null>(null);
    const triggeredAlertsRef = useRef<Set<string>>(new Set());
    const [selectedAssetIds, setSelectedAssetIds] = useState<Set<number>>(new Set());
    const [scrollToTicker, setScrollToTicker] = useState<string | null>(null);
    const summaryNotificationTriggered = useRef(false);

    // State for mobile gestures
    const touchStartRef = useRef<{ x: number, y: number } | null>(null);
    const [touchDelta, setTouchDelta] = useState<{ x: number, y: number }>({ x: 0, y: 0 });
    const [isSwiping, setIsSwiping] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);

    const viewsWithAddButton = ['dashboard', 'carteira', 'proventos', 'analise'];

    const loadUserData = useCallback(async (isRefresh = false) => {
        if (!currentUser) return;
        if (isRefresh) setIsRefreshing(true);
        setIsDataLoaded(false);

        try {
            // Fetch Portfolio
            const { data: assetsData, error: assetsError } = await supabase
                .from('ativos')
                .select('*')
                .eq('user_id', currentUser.id)
                .order('order_index');
            if (assetsError) throw assetsError;
            const userPortfolio = assetsData.map(mapAssetFromDb);
            setPortfolioData(userPortfolio);

            // Fetch Proventos
            const assetIds = userPortfolio.map(a => a.id).filter(id => id != null);
            if (assetIds.length > 0) {
                const { data: proventosData, error: proventosError } = await supabase
                    .from('proventos')
                    .select('*')
                    .in('asset_id', assetIds);
                if (proventosError) throw proventosError;
                setProventosData(proventosData.map(mapProventoFromDb));
            } else {
                setProventosData([]);
            }

            // Fetch Notifications
            const { data: notificationsData, error: notificationsError } = await supabase
                .from('notificacoes')
                .select('*')
                .eq('user_id', currentUser.id)
                .order('created_at', { ascending: false });
            if (notificationsError) throw notificationsError;
            setNotifications(notificationsData.map(mapNotificationFromDb));

        } catch (error) {
            console.error("Erro ao carregar dados do usuário:", error);
            setPortfolioData([]);
            setProventosData([]);
            setNotifications([]);
        } finally {
            if (isRefresh) {
                setTimeout(() => setIsRefreshing(false), 500);
            }
            setIsDataLoaded(true);
        }
    }, [currentUser]);


    useEffect(() => { 
        if(currentUser) {
            loadUserData(); 
        }
    }, [currentUser, loadUserData]);
    
    const formatCurrencyBRL = (val: number) => `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const addNotification = useCallback(async (notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'>) => {
        if (!currentUser) return;
    
        const newNotificationPayload: { [key: string]: any } = {
            type: notification.type,
            title: notification.title,
            message: notification.message,
            user_id: currentUser.id,
        };
    
        if (notification.assetId !== undefined) {
            newNotificationPayload.asset_id = notification.assetId;
        }
    
        const { data: inserted, error } = await supabase
            .from('notificacoes')
            .insert([newNotificationPayload])
            .select()
            .single();
            
        if (error) {
            console.error("Error creating notification:", error);
            return;
        }
    
        const newNotification = mapNotificationFromDb(inserted);
        setNotifications(prev => [newNotification, ...prev]);
        setBannerNotification(newNotification);
    
    }, [currentUser]);

    const derivedData = useMemo(() => {
        let patrimonioTotal = 0;
        let totalInvestido = 0;
        let totalGanhos = 0;
        let totalPerdas = 0;
        let proventosAnuaisEstimados = 0;
    
        portfolioData.forEach(asset => {
            const purchaseRate = asset.moedaCompra === 'USD' || asset.moedaCompra === 'USDT' ? USD_BRL_RATE : 1;
            const currentRate = asset.moedaCotacao === 'USD' ? USD_BRL_RATE : 1;

            const custoTotalEmBRL = asset.precoCompra * asset.quantidade * purchaseRate;
            const valorAtualEmBRL = asset.cotacaoAtual * asset.quantidade * currentRate;
            const lucroPrejuizoEmBRL = valorAtualEmBRL - custoTotalEmBRL;
    
            patrimonioTotal += valorAtualEmBRL;
            totalInvestido += custoTotalEmBRL;
            proventosAnuaisEstimados += valorAtualEmBRL * (asset.dividendYield || 0);
    
            if (lucroPrejuizoEmBRL > 0) {
                totalGanhos += lucroPrejuizoEmBRL;
            } else {
                totalPerdas += lucroPrejuizoEmBRL;
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
        const currentTriggeredIds = new Set<string>();
        const assetMap = new Map(portfolioData.map(asset => [asset.id, asset]));

        // --- Price Alert Notifications ---
        portfolioData.forEach(asset => {
            const isTriggered = asset.alertActive && (
                (asset.alertPriceSuperior && asset.cotacaoAtual >= asset.alertPriceSuperior) ||
                (asset.alertPriceInferior && asset.cotacaoAtual <= asset.alertPriceInferior)
            );
            const triggerId = `price_alert_${asset.id}`;

            if (isTriggered) {
                currentTriggeredIds.add(triggerId);
                if (!triggeredAlertsRef.current.has(triggerId)) {
                    let message = '';
                    if (asset.alertPriceSuperior && asset.cotacaoAtual >= asset.alertPriceSuperior) {
                        message = `${asset.ticker} atingiu seu alerta superior de ${formatCurrencyBRL(asset.alertPriceSuperior)}.`;
                    } else if (asset.alertPriceInferior && asset.cotacaoAtual <= asset.alertPriceInferior) {
                        message = `${asset.ticker} atingiu seu alerta inferior de ${formatCurrencyBRL(asset.alertPriceInferior)}.`;
                    }
                    if (message) {
                        addNotification({
                            type: 'price_alert',
                            title: 'Alerta de Preço Atingido',
                            message: message,
                            assetId: asset.id,
                        });
                    }
                }
            }
        });

        // --- Upcoming Dividend Notifications ---
        const today = new Date();
        const nextWeek = new Date(today);
        nextWeek.setDate(today.getDate() + 7);
        
        proventosData.forEach(provento => {
            const proventoDate = new Date(provento.date + 'T00:00:00');
            const triggerId = `provento_${provento.id}`;
            const asset = assetMap.get(provento.assetId);

            if (asset && proventoDate >= today && proventoDate <= nextWeek) {
                currentTriggeredIds.add(triggerId);
                 if (!triggeredAlertsRef.current.has(triggerId)) {
                    addNotification({
                        type: 'dividend_payment',
                        title: 'Próximo Provento',
                        message: `Você receberá proventos de ${asset.ticker} em ${proventoDate.toLocaleDateString('pt-BR')}.`,
                        assetId: asset.id,
                    });
                }
            }
        });

        // --- Weekly Portfolio Summary Notification (Demo) ---
        const portfolioValue = derivedData.patrimonioTotal;
        const triggerId = 'portfolio_summary';
        if (portfolioValue > 0 && !summaryNotificationTriggered.current) {
            currentTriggeredIds.add(triggerId);
            if (!triggeredAlertsRef.current.has(triggerId)) {
                addNotification({
                    type: 'system_message',
                    title: 'Resumo da Carteira',
                    message: `Seu patrimônio total é de ${formatCurrencyBRL(portfolioValue)}. Que tal uma análise da IA?`
                });
                summaryNotificationTriggered.current = true; // Ensure it only fires once per session
            }
        }


        triggeredAlertsRef.current = currentTriggeredIds;

    }, [portfolioData, proventosData, addNotification, derivedData.patrimonioTotal]);

    const handleMarkAsRead = async (id: string) => {
        if (!currentUser) return;
        const { error } = await supabase.from('notificacoes').update({ is_read: true }).eq('id', id).eq('user_id', currentUser.id);
        if (error) console.error("Error marking as read:", error);
        else setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    };

    const handleMarkAllAsRead = async () => {
        if (!currentUser) return;
        const unreadIds = notifications.filter(n => !n.isRead).map(n => n.id);
        if (unreadIds.length === 0) return;
        const { error } = await supabase.from('notificacoes').update({ is_read: true }).in('id', unreadIds).eq('user_id', currentUser.id);
        if (error) console.error("Error marking all as read:", error);
        else setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    };
    
    const handleClearAllNotifications = async () => {
        if (!currentUser) return;
        const { error } = await supabase.from('notificacoes').delete().eq('user_id', currentUser.id);
        if (error) console.error("Error clearing notifications:", error);
        else setNotifications([]);
    };

    const handleSaveAsset = async (assetData: Omit<Asset, 'id' | 'historicoPreco' | 'cotacaoBase' | 'order_index'> & { id?: number }) => {
        if (!currentUser) return;
    
        const isEditing = editingAsset && assetData.id;
    
        const basePayload = {
            ticker: assetData.ticker,
            nome: assetData.nome,
            pais: assetData.pais,
            categoria: assetData.categoria,
            corretora: assetData.corretora,
            quantidade: assetData.quantidade,
            preco_compra: assetData.precoCompra,
            dividend_yield: assetData.dividendYield,
            risk_profile: assetData.riskProfile,
            moeda_compra: assetData.moedaCompra,
            moeda_cotacao: assetData.moedaCotacao,
            alert_active: assetData.alertActive,
            alert_price_superior: assetData.alertPriceSuperior,
            alert_price_inferior: assetData.alertPriceInferior,
        };
    
        if (isEditing) {
            // For editing, we only update form fields, keeping existing price data.
            const { error } = await supabase
                .from('ativos')
                .update(basePayload)
                .eq('id', editingAsset.id)
                .eq('user_id', currentUser.id);
    
            if (error) { console.error('Error updating asset:', error); return; }
        } else {
            // For a new asset, we use the fetched current price and generate history.
            const cotacaoAtual = assetData.cotacaoAtual || assetData.precoCompra; // Fallback to purchase price if fetch fails
            const maxOrderIndex = portfolioData.reduce((max, asset) => Math.max(asset.order_index, max), -1);
            
            const newAssetPayload = {
                ...basePayload,
                user_id: currentUser.id,
                order_index: maxOrderIndex + 1,
                cotacao_atual: cotacaoAtual,
                cotacao_base: cotacaoAtual, // Base price starts at current price
                historico_preco: [...Array(6).fill(cotacaoAtual), cotacaoAtual] // A simple flat history for now
            };
    
            const { error } = await supabase
                .from('ativos')
                .insert([newAssetPayload]);
            
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
        if (!currentUser) return;
        if (window.confirm("Tem certeza que deseja excluir este ativo?")) {
            const { error } = await supabase.from('ativos').delete().eq('id', id).eq('user_id', currentUser.id);
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
            moeda_compra: assetToDuplicate.moedaCompra,
            moeda_cotacao: assetToDuplicate.moedaCotacao,
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
            .insert([{ ...payload, user_id: currentUser.id, order_index: maxOrderIndex + 1 }]);
        
        if (error) { console.error('Error duplicating asset:', error); return; }
        await loadUserData();
    };
    
    const handleToggleAlert = async (id: number) => {
        if (!currentUser) return;
        const asset = portfolioData.find(a => a.id === id);
        if (!asset) return;

        const { error } = await supabase
            .from('ativos')
            .update({ alert_active: !asset.alertActive })
            .eq('id', id)
            .eq('user_id', currentUser.id);
        
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

        const dbOperations: PromiseLike<any>[] = [];

        suggestions.forEach(s => {
            const existingAsset = portfolioData.find(a => a.ticker === s.ticker);
            
            if (s.action === 'BUY') {
                if (existingAsset) {
                    const newQuantity = existingAsset.quantidade + s.quantidade;
                    dbOperations.push(supabase.from('ativos').update({ quantidade: newQuantity }).eq('id', existingAsset.id));
                } else {
                    const maxOrderIndex = portfolioData.reduce((max, asset) => Math.max(asset.order_index, max), -1) + dbOperations.length;
                    const isUsdBased = s.pais === 'EUA' || s.categoria === 'Cripto';
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
                        moeda_compra: isUsdBased ? 'USD' : 'BRL',
                        moeda_cotacao: isUsdBased ? 'USD' : 'BRL',
                        order_index: maxOrderIndex + 1,
                    };
                    dbOperations.push(supabase.from('ativos').insert([newAssetPayload]));
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
                moeda_compra: asset.moedaCompra,
                moeda_cotacao: asset.moedaCotacao,
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
            await loadUserData();
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
        if (!currentUser) return;
        if (window.confirm(`Tem certeza que deseja excluir ${selectedAssetIds.size} ativos?`)) {
            const idsToDelete = Array.from(selectedAssetIds);
            const { error } = await supabase.from('ativos').delete().in('id', idsToDelete).eq('user_id', currentUser.id);
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
                moeda_compra: asset.moedaCompra,
                moeda_cotacao: asset.moedaCotacao,
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
        const asset = portfolioData.find(a => a.ticker === ticker);
        if (asset) {
            setActiveView('carteira');
            setScrollToTicker(ticker);
        }
    };
    
    const handleNotificationClick = (notification: Notification) => {
        handleMarkAsRead(notification.id);
        if (notification.title === 'Resumo da Carteira') {
            setActiveView('dashboard');
            handleOpenAiAnalysis();
        } else if (notification.assetId) {
            const asset = portfolioData.find(a => a.id === notification.assetId);
            if (asset) {
                handleSelectAssetAndNavigate(asset.ticker);
            }
        }
    };
    
    const handleBannerClick = (notification: Notification) => {
        handleNotificationClick(notification);
        setBannerNotification(null);
    }

    const unreadCount = useMemo(() => notifications.filter(n => !n.isRead).length, [notifications]);

    // Gesture Handlers
    const handleTouchStart = (e: React.TouchEvent) => {
        if (e.touches.length === 1) {
            touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
            setIsSwiping(true);
        }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!touchStartRef.current || e.touches.length !== 1) return;

        const dx = e.touches[0].clientX - touchStartRef.current.x;
        const dy = e.touches[0].clientY - touchStartRef.current.y;

        // Pull to refresh
        if (window.scrollY === 0 && dy > 0 && Math.abs(dx) < Math.abs(dy) && !isRefreshing) {
            const pullDistance = Math.max(0, dy);
            setTouchDelta({ x: 0, y: pullDistance });
            return;
        }

        // Horizontal Swipe
        if (Math.abs(dx) > Math.abs(dy) * 1.5 && swipeableViews.includes(activeView)) {
             if (contentRef.current) {
                contentRef.current.style.overflow = 'hidden';
            }
            setTouchDelta({ x: dx, y: 0 });
        }
    };

    const handleTouchEnd = () => {
        const { x: dx, y: dy } = touchDelta;

        // Pull to refresh logic
        if (dy > 80 && window.scrollY === 0) {
            loadUserData(true);
        }

        // Swipe logic
        if (Math.abs(dx) > 50 && swipeableViews.includes(activeView)) {
            const currentIndex = swipeableViews.indexOf(activeView);
            if (dx < 0 && currentIndex < swipeableViews.length - 1) {
                // Swipe Left
                setActiveView(swipeableViews[currentIndex + 1]);
            } else if (dx > 0 && currentIndex > 0) {
                // Swipe Right
                setActiveView(swipeableViews[currentIndex - 1]);
            }
        }

        if (contentRef.current) {
            contentRef.current.style.overflow = 'auto';
        }
        setTouchDelta({ x: 0, y: 0 });
        touchStartRef.current = null;
        setIsSwiping(false);
    };

    const contentStyle: React.CSSProperties = {
        transform: `translateX(${touchDelta.x}px) translateY(${isRefreshing ? 50 : Math.min(touchDelta.y, 80)}px)`,
        transition: isSwiping ? 'none' : 'transform 0.3s ease',
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
                    onAiAnalysis={handleOpenAiAnalysis}
                    onOptimizePortfolio={() => setIsStrategyModalOpen(true)}
                    onLogout={onLogout}
                    onNavigate={setActiveView}
                    derivedData={derivedData}
                    onSelectAsset={handleSelectAssetAndNavigate}
                    proventosData={proventosData}
                    notifications={notifications}
                    unreadCount={unreadCount}
                    onMarkAsRead={handleMarkAsRead}
                    onMarkAllAsRead={handleMarkAllAsRead}
                    onNotificationClick={handleNotificationClick}
                />;
            case 'carteira':
                return <CarteiraView 
                    {...viewProps}
                    scrollToTicker={scrollToTicker}
                    onScrollComplete={() => setScrollToTicker(null)}
                />;
            case 'proventos':
                return <ProventosView 
                    portfolioData={portfolioData} 
                    proventosData={proventosData} 
                />;
            case 'analise':
                return <AnalyticsView 
                    portfolioData={portfolioData} 
                />;
            case 'noticias':
                return <NoticiasView portfolioData={portfolioData} />;
            case 'declaracao':
                return <DeclaracaoAnualView portfolioData={portfolioData} irInfo={IR_INFO_DATA} loadingInfo={!isDataLoaded} error={null} />;
            case 'ir_mensal':
                return <IrMensalView portfolioData={portfolioData} />;
            case 'ia':
                return <IaView portfolioData={portfolioData} />;
            case 'novatos':
                return <NovatosView onNavigate={setActiveView} />;
            case 'notificacoes':
                 return <NotificacoesView 
                    notifications={notifications}
                    onMarkAsRead={handleMarkAsRead}
                    onMarkAllAsRead={handleMarkAllAsRead}
                    onClearAll={handleClearAllNotifications}
                    onNotificationClick={handleNotificationClick}
                 />;
            case 'conta':
                return <AccountView />;
            default:
                return <div>Página não encontrada</div>;
        }
    };

    return (
        <div className="min-h-screen">
             <MobileHeader
                title={viewTitles[activeView] || 'Nexus'}
                onNavigate={setActiveView}
                unreadCount={unreadCount}
            />
            {bannerNotification && (
                <NotificationBanner 
                    notification={bannerNotification}
                    onClick={() => handleBannerClick(bannerNotification)}
                    onClose={() => setBannerNotification(null)}
                />
            )}
            <SideNavBar 
                activeView={activeView}
                onNavigate={setActiveView}
                isCollapsed={isSidebarCollapsed}
                onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                onLogout={onLogout}
                unreadNotificationsCount={unreadCount}
            />
             <main ref={contentRef} className={`relative flex-grow transition-all duration-300 ${isSidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
                <div 
                    className="absolute -top-4 left-0 right-0 flex justify-center pt-4 transition-opacity duration-300 z-0"
                    style={{ opacity: isRefreshing || touchDelta.y > 0 ? 1 : 0, pointerEvents: 'none' }}
                >
                    <div className="p-2 bg-white dark:bg-slate-800 rounded-full shadow-md">
                        <Loader2 className="h-6 w-6 text-sky-500 animate-spin" />
                    </div>
                </div>
                 <div style={contentStyle} onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
                    <div className="px-4 pt-20 pb-16 md:p-6 lg:p-8">
                        <Suspense fallback={<LoadingFallback />}>
                           {renderView()}
                        </Suspense>
                    </div>
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
            {selectedAssetIds.size > 0 && (
                <SelectionActionBar
                    count={selectedAssetIds.size}
                    onDuplicate={handleDuplicateSelectedAssets}
                    onDelete={handleDeleteSelectedAssets}
                    onClear={handleClearSelection}
                />
            )}
            {viewsWithAddButton.includes(activeView) && (
                <AddAssetButton onClick={() => setIsAddAssetChoiceModalOpen(true)} />
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
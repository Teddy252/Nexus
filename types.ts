import { LucideProps } from "lucide-react";

export interface User {
    username: string;
}

export interface UserProfile {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url?: string;
    // portfolio_data, kpi_config, and dashboard_layout are handled internally and not exposed directly in context
}


export interface Asset {
    id: number;
    ticker: string;
    nome: string;
    categoria: string;
    quantidade: number;
    precoCompra: number;
    cotacaoBase: number;
    cotacaoAtual: number;
    corretora: string;
    pais: string;
    riskProfile: 'Seguro' | 'Moderado' | 'Arriscado';
    historicoPreco: number[];
    dividendYield: number; // Annual yield, e.g., 0.05 for 5%
    moedaCompra: 'BRL' | 'USD' | 'USDT';
    alertActive?: boolean;
    alertPriceSuperior?: number;
    alertPriceInferior?: number;
    order_index: number;
    // Optional fields from Supabase
    user_id?: string;
    created_at?: string;
}

export interface Provento {
    id: number;
    assetId: number; // Foreign key to Asset
    date: string; // YYYY-MM-DD
    value: number; // Gross value received
    type: 'Dividendo' | 'JCP' | 'Rendimento';
}


export interface AiPerformer {
    ticker: string;
    reason: string;
}

export interface AiAnalysis {
    summary: string;
    topPerformers: AiPerformer[];
    worstPerformers: AiPerformer[];
    diversification: {
        byCategory: string;
        byCountry: string;
    };
    riskAnalysis: {
        overallRiskLevel: 'Baixo' | 'Moderado' | 'Alto' | 'Muito Alto';
        riskSummary: string;
        riskFactors: string[];
    };
    suggestions: string[];
    marketSentiment: string;
    futuristicSuggestion: string;
}

export type OptimizationStrategy = 'Conservador' | 'Balanceado' | 'Agressivo';

export interface PortfolioSuggestion {
    action: 'BUY' | 'SELL' | 'KEEP';
    ticker: string;
    nome: string;
    categoria: string;
    pais: string;
    quantidade: number;
    precoAtual: number;
    justificativa: string;
}

export interface AiOptimizationAnalysis {
    strategySummary: string;
    suggestions: PortfolioSuggestion[];
}


export interface ChartDataPoint {
    date: string;
    value: number;
    [key: string]: number | string; // Allow additional properties for benchmarks
}


export interface NewsItem {
    source: string;
    title: string;
    url: string;

    summary: string;
}

export interface KpiConfig {
    id: string;
    title: string;
    icon: React.ComponentType<LucideProps>;
    description: string;
}

export type DashboardWidgetId = 'totalEquity' | 'patrimonialEvolution' | 'statsBar' | 'portfolio' | 'allocation' | 'marketNews';

export interface DashboardWidget {
  id: DashboardWidgetId;
  visible: boolean;
  colSpan: number;
  order: number;
}

export interface SimulatedSale {
    id: number;
    asset: Asset;
    date: string; // YYY-MM-DD
    quantity: number;
    salePrice: number;
    profit: number;
    assetCategory: string; // 'Ações', 'FIIs', 'Cripto', etc.
}

export interface TaxSummary {
    totalSalesAcoes: number;
    totalSalesFiis: number;
    totalSalesCripto: number;
    profitAcoes: number;
    profitFiis: number;
    profitCripto: number;
    taxableProfitAcoes: number;
    taxableProfitFiis: number;
    taxableProfitCripto: number;
    taxDue: number;
}

export interface Notification {
    id: string;
    type: 'price_alert' | 'dividend_payment' | 'system_message';
    title: string;
    message: string;
    isRead: boolean;
    createdAt: string; // ISO Date String
    assetId?: number; // Optional link to an asset
    user_id?: string;
}

export interface Message {
    sender: 'user' | 'ai';
    text: string;
    type?: 'text' | 'analysis' | 'optimization' | 'news';
    data?: any;
    isLoading?: boolean;
}

export type InvestorProfile = 'Conservador' | 'Moderado' | 'Agressivo' | null;

export interface IrInfo {
    group: string;
    code: string;
    description: string;
}
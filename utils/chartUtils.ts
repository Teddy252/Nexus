import { Asset, ChartDataPoint } from '../types';

const formatDate = (date: Date): string => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${day}/${month}`;
};

const formatTick = (date: Date, period: '1M' | '6M' | '1Y' | 'ALL'): string => {
    switch(period){
        case '1M':
            return date.getDate() % 7 === 1 ? formatDate(date) : '';
        case '6M':
        case '1Y':
            return date.getDate() === 1 ? date.toLocaleString('default', { month: 'short' }) : '';
        case 'ALL':
             return date.getMonth() === 0 ? String(date.getFullYear()) : '';
        default:
            return formatDate(date);
    }
}


export const generateHistoricalData = (portfolio: Asset[], period: '1M' | '6M' | '1Y' | 'ALL'): ChartDataPoint[] => {
    if (portfolio.length === 0) return [];
    
    let days: number;
    switch (period) {
        case '1M': days = 30; break;
        case '6M': days = 180; break;
        case '1Y': days = 365; break;
        case 'ALL': days = 365 * 2; break; // Simulate 2 years for "All"
    }

    const today = new Date();
    const data: ChartDataPoint[] = [];
    const currentTotalValue = portfolio.reduce((sum, asset) => sum + asset.cotacaoAtual * asset.quantidade, 0);

    let startValue = currentTotalValue;
    for (let i = 0; i < days; i++) {
        const dailyVolatility = 0.012; 
        const randomFactor = 1 + (Math.random() > 0.5 ? 1 : -1) * Math.random() * dailyVolatility;
        startValue /= randomFactor;
    }
    
    let previousValue = startValue;
    for (let i = days - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        
        let value: number;
        if (i === 0) {
            value = currentTotalValue;
        } else {
            const dailyVolatility = 0.012; 
            const trend = (currentTotalValue - startValue) / days;
            const randomChange = (Math.random() - 0.48) * dailyVolatility * previousValue;
            value = previousValue + trend + randomChange;
        }
        
        data.push({
            date: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
            value: value,
        });
        previousValue = value;
    }

    return data;
};


export const generateAssetPriceHistory = (asset: Asset, period: '1M' | '6M' | '1Y' | 'ALL'): ChartDataPoint[] => {
    let days: number;
    switch (period) {
        case '1M': days = 30; break;
        case '6M': days = 180; break;
        case '1Y': days = 365; break;
        case 'ALL': days = 365 * 2; break;
    }
    
    const today = new Date();
    const data: ChartDataPoint[] = [];
    const currentPrice = asset.cotacaoAtual;
    
    let startPrice = currentPrice;
    for (let i = 0; i < days; i++) {
        const dailyVolatility = 0.02;
        const randomFactor = 1 + (Math.random() > 0.5 ? 1 : -1) * Math.random() * dailyVolatility;
        startPrice /= randomFactor;
    }

    let previousPrice = startPrice;
    for (let i = days - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);

        let price: number;
        if (i === 0) {
            price = currentPrice;
        } else {
            const dailyVolatility = 0.02;
            const trend = (currentPrice - startPrice) / days;
            const randomChange = (Math.random() - 0.49) * dailyVolatility * previousPrice;
            price = previousPrice + trend + randomChange;
        }
        
        data.push({
            date: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
            value: price > 0 ? price : 0,
        });
        previousPrice = price;
    }
    
    return data;
};

const benchmarkProfiles = {
    'IBOVESPA': { volatility: 0.015, trendBias: 0.495 }, // higher volatility, slight negative bias for BR
    'S&P 500': { volatility: 0.011, trendBias: 0.48 }, // standard market, positive bias
    'Nasdaq': { volatility: 0.018, trendBias: 0.475 }, // tech, higher volatility, stronger positive bias
    'CDI': { volatility: 0.0004, trendBias: 0.1 }, // very low volatility, strong positive bias
};

export const generateBenchmarkData = (benchmark: 'IBOV' | 'S&P 500' | 'CDI' | 'IBOVESPA', baseData: ChartDataPoint[]): ChartDataPoint[] => {
    if (baseData.length === 0) return [];
    
    const profileKey = benchmark === 'IBOV' ? 'IBOVESPA' : benchmark;
    const profile = benchmarkProfiles[profileKey as keyof typeof benchmarkProfiles];
    const days = baseData.length;
    const startValue = baseData[0].value;
    const endValue = baseData[baseData.length - 1].value;

    const data: ChartDataPoint[] = [];
    let previousValue = startValue;

    for (let i = 0; i < days; i++) {
         if (i === days - 1) { // Make last point somewhat realistic relative to portfolio
            const finalRandomFactor = 1 + (Math.random() - 0.5) * profile.volatility * 5;
            data.push({ ...baseData[i], value: previousValue * finalRandomFactor });
            continue;
        }

        const trend = (endValue - startValue) / days; // base trend on portfolio
        const randomChange = (Math.random() - profile.trendBias) * profile.volatility * previousValue;
        
        // For CDI, make it a much smoother and predictable line
        let value = benchmark === 'CDI'
            ? previousValue * (1 + 0.12 / 365) // Simulate ~12% p.a.
            : previousValue + trend + randomChange;

        data.push({
            ...baseData[i],
            value,
        });
        previousValue = value;
    }
    return data;
};
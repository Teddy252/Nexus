import { Provento } from '../types';
import { mockPortfolioData } from './mockPortfolioData';

const generateProventos = (): Provento[] => {
    const proventos: Provento[] = [];
    let idCounter = 1;
    const today = new Date();
    const currentYear = today.getFullYear();
    const yearsToGenerate = [currentYear, currentYear - 1, currentYear - 2];

    const dividendPayers = mockPortfolioData.filter(
        asset => (asset.categoria === 'Ações' || asset.categoria === 'Bancos' || asset.categoria === 'FIIs') && asset.dividendYield > 0
    );

    dividendPayers.forEach(asset => {
        const paymentsPerYear = asset.categoria === 'FIIs' ? 12 : Math.floor(Math.random() * 3) + 2; // FIIs pay monthly, stocks pay quarterly/semiannually
        
        yearsToGenerate.forEach(year => {
            for (let i = 0; i < paymentsPerYear; i++) {
                 // Avoid generating future payments
                const maxMonth = year === currentYear ? today.getMonth() : 11;
                const month = Math.floor(Math.random() * (maxMonth + 1));
                const day = Math.floor(Math.random() * 28) + 1;
                
                const paymentDate = new Date(year, month, day);

                // Calculate payment value based on annual yield and number of payments
                const totalValue = asset.precoCompra * asset.quantidade;
                const paymentValue = (totalValue * asset.dividendYield) / paymentsPerYear * (0.8 + Math.random() * 0.4); // Add some randomness

                proventos.push({
                    id: idCounter++,
                    assetId: asset.id,
                    date: paymentDate.toISOString().split('T')[0], // YYYY-MM-DD
                    value: parseFloat(paymentValue.toFixed(2)),
                    type: asset.categoria === 'FIIs' ? 'Rendimento' : (Math.random() > 0.7 ? 'JCP' : 'Dividendo'),
                });
            }
        });
    });

    return proventos.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export const mockProventosData: Provento[] = generateProventos();
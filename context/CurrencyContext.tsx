import React, { createContext, useState, useEffect, ReactNode, useContext } from 'react';

type Currency = 'BRL' | 'USD' | 'EUR';
type Rates = { [key in Currency]: number }; // Rates to convert FROM BRL TO target currency

interface CurrencyContextType {
    selectedCurrency: Currency;
    rates: Rates;
    setCurrency: (currency: Currency) => void;
    convertValue: (brlValue: number) => number;
    formatCurrency: (valueInSelectedCurrency: number) => string;
}

const MOCK_RATES: Rates = {
    BRL: 1,
    USD: 1 / 5.25, // 1 BRL = ~0.19 USD
    EUR: 1 / 5.70, // 1 BRL = ~0.175 EUR
};

const CURRENCY_FORMATTERS: { [key in Currency]: Intl.NumberFormat } = {
    BRL: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }),
    USD: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }),
    EUR: new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }),
};

export const CurrencyContext = createContext<CurrencyContextType>(null!);

export const CurrencyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [selectedCurrency, setSelectedCurrency] = useState<Currency>(() => {
        try {
            const stored = localStorage.getItem('selectedCurrency');
            return (stored && ['BRL', 'USD', 'EUR'].includes(stored)) ? (stored as Currency) : 'BRL';
        } catch (error) {
            console.error("Could not access localStorage. Defaulting to BRL.", error);
            return 'BRL';
        }
    });

    const setCurrency = (currency: Currency) => {
        try {
            localStorage.setItem('selectedCurrency', currency);
        } catch (error) {
            console.error("Could not save currency to localStorage.", error);
        }
        setSelectedCurrency(currency);
    };

    const convertValue = (brlValue: number): number => {
        const rate = MOCK_RATES[selectedCurrency];
        return brlValue * rate;
    };

    const formatCurrency = (valueInSelectedCurrency: number): string => {
        return CURRENCY_FORMATTERS[selectedCurrency].format(valueInSelectedCurrency);
    };
    
    const value = {
        selectedCurrency,
        rates: MOCK_RATES,
        setCurrency,
        convertValue,
        formatCurrency,
    };

    return (
        <CurrencyContext.Provider value={value}>
            {children}
        </CurrencyContext.Provider>
    );
};

export const useCurrency = () => {
    const context = useContext(CurrencyContext);
    if (!context) {
        throw new Error('useCurrency must be used within a CurrencyProvider');
    }
    return context;
};
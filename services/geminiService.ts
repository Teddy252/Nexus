import { GoogleGenAI, Type } from "@google/genai";
import { Asset, AiAnalysis, NewsItem, AiOptimizationAnalysis, SimulatedSale, TaxSummary } from '../types';

if (!process.env.API_KEY) {
    console.warn("API_KEY environment variable not set. AI features will not work.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

const assetDetailsSchema = {
    type: Type.OBJECT,
    properties: {
        nome: { type: Type.STRING, description: "O nome completo oficial do ativo." },
        categoria: { type: Type.STRING, description: "A categoria do ativo. Ex: 'Ações', 'FIIs', 'Cripto', 'Tesouro Direto', 'Bancos'." },
        pais: { type: Type.STRING, description: "O país de origem do ativo. Ex: 'Brasil', 'EUA'." },
    },
    required: ["nome", "categoria", "pais"],
};

export const getAssetDetails = async (ticker: string) => {
    const prompt = `Dado o ticker de ativo financeiro '${ticker}', forneça seu nome completo, categoria e país de origem. Responda em português do Brasil.`;
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: assetDetailsSchema,
        },
    });
    const jsonText = response.text.trim();
    return JSON.parse(jsonText);
};

const brokerageSchema = {
    type: Type.OBJECT,
    properties: {
        brokerages: {
            type: Type.ARRAY,
            description: "Uma lista de nomes de corretoras.",
            items: { type: Type.STRING },
        },
    },
};

export const getBrokerageSuggestions = async (country: string): Promise<string[]> => {
    const prompt = `Liste as 5 corretoras de investimentos mais populares no seguinte país: ${country}. Responda em português do Brasil.`;
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: brokerageSchema,
            },
        });
        const jsonText = response.text.trim();
        const parsed = JSON.parse(jsonText) as { brokerages: string[] };
        return parsed.brokerages || [];
    } catch (error) {
        console.error("Error fetching brokerage suggestions:", error);
        return [];
    }
};

const analysisSchema = {
    type: Type.OBJECT,
    properties: {
        summary: { type: Type.STRING, description: "Um resumo conciso da saúde geral do portfólio, com um tom ligeiramente sarcástico." },
        topPerformers: {
            type: Type.ARRAY,
            description: "Os 3 ativos com melhor desempenho com base no lucro percentual.",
            items: {
                type: Type.OBJECT,
                properties: {
                    ticker: { type: Type.STRING, description: "O ticker do ativo." },
                    reason: { type: Type.STRING, description: "Uma breve e espirituosa explicação do porquê é um dos melhores." },
                },
            },
        },
        worstPerformers: {
            type: Type.ARRAY,
            description: "Os 3 ativos com pior desempenho com base na perda percentual.",
            items: {
                type: Type.OBJECT,
                properties: {
                    ticker: { type: Type.STRING, description: "O ticker do ativo." },
                    reason: { type: Type.STRING, description: "Uma breve e espirituosa explicação do porquê é um dos piores." },
                },
            },
        },
        diversification: {
            type: Type.OBJECT,
            properties: {
                byCategory: { type: Type.STRING, description: "Análise da diversificação por categoria de ativo." },
                byCountry: { type: Type.STRING, description: "Análise da diversificação por país." },
            },
        },
        riskAnalysis: {
            type: Type.OBJECT,
            description: "Análise detalhada do risco do portfólio.",
            properties: {
                overallRiskLevel: { type: Type.STRING, description: "O nível de risco geral da carteira. Valores possíveis: 'Baixo', 'Moderado', 'Alto', 'Muito Alto'." },
                riskSummary: { type: Type.STRING, description: "Um resumo conciso da análise de risco da carteira." },
                riskFactors: {
                    type: Type.ARRAY,
                    description: "Uma lista dos 3 a 5 principais fatores que contribuem para o risco da carteira.",
                    items: { type: Type.STRING }
                },
            },
        },
        suggestions: {
            type: Type.ARRAY,
            description: "Uma lista de sugestões acionáveis e realistas para melhorar o portfólio.",
            items: { type: Type.STRING }
        },
        marketSentiment: { type: Type.STRING, description: "Uma análise do sentimento geral do mercado em relação aos ativos da carteira (otimista, pessimista, neutro) e por quê." },
        futuristicSuggestion: { type: Type.STRING, description: "Uma sugestão de investimento ousada e 'futurista', que pode ser especulativa mas é instigante." },
    },
};


export const getPortfolioAnalysis = async (portfolio: Asset[]): Promise<AiAnalysis> => {
    const simplifiedPortfolio = portfolio.map(({ ticker, nome, categoria, pais, precoCompra, cotacaoAtual, quantidade }) => ({
        ticker,
        nome,
        categoria,
        pais,
        custoTotal: precoCompra * quantidade,
        valorAtual: cotacaoAtual * quantidade,
    }));

    const prompt = `
        Aja como um analista financeiro sarcástico, porém brilhante.
        Analise o seguinte portfólio de investimentos de um investidor brasileiro.
        Sua resposta deve ser em português do Brasil, com um tom espirituoso, direto e inteligente.
        
        Forneça uma análise detalhada focando em:
        1.  Um resumo geral da saúde e composição do portfólio.
        2.  Os 3 ativos com melhor e pior desempenho percentual (não se segure nos comentários).
        3.  A qualidade da diversificação (ou falta dela) por categoria e geografia.
        4.  Análise de Risco: Avalie o risco geral da carteira (nível: 'Baixo', 'Moderado', 'Alto', 'Muito Alto'), forneça um resumo conciso e liste os principais fatores de risco (ex: concentração em um setor, volatilidade de criptoativos, exposição a uma única moeda).
        5.  Sugestões de melhoria (seja útil, apesar do sarcasmo).
        6.  Sentimento do mercado em relação aos ativos da carteira.
        7.  Uma sugestão de investimento "futurista" e ousada.

        Dados do Portfólio para sua análise cética:
        ${JSON.stringify(simplifiedPortfolio, null, 2)}
    `;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: analysisSchema,
        },
    });

    const jsonText = response.text.trim();
    return JSON.parse(jsonText) as AiAnalysis;
};

const optimizationSchema = {
    type: Type.OBJECT,
    properties: {
        strategySummary: { type: Type.STRING, description: 'Um resumo conciso e inteligente da estratégia de otimização proposta para um perfil de crescimento balanceado.' },
        suggestions: {
            type: Type.ARRAY,
            description: "Uma lista de ações (comprar, vender, manter) para otimizar o portfólio.",
            items: {
                type: Type.OBJECT,
                properties: {
                    action: { type: Type.STRING, description: "A ação a ser tomada: 'BUY', 'SELL' ou 'KEEP'." },
                    ticker: { type: Type.STRING, description: "O ticker do ativo." },
                    nome: { type: Type.STRING, description: "Nome completo do ativo. Essencial, especialmente se for um novo ativo." },
                    categoria: { type: Type.STRING, description: "Categoria do ativo (ex: Ações, FIIs, Cripto). Essencial se for um novo ativo." },
                    pais: { type: Type.STRING, description: "País de origem do ativo (ex: Brasil, EUA). Essencial se for um novo ativo." },
                    quantidade: { type: Type.NUMBER, description: "A quantidade a ser comprada, vendida ou mantida." },
                    precoAtual: { type: Type.NUMBER, description: "O preço de mercado atual aproximado do ativo. Essencial para novas compras." },
                    justificativa: { type: Type.STRING, description: "Uma explicação detalhada do porquê desta sugestão." },
                },
                required: ["action", "ticker", "nome", "categoria", "pais", "quantidade", "precoAtual", "justificativa"],
            },
        },
    },
};


export const getPortfolioOptimization = async (portfolio: Asset[]): Promise<AiOptimizationAnalysis> => {
     const simplifiedPortfolio = portfolio.map(({ ticker, nome, categoria, pais, precoCompra, cotacaoAtual, quantidade, riskProfile }) => ({
        ticker,
        nome,
        categoria,
        pais,
        quantidade,
        risco: riskProfile,
        custoTotal: precoCompra * quantidade,
        valorAtual: cotacaoAtual * quantidade,
    }));
    
    const prompt = `
        Aja como um gestor de portfólio experiente e proativo.
        Analise o portfólio de investimentos de um investidor brasileiro e forneça um plano de otimização claro e acionável.
        O objetivo é rebalancear a carteira para um perfil de "crescimento balanceado", melhorando a diversificação e o potencial de retorno sem assumir riscos excessivos.
        
        Sua resposta deve estar em português do Brasil e seguir estritamente o schema JSON.
        
        Para cada ativo no portfólio atual, decida se a ação é MANTER ('KEEP') ou VENDER ('SELL').
        Se for vender, especifique a quantidade a ser vendida (pode ser parcial ou total).
        
        Para melhorar o portfólio, sugira a COMPRA ('BUY') de novos ativos ou o aumento da posição em ativos existentes.
        Para cada sugestão de COMPRA, forneça todos os dados necessários (ticker, nome, categoria, país, quantidade, preço atual).
        
        Cada sugestão, seja de compra, venda ou manutenção, deve ter uma justificativa clara e concisa.
        Finalize com um resumo da estratégia geral.

        Dados do Portfólio Atual:
        ${JSON.stringify(simplifiedPortfolio, null, 2)}
    `;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: optimizationSchema,
        },
    });

    const jsonText = response.text.trim();
    return JSON.parse(jsonText) as AiOptimizationAnalysis;
};


export const getDividendYield = async (ticker: string, country: string): Promise<number> => {
    const prompt = `Qual é o dividend yield anual para o ativo '${ticker}' do país '${country}'? Responda APENAS com o número percentual (ex: 5.42). Se não for aplicável ou não encontrar, responda '0'.`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });

        const textResponse = response.text.trim().replace(',', '.');
        const yieldValue = parseFloat(textResponse);
        
        return isNaN(yieldValue) ? 0 : yieldValue;
    } catch (error) {
        console.error("Error fetching dividend yield:", error);
        return 0;
    }
};

const newsSchema = {
    type: Type.OBJECT,
    properties: {
        news: {
            type: Type.ARRAY,
            description: "Uma lista de 5 a 10 notícias de mercado recentes e relevantes.",
            items: {
                type: Type.OBJECT,
                properties: {
                    source: { type: Type.STRING, description: "A fonte da notícia (ex: 'Bloomberg', 'InfoMoney')." },
                    title: { type: Type.STRING, description: "O título da notícia." },
                    url: { type: Type.STRING, description: "A URL para o artigo completo." },
                    summary: { type: Type.STRING, description: "Um resumo muito breve (1-2 frases) da notícia." },
                },
            },
        },
    },
};

export const getRelevantNews = async (query: string): Promise<NewsItem[]> => {
    const prompt = `
        Aja como um curador de notícias financeiras.
        Encontre de 5 a 10 das notícias mais recentes e relevantes (últimas 48 horas) sobre o seguinte tópico ou ativos: "${query}".
        Priorize notícias sobre desempenho de mercado, anúncios de empresas, mudanças regulatórias ou tendências do setor.
        Forneça a fonte, o título, um link válido e um resumo muito breve para cada notícia.
        Sua resposta deve ser em português do Brasil.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: newsSchema,
            },
        });

        const jsonText = response.text.trim();
        const parsed = JSON.parse(jsonText) as { news: NewsItem[] };
        return parsed.news || [];
    } catch (error) {
        console.error("Error fetching relevant news:", error);
        // Propagate the original error for specific handling in the UI
        throw error;
    }
};


const assetExtractionSchema = {
    type: Type.OBJECT,
    properties: {
        assets: {
            type: Type.ARRAY,
            description: "Uma lista de ativos financeiros extraídos do arquivo.",
            items: {
                type: Type.OBJECT,
                properties: {
                    ticker: { type: Type.STRING, description: "O código (ticker) do ativo." },
                    quantidade: { type: Type.NUMBER, description: "A quantidade de cotas/unidades do ativo." },
                    precoCompra: { type: Type.NUMBER, description: "O preço médio de compra por unidade do ativo." },
                    nome: { type: Type.STRING, description: "O nome completo do ativo, se disponível." },
                    categoria: { type: Type.STRING, description: "A categoria do ativo (ex: Ações, FIIs), se disponível." },
                    corretora: { type: Type.STRING, description: "A corretora onde o ativo está custodiado, se disponível." },
                    pais: { type: Type.STRING, description: "O país de origem do ativo, se disponível." },
                },
                required: ["ticker", "quantidade", "precoCompra"],
            },
        },
    },
     required: ["assets"],
};


export const extractAssetsFromFileContent = async (fileContent: string): Promise<Partial<Asset>[]> => {
    const prompt = `
        Aja como um assistente inteligente de importação de dados financeiros.
        Analise o conteúdo do arquivo de portfólio de um usuário fornecido abaixo. O conteúdo pode ser um CSV ou um JSON.
        Sua tarefa é identificar e extrair a lista de ativos financeiros.

        Instruções:
        1.  Identifique as colunas que representam o código do ativo (ticker), a quantidade e o preço de compra. Os nomes das colunas podem variar (ex: 'Ativo', 'Código', 'qtd', 'Preço Médio', 'pm'). Use sua inteligência para mapeá-los corretamente.
        2.  Extraia cada linha como um ativo individual.
        3.  Para cada ativo, forneça o 'ticker', 'quantidade' e 'precoCompra'. A quantidade e o preço de compra devem ser números.
        4.  Se possível, identifique e extraia também as colunas 'nome', 'categoria', 'corretora' e 'pais'. Se não encontrar, não inclua esses campos.
        5.  Ignore linhas de resumo, totais, ou linhas em branco que não representem um ativo.
        6.  Retorne os dados como um objeto JSON que segue estritamente o schema fornecido.

        Conteúdo do Arquivo para Análise:
        \`\`\`
        ${fileContent}
        \`\`\`
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: assetExtractionSchema,
            },
        });

        const jsonText = response.text.trim();
        const parsed = JSON.parse(jsonText) as { assets: Partial<Asset>[] };
        return parsed.assets || [];
    } catch (error) {
        console.error("Error extracting assets with AI:", error);
        throw new Error("A IA não conseguiu analisar o arquivo. Verifique se o formato é simples e contém colunas claras como 'ticker', 'quantidade' e 'precoCompra'.");
    }
};


export const generateAppIcon = async (prompt: string): Promise<string> => {
    try {
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: prompt,
            config: {
              numberOfImages: 1,
              outputMimeType: 'image/png',
              aspectRatio: '1:1',
            },
        });

        if (response.generatedImages && response.generatedImages.length > 0) {
            const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
            return `data:image/png;base64,${base64ImageBytes}`;
        } else {
            throw new Error("A IA não conseguiu gerar uma imagem.");
        }
    } catch (error) {
        console.error("Error generating image with AI:", error);
        throw new Error("Ocorreu um erro ao gerar o ícone. Verifique sua chave de API ou tente novamente mais tarde.");
    }
};

const taxExplanationSchema = {
    type: Type.OBJECT,
    properties: {
        explanation: { 
            type: Type.STRING, 
            description: "Uma explicação clara e concisa do cálculo do imposto de renda mensal sobre ganhos de capital para um investidor pessoa física no Brasil. Use markdown para formatação (negrito, listas)."
        },
    },
    required: ["explanation"],
};

export const getTaxExplanation = async (summary: TaxSummary, sales: SimulatedSale[]): Promise<string> => {
    const simplifiedSales = sales.map(s => ({
        ticker: s.asset.ticker,
        categoria: s.asset.categoria,
        quantidade: s.quantity,
        preco_venda_unitario: s.salePrice,
        lucro_total_operacao: s.profit,
    }));

    const prompt = `
        Aja como um contador especialista em imposto de renda para investidores no Brasil.
        Analise o resumo de vendas e impostos de um investidor para um determinado mês e forneça uma explicação clara e didática.
        Sua resposta deve ser em português do Brasil e usar markdown para formatação (negrito para ênfase, listas para detalhamento).
        
        A explicação deve cobrir os seguintes pontos:
        1.  Um resumo do imposto total devido.
        2.  Detalhar o cálculo para cada categoria de ativo (Ações, FIIs, Cripto).
        3.  Mencionar as regras de isenção e se foram aplicadas. Limite de isenção para Ações é de R$ 20.000,00 em vendas no mês (se o lucro for positivo). Limite para Cripto é de R$ 35.000,00. FIIs não têm isenção.
        4.  Explicar as alíquotas de imposto aplicadas (15% para Ações e Cripto sobre o lucro tributável, 20% para FIIs).
        5.  Concluir com uma observação sobre a importância de pagar o DARF até o último dia útil do mês seguinte.

        **Dados para Análise:**

        **Resumo do Mês:**
        - Imposto Total a Pagar: ${summary.taxDue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        - Total de Vendas em Ações: ${summary.totalSalesAcoes.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        - Total de Vendas em FIIs: ${summary.totalSalesFiis.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        - Total de Vendas em Cripto: ${summary.totalSalesCripto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        - Lucro Tributável em Ações: ${summary.taxableProfitAcoes.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        - Lucro Tributável em FIIs: ${summary.taxableProfitFiis.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        - Lucro Tributável em Cripto: ${summary.taxableProfitCripto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}

        **Detalhes das Vendas:**
        ${JSON.stringify(simplifiedSales, null, 2)}
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: taxExplanationSchema,
            },
        });

        const jsonText = response.text.trim();
        const parsed = JSON.parse(jsonText) as { explanation: string };
        return parsed.explanation;
    } catch (error) {
        console.error("Error fetching tax explanation from AI:", error);
        throw new Error("A IA não conseguiu gerar a análise tributária. Tente novamente.");
    }
};
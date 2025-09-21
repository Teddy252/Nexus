import { Asset } from './types';

// A constante INITIAL_PORTFOLIO_DATA foi removida, pois a carteira de um novo usuário
// agora é gerenciada pela tabela 'ativos' e começa vazia.
// O código legado que a utilizava foi atualizado.

interface IrInfo {
    group: string;
    code: string;
    description: string;
}

export const IR_INFO_DATA: Record<string, IrInfo> = {
    'Ações': {
        group: '03 - Participações Societárias',
        code: '01 - Ações',
        description: '[QUANTIDADE] ações de [NOME_EMPRESA], ticker [TICKER], custodiadas na corretora [CORRETORA], ao custo total de [CUSTO_TOTAL].'
    },
    'Bancos': {
        group: '03 - Participações Societárias',
        code: '01 - Ações',
        description: '[QUANTIDADE] ações de [NOME_EMPRESA], ticker [TICKER], custodiadas na corretora [CORRETORA], ao custo total de [CUSTO_TOTAL].'
    },
    'FIIs': {
        group: '07 - Fundos',
        code: '03 - Fundos de Investimento Imobiliário (FIIs)',
        description: '[QUANTIDADE] cotas do FII [NOME_EMPRESA], ticker [TICKER], custodiadas na corretora [CORRETORA], ao custo total de [CUSTO_TOTAL].'
    },
    'Cripto': {
        group: '08 - Criptoativos',
        code: '01 - Criptoativo Bitcoin (BTC)',
        description: 'Posse de [QUANTIDADE] da criptomoeda [NOME_EMPRESA] ([TICKER]), custodiada na exchange [CORRETORA], ao valor de aquisição de [CUSTO_TOTAL].'
    },
    'Tesouro Direto': {
        group: '04 - Aplicações e Investimentos',
        code: '02 - Títulos públicos e privados sujeitos à tributação',
        description: '[QUANTIDADE] títulos de [NOME_EMPRESA] ([TICKER]), custodiados no [CORRETORA], ao custo total de [CUSTO_TOTAL].'
    }
};
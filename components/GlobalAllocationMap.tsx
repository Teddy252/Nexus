import React, { useState, useMemo } from 'react';
import { ComposableMap, Geographies, Geography, ZoomableGroup, Sphere, Graticule } from 'react-simple-maps';
import { Asset } from '../types';
import { useCurrency } from '../context/CurrencyContext';

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

interface TooltipContent {
    x: number;
    y: number;
    name: string;
    value: string;
    percentage: string;
}

interface GlobalAllocationMapProps {
    portfolioData: Asset[];
}

const lerpColor = (a: string, b: string, amount: number): string => {
    const ah = parseInt(a.replace(/#/g, ''), 16);
    const ar = ah >> 16, ag = ah >> 8 & 0xff, ab = ah & 0xff;
    const bh = parseInt(b.replace(/#/g, ''), 16);
    const br = bh >> 16, bg = bh >> 8 & 0xff, bb = bh & 0xff;
    const rr = Math.round(ar + amount * (br - ar));
    const rg = Math.round(ag + amount * (bg - ag));
    const rb = Math.round(ab + amount * (bb - ab));
    return '#' + ((1 << 24) + (rr << 16) + (rg << 8) + rb | 0).toString(16).slice(1);
};

const GlobalAllocationMap: React.FC<GlobalAllocationMapProps> = ({ portfolioData }) => {
    const [tooltipContent, setTooltipContent] = useState<TooltipContent | null>(null);
    const { formatCurrency, convertValue } = useCurrency();
    const USD_BRL_RATE = 5.25;

    const countryNameMap = (name: string): string => {
        if (name === 'Brasil') return 'Brazil';
        if (name === 'EUA') return 'United States of America';
        return name;
    };

    const { dataByCountry, totalValue, maxValue } = useMemo(() => {
        const data = new Map<string, number>();
        let total = 0;
        portfolioData.forEach(asset => {
            if (asset.pais === 'Global') return; // Ignore 'Global' assets like crypto for map
            const currentRate = asset.moedaCotacao === 'USD' ? USD_BRL_RATE : 1;
            const value = asset.cotacaoAtual * asset.quantidade * currentRate;
            const country = countryNameMap(asset.pais);
            data.set(country, (data.get(country) || 0) + value);
            total += value;
        });
        
        const max = data.size > 0 ? Math.max(...Array.from(data.values())) : 0;

        return { dataByCountry: data, totalValue: total, maxValue: max };
    }, [portfolioData]);
    
    const getColorForValue = (value: number, isDark: boolean) => {
        const baseColor = isDark ? '#334155' : '#e2e8f0'; // slate-700 : slate-200
        if (value === 0 || maxValue === 0) return baseColor;

        const percentage = Math.sqrt(value / maxValue); // Use sqrt for better visual distribution
        const startColor = isDark ? '#38bdf8' : '#7dd3fc'; // sky-400 : sky-300
        const endColor = isDark ? '#0284c7' : '#0369a1'; // sky-600 : sky-700
        
        return lerpColor(startColor, endColor, percentage);
    };

    const handleMouseMove = (geo: any, event: React.MouseEvent<SVGPathElement>) => {
        const countryName = geo.properties.name;
        const value = dataByCountry.get(countryName) || 0;
        
        if (value > 0) {
            setTooltipContent({
                x: event.clientX,
                y: event.clientY,
                name: countryName,
                value: formatCurrency(convertValue(value)),
                percentage: `${((value / totalValue) * 100).toFixed(2)}%`
            });
        } else {
             setTooltipContent(null);
        }
    };
    
    const handleMouseLeave = () => {
        setTooltipContent(null);
    };

    return (
        <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-700 h-full flex flex-col relative overflow-hidden">
             <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">Alocação Geográfica</h2>
            <div className="w-full h-[450px] bg-sky-50 dark:bg-sky-900/20 rounded-lg">
                <ComposableMap
                     style={{ width: "100%", height: "100%" }}
                >
                    <ZoomableGroup center={[0, 20]} zoom={1}>
                        <Sphere stroke="#E4E5E6" strokeWidth={0.5} fill="transparent" />
                        <Graticule stroke="#E4E5E6" strokeWidth={0.5} />
                        <Geographies geography={geoUrl}>
                            {({ geographies }) =>
                                geographies.map((geo) => {
                                    const countryName = geo.properties.name;
                                    const value = dataByCountry.get(countryName) || 0;
                                    
                                    return (
                                        <Geography
                                            key={geo.rsmKey}
                                            geography={geo}
                                            onMouseMove={(e) => handleMouseMove(geo, e)}
                                            onMouseLeave={handleMouseLeave}
                                            style={{
                                                default: {
                                                    fill: getColorForValue(value, document.documentElement.classList.contains('dark')),
                                                    outline: "none",
                                                    stroke: "#FFF",
                                                    strokeWidth: 0.3
                                                },
                                                hover: {
                                                    fill: "#0ea5e9", // sky-500
                                                    outline: "none",
                                                },
                                                pressed: {
                                                    fill: "#0369a1", // sky-700
                                                    outline: "none"
                                                }
                                            }}
                                        />
                                    );
                                })
                            }
                        </Geographies>
                    </ZoomableGroup>
                </ComposableMap>
            </div>
            {tooltipContent && (
                <div 
                    className="absolute bg-slate-900/80 text-white p-2 rounded-md text-sm pointer-events-none transition-opacity animate-fade-in"
                    style={{ 
                        left: tooltipContent.x,
                        top: tooltipContent.y,
                        transform: 'translate(10px, -40px)' // Offset from cursor
                    }}
                >
                    <p className="font-bold">{tooltipContent.name}</p>
                    <p>{tooltipContent.value} ({tooltipContent.percentage})</p>
                </div>
            )}
        </div>
    );
};

export default GlobalAllocationMap;

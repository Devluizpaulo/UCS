
import type { CommodityPriceData } from '@/lib/types';
import { DollarSign, LandPlot, TreePine, Droplets, HelpCircle, Euro, Beef, Wheat, Bean, Sigma, Gem } from 'lucide-react';

export const getIconForCategory = (asset?: CommodityPriceData) => {
    if (!asset) return HelpCircle;
    
    switch (asset.id) {
        case 'ucs': return Gem;
        case 'ucs_ase': return Gem;
        case 'eur': return Euro;
        case 'boi_gordo': return Beef;
        case 'milho': return Wheat;
        case 'soja': return Bean;
        case 'usd': return DollarSign;
        case 'madeira': return TreePine;
        case 'carbono': return Droplets;
        case 'agua': return Droplets;
        case 'custo_agua': return Droplets;
        case 'pdm': return Sigma;
        default:
            switch (asset.category) {
                case 'exchange': return DollarSign;
                case 'vus': return LandPlot;
                case 'vmad': return TreePine;
                case 'crs': return Droplets;
                default: return HelpCircle;
            }
    }
};

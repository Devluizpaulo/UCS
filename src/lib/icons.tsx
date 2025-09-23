
import type { CommodityPriceData } from '@/lib/types';
import { DollarSign, LandPlot, TreePine, Droplets, HelpCircle, Euro, Beef, Wheat, Bean } from 'lucide-react';

export const getIconForCategory = (asset?: CommodityPriceData) => {
    if (!asset) return HelpCircle;
    
    switch (asset.id) {
        case 'eur': return Euro;
        case 'boi_gordo': return Beef;
        case 'milho': return Wheat;
        case 'soja': return Bean;
        case 'usd': return DollarSign;
        case 'madeira': return TreePine;
        case 'carbono': return Droplets;
        case 'agua': return Droplets;
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



import type { CommodityPriceData } from '@/lib/types';
import {
  DollarSign,
  LandPlot,
  TreePine,
  Droplets,
  HelpCircle,
  Euro,
  Beef,
  Wheat,
  Bean,
  Leaf,
  Shield,
  Award,
  Users,
  PieChart,
} from 'lucide-react';

export const getIconForCategory = (asset?: CommodityPriceData) => {
    if (!asset) return HelpCircle;
    
    switch (asset.id) {
        case 'ucs_ase': return Award;
        case 'ucs': return Shield;
        case 'pdm': return Leaf;
        case 'eur': return Euro;
        case 'boi_gordo': return Beef;
        case 'milho': return Wheat;
        case 'soja': return Bean;
        case 'usd': return DollarSign;
        case 'madeira': return TreePine;
        case 'carbono': return Droplets;
        case 'ch2o_agua': return Droplets;
        case 'custo_agua': return Droplets;
        default:
            switch (asset.category) {
                case 'index': return Award;
                case 'exchange': return DollarSign;
                case 'vus': return LandPlot;
                case 'vmad': return TreePine;
                case 'crs': return Droplets;
                default: return HelpCircle;
            }
    }
};

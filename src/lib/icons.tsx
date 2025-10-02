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
  Network,
  Recycle,
  Combine,
  FileText,
  History,
  TrendingUp,
  TrendingDown,
  Activity,
  Zap,
  Globe,
  Mountain,
  Factory,
  Coins,
  BarChart3,
  Calculator,
  Database,
  Layers,
  Target,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
import { memo } from 'react';

// --- TYPES ---
type AssetId = string;
type Category = string;
type IconComponent = LucideIcon;

interface IconMapping {
  byId: Record<AssetId, IconComponent>;
  byCategory: Record<Category, IconComponent>;
  fallback: IconComponent;
}

// --- ICON MAPPINGS ---
const ICON_MAPPINGS: IconMapping = {
  // Mapeamento específico por ID de ativo
  byId: {
    // Índices principais
    'ucs_ase': Award,
    'ucs': Shield,
    'pdm': Leaf,
    'vus': Combine,
    'vmad': TreePine,
    
    // Moedas
    'usd': DollarSign,
    'eur': Euro,
    
    // Commodities agrícolas
    'milho': Wheat,
    'soja': Bean,
    'boi_gordo': Beef,
    
    // Materiais e recursos
    'madeira': TreePine,
    'carbono': Recycle,
    'carbono_crs': Recycle,
    
    // Água e recursos hídricos
    'ch2o_agua': Droplets,
    'custo_agua': Droplets,
    'Agua_CRS': Droplets,
    
    // Outros
    'valor_uso_solo': LandPlot,
  },
  
  // Mapeamento por categoria
  byCategory: {
    'exchange': DollarSign,
    'agricultural': Combine,
    'material': Recycle,
    'sustainability': Leaf,
    'calculated': Network,
    'credit': Shield,
    'main-index': Award,
    'vus': LandPlot,
    'vmad': TreePine,
    'crs': Shield,
    'index': Award,
    'sub-index': Network,
    'energy': Zap,
    'technology': Activity,
    'environment': Leaf,
    'finance': Coins,
    'infrastructure': Factory,
    'research': BarChart3,
    'climate': Globe,
    'biodiversity': Mountain,
    'water': Droplets,
    'carbon': Recycle,
    'forest': TreePine,
    'soil': LandPlot,
  },
  
  // Ícone padrão
  fallback: HelpCircle,
};

// --- UTILITY FUNCTIONS ---

/**
 * Obtém o ícone apropriado para um ativo baseado em seu ID ou categoria
 */
function getIconForAsset(asset?: CommodityPriceData): IconComponent {
  if (!asset) return ICON_MAPPINGS.fallback;
  
  // 1. Tenta encontrar por ID específico
  const iconById = ICON_MAPPINGS.byId[asset.id];
  if (iconById) return iconById;
  
  // 2. Tenta encontrar por categoria
  const iconByCategory = ICON_MAPPINGS.byCategory[asset.category];
  if (iconByCategory) return iconByCategory;
  
  // 3. Fallback para ícone padrão
  return ICON_MAPPINGS.fallback;
}

/**
 * Obtém ícone para mudança de preço (positiva/negativa)
 */
export function getTrendIcon(change: number): IconComponent {
  if (change > 0) return TrendingUp;
  if (change < 0) return TrendingDown;
  return Activity;
}

/**
 * Obtém ícone para status de dados
 */
export function getStatusIcon(status: 'loading' | 'error' | 'success' | 'warning'): IconComponent {
  switch (status) {
    case 'loading': return Activity;
    case 'error': return HelpCircle;
    case 'success': return Sparkles;
    case 'warning': return Target;
    default: return HelpCircle;
  }
}

/**
 * Obtém ícone para tipo de operação
 */
export function getOperationIcon(operation: 'create' | 'update' | 'delete' | 'view' | 'calculate'): IconComponent {
  switch (operation) {
    case 'create': return Sparkles;
    case 'update': return Activity;
    case 'delete': return Recycle;
    case 'view': return FileText;
    case 'calculate': return Calculator;
    default: return HelpCircle;
  }
}

// --- MAIN EXPORT ---

/**
 * Componente memoizado para ícones de ativos
 * Otimizado para evitar re-renderizações desnecessárias
 */
export const AssetIcon = memo<{ 
  asset?: CommodityPriceData; 
  className?: string; 
  size?: number;
}>(({ asset, className = '', size = 20 }) => {
  const IconComponent = getIconForAsset(asset);
  return <IconComponent className={className} size={size} />;
});

AssetIcon.displayName = 'AssetIcon';

/**
 * Função principal para obter ícone (mantida para compatibilidade)
 * @deprecated Use AssetIcon component instead
 */
export const getIconForCategory = getIconForAsset;

// --- ICON REGISTRY ---

/**
 * Registro de todos os ícones disponíveis para referência
 */
export const ICON_REGISTRY = {
  // Ícones principais
  Award,
  Shield,
  Leaf,
  Combine,
  TreePine,
  
  // Moedas
  DollarSign,
  Euro,
  Coins,
  
  // Commodities
  Wheat,
  Bean,
  Beef,
  
  // Recursos
  Droplets,
  Recycle,
  LandPlot,
  Mountain,
  
  // Interface
  HelpCircle,
  Activity,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Target,
  Calculator,
  BarChart3,
  FileText,
  History,
  PieChart,
  Network,
  Users,
  Zap,
  Globe,
  Factory,
  Database,
  Layers,
} as const;

/**
 * Lista de categorias suportadas
 */
export const SUPPORTED_CATEGORIES = [
  'exchange',
  'agricultural',
  'material',
  'sustainability',
  'calculated',
  'credit',
  'main-index',
  'vus',
  'vmad',
  'crs',
  'index',
  'sub-index',
  'energy',
  'technology',
  'environment',
  'finance',
  'infrastructure',
  'research',
  'climate',
  'biodiversity',
  'water',
  'carbon',
  'forest',
  'soil',
] as const;

/**
 * Lista de IDs de ativos com ícones específicos
 */
export const ASSETS_WITH_SPECIFIC_ICONS = [
  'ucs_ase',
  'ucs',
  'pdm',
  'vus',
  'vmad',
  'usd',
  'eur',
  'milho',
  'soja',
  'boi_gordo',
  'madeira',
  'carbono',
  'carbono_crs',
  'ch2o_agua',
  'custo_agua',
  'Agua_CRS',
  'valor_uso_solo',
] as const;
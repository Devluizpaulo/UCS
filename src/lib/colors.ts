// Cores padronizadas para os componentes do índice
export const COMPONENT_COLORS = {
  vus: '#10B981',        // Green - VUS
  vmad: '#8B4513',       // Brown - VMAD  
  carbono_crs: '#3B82F6', // Blue - Carbono CRS
  agua_crs: '#2563EB',   // Blue - Água CRS
  crs_total: '#1E40AF',  // Blue - CRS Total
} as const;

// Array de cores na ordem correta
export const COLOR_ARRAY = [
  COMPONENT_COLORS.vus,
  COMPONENT_COLORS.vmad,
  COMPONENT_COLORS.crs_total,
] as const;

// Mapeamento de componentes para cores
export const getComponentColor = (componentId: string): string => {
  switch (componentId) {
    case 'vus':
      return COMPONENT_COLORS.vus;
    case 'vmad':
      return COMPONENT_COLORS.vmad;
    case 'carbono_crs':
      return COMPONENT_COLORS.carbono_crs;
    case 'agua_crs':
      return COMPONENT_COLORS.agua_crs;
    case 'crs_total':
      return COMPONENT_COLORS.crs_total;
    default:
      return '#6B7280'; // Gray fallback
  }
};

// Cores para gradientes
export const GRADIENT_COLORS = {
  vus: ['#10B981', '#059669'],      // Green gradient
  vmad: ['#8B4513', '#A0522D'],     // Brown gradient
  carbono_crs: ['#3B82F6', '#2563EB'], // Blue gradient
  agua_crs: ['#2563EB', '#1D4ED8'],   // Blue gradient
  crs_total: ['#1E40AF', '#1E3A8A'],  // Blue gradient
} as const;

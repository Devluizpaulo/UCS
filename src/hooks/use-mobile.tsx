import { useMediaQuery } from './use-media-query';

const MOBILE_BREAKPOINT = 768; // Alterado para corresponder a 'md' em Tailwind

export function useIsMobile() {
  return useMediaQuery(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
}

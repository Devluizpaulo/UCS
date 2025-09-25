
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Cookie } from 'lucide-react';

const COOKIE_CONSENT_KEY = 'cookie_consent_accepted';

export function CookieConsentBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // This effect runs only on the client, where localStorage is available.
    try {
      const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
      if (consent !== 'true') {
        setIsVisible(true);
      }
    } catch (error) {
      console.error('Could not access localStorage:', error);
      // If localStorage is blocked or unavailable, we might want to default to not showing the banner.
      setIsVisible(false);
    }
  }, []);

  const handleAccept = () => {
    try {
      localStorage.setItem(COOKIE_CONSENT_KEY, 'true');
      setIsVisible(false);
    } catch (error) {
       console.error('Could not write to localStorage:', error);
       // Hide the banner even if we can't write to storage.
       setIsVisible(false);
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-secondary text-secondary-foreground shadow-lg animate-in slide-in-from-bottom-full">
      <div className="container mx-auto flex flex-col items-center justify-between gap-4 p-4 sm:flex-row">
        <div className="flex items-start gap-3">
          <Cookie className="h-5 w-5 flex-shrink-0 mt-1" />
          <p className="text-sm">
            Nós utilizamos cookies para melhorar sua experiência de navegação e analisar o tráfego do site. Ao continuar a usar nosso site, você concorda com o uso de cookies.
          </p>
        </div>
        <Button onClick={handleAccept} className="w-full flex-shrink-0 sm:w-auto">
          Aceitar
        </Button>
      </div>
    </div>
  );
}

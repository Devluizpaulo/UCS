
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { BrazilFlag, USFlag, SpainFlag } from './flags';

const languages = [
  { code: 'pt', label: 'Português', Flag: BrazilFlag },
  { code: 'en', label: 'English', Flag: USFlag },
  { code: 'es', label: 'Español', Flag: SpainFlag },
];

export function LanguageSwitcher() {
  // For now, this is just a visual component.
  // In a real i18n setup, this would come from a context or a store.
  const [selectedLanguage, setSelectedLanguage] = useState(languages[0]);

  const CurrentFlag = selectedLanguage.Flag;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <CurrentFlag className="h-5 w-auto" />
          <span className="sr-only">Change language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => setSelectedLanguage(lang)}
            className="flex items-center gap-2"
          >
            <lang.Flag />
            <span>{lang.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

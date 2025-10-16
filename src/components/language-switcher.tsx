

'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { BrazilFlag, USFlag, SpainFlag, RussiaFlag, ChinaFlag } from './flags';
import { useLanguage } from '@/lib/language-context';
import { SupportedLanguage } from '@/lib/i18n';

const languages = [
  { code: 'pt' as SupportedLanguage, label: 'Português', Flag: BrazilFlag },
  { code: 'en' as SupportedLanguage, label: 'English', Flag: USFlag },
  { code: 'es' as SupportedLanguage, label: 'Español', Flag: SpainFlag },
  { code: 'ru' as SupportedLanguage, label: 'Русский', Flag: RussiaFlag },
  { code: 'zh' as SupportedLanguage, label: '中文', Flag: ChinaFlag },
];

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();
  
  const currentLanguage = languages.find(lang => lang.code === language) || languages[0];
  const CurrentFlag = currentLanguage.Flag;

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
            onClick={() => setLanguage(lang.code)}
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

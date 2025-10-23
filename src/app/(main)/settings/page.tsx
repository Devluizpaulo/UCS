
'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Settings as SettingsIcon, Save, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getLandingPageSettings, updateLandingPageSettings, type LandingPageSettings } from '@/lib/settings-actions';
import { languages } from '@/lib/i18n';

// Schema para um único idioma
const titleSchema = z.object({
  title: z.string().min(1, 'O título é obrigatório.'),
  subtitle: z.string().min(1, 'O subtítulo é obrigatório.'),
});

// Schema para todos os idiomas
const landingPageSchema = z.object({
  pt: titleSchema,
  en: titleSchema,
  es: titleSchema,
  ru: titleSchema,
  zh: titleSchema,
});

type LandingPageFormValues = z.infer<typeof landingPageSchema>;

export default function SettingsPage() {
  const { toast } = useToast();
  const form = useForm<LandingPageFormValues>({
    resolver: zodResolver(landingPageSchema),
    defaultValues: {
      pt: { title: '', subtitle: '' },
      en: { title: '', subtitle: '' },
      es: { title: '', subtitle: '' },
      ru: { title: '', subtitle: '' },
      zh: { title: '', subtitle: '' },
    },
  });

  const { isSubmitting } = form.formState;

  useEffect(() => {
    async function loadSettings() {
      const settings = await getLandingPageSettings();
      if (settings) {
        form.reset({
            pt: { title: settings.pt?.title || '', subtitle: settings.pt?.subtitle || '' },
            en: { title: settings.en?.title || '', subtitle: settings.en?.subtitle || '' },
            es: { title: settings.es?.title || '', subtitle: settings.es?.subtitle || '' },
            ru: { title: settings.ru?.title || '', subtitle: settings.ru?.subtitle || '' },
            zh: { title: settings.zh?.title || '', subtitle: settings.zh?.subtitle || '' },
        });
      }
    }
    loadSettings();
  }, [form]);

  const onSubmit = async (values: LandingPageFormValues) => {
    try {
      await updateLandingPageSettings(values);
      toast({
        title: 'Sucesso!',
        description: 'As configurações da página inicial foram salvas.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao Salvar',
        description: 'Não foi possível salvar as configurações. Tente novamente.',
      });
    }
  };

  return (
    <>
      <div className="flex min-h-screen w-full flex-col">
        <PageHeader 
            title="Configurações da Plataforma" 
            description="Gerencie o conteúdo e as preferências da aplicação."
            icon={SettingsIcon}
        />
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle>Conteúdo da Página Inicial</CardTitle>
                  <CardDescription>
                    Edite o título e o subtítulo da seção principal (Hero) em todos os idiomas.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="pt" className="w-full">
                    <TabsList className="grid w-full grid-cols-5">
                      {languages.map(lang => (
                        <TabsTrigger key={lang.code} value={lang.code}>{lang.label}</TabsTrigger>
                      ))}
                    </TabsList>
                    
                    {languages.map(lang => (
                      <TabsContent key={lang.code} value={lang.code} className="mt-6">
                        <div className="space-y-4 rounded-md border p-4">
                          <FormField
                            control={form.control}
                            name={`${lang.code}.title`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Título Principal</FormLabel>
                                <FormControl>
                                  <Input placeholder={`Título em ${lang.label}`} {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`${lang.code}.subtitle`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Subtítulo</FormLabel>
                                <FormControl>
                                  <Textarea placeholder={`Subtítulo em ${lang.label}`} {...field} className="min-h-24"/>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </TabsContent>
                    ))}
                  </Tabs>
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Salvar Alterações
                </Button>
              </div>
            </form>
          </Form>
        </main>
      </div>
    </>
  );
}

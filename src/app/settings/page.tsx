import { MainLayout } from '@/components/main-layout';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function SettingsPage() {
  return (
    <MainLayout>
      <div className="flex min-h-screen w-full flex-col bg-muted/40">
        <PageHeader title="Configurações" />
        <main className="flex min-h-[calc(100vh_-_theme(spacing.16))] flex-1 flex-col gap-4 p-4 md:gap-8 md:p-10">
          <div className="mx-auto grid w-full max-w-6xl gap-2">
            <h1 className="text-3xl font-semibold">Configuração</h1>
          </div>
          <div className="mx-auto grid w-full max-w-6xl items-start gap-6 md:grid-cols-[180px_1fr] lg:grid-cols-[250px_1fr]">
            <nav className="grid gap-4 text-sm text-muted-foreground">
              <a href="#" className="font-semibold text-primary">
                Fontes de Dados
              </a>
              <a href="#">Geral</a>
              <a href="#">Integrações</a>
              <a href="#">Suporte</a>
            </nav>
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Fontes de Dados</CardTitle>
                  <CardDescription>
                    Configure os sites para extração de dados de commodities. Este é um passo crucial para o cálculo do índice em tempo real.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form className="grid gap-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="commodity-1">Commodity</Label>
                            <Input id="commodity-1" defaultValue="Créditos de Carbono" readOnly className="bg-muted/50"/>
                        </div>
                        <div className="grid gap-2 col-span-2">
                            <Label htmlFor="url-1">URL do Site para Extração</Label>
                            <Input id="url-1" placeholder="https://example.com/carbon-price" />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="commodity-2">Commodity</Label>
                            <Input id="commodity-2" defaultValue="Futuros de Água" readOnly className="bg-muted/50"/>
                        </div>
                        <div className="grid gap-2 col-span-2">
                            <Label htmlFor="url-2">URL do Site para Extração</Label>
                            <Input id="url-2" placeholder="https://example.com/water-futures" />
                        </div>
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="commodity-3">Commodity</Label>
                            <Input id="commodity-3" defaultValue="Metais de Terras Raras" readOnly className="bg-muted/50"/>
                        </div>
                        <div className="grid gap-2 col-span-2">
                            <Label htmlFor="url-3">URL do Site para Extração</Label>
                            <Input id="url-3" placeholder="https://example.com/rem-index" />
                        </div>
                    </div>
                  </form>
                </CardContent>
                <CardFooter className="border-t px-6 py-4">
                    <Button>Salvar Configuração</Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </MainLayout>
  );
}

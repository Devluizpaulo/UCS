import { MainLayout } from '@/components/main-layout';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function AlertsPage() {
  return (
    <MainLayout>
      <div className="flex min-h-screen w-full flex-col bg-muted/40">
        <PageHeader title="Alertas" />
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-10">
          <div className="mx-auto w-full max-w-2xl">
            <Card>
              <CardHeader>
                <CardTitle>Configurar Alertas</CardTitle>
                <CardDescription>
                  Receba notificações por e-mail para alterações específicas no índice UCS.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="email">Endereço de E-mail</Label>
                    <Input id="email" type="email" placeholder="voce@exemplo.com" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2 sm:col-span-1">
                      <Label htmlFor="condition">Condição</Label>
                      <Select>
                        <SelectTrigger id="condition">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="above">Sobe Acima de</SelectItem>
                          <SelectItem value="below">Cai Abaixo de</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="threshold">Valor do Índice</Label>
                      <Input id="threshold" type="number" placeholder="ex: 105,50" />
                    </div>
                  </div>
                  <Button className="w-full sm:w-auto" type="submit">Criar Alerta</Button>
                </form>
              </CardContent>
            </Card>

            <div className="mt-8">
                 <h2 className="text-xl font-semibold mb-4">Alertas Ativos</h2>
                 <Card>
                     <CardContent className="p-0">
                         <div className="p-6 flex items-center justify-between border-b">
                             <div>
                                 <p className="font-medium">Notificar quando o índice <span className="font-bold text-destructive">cair abaixo de 98,00</span></p>
                                 <p className="text-sm text-muted-foreground">Enviando para voce@exemplo.com</p>
                             </div>
                             <Button variant="outline" size="sm">Excluir</Button>
                         </div>
                         <div className="p-6 flex items-center justify-between">
                             <div>
                                <p className="font-medium">Notificar quando o índice <span className="font-bold text-primary">subir acima de 110,00</span></p>
                                <p className="text-sm text-muted-foreground">Enviando para voce@exemplo.com</p>
                             </div>
                              <Button variant="outline" size="sm">Excluir</Button>
                         </div>
                     </CardContent>
                 </Card>
            </div>
          </div>
        </main>
      </div>
    </MainLayout>
  );
}

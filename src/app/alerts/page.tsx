'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MainLayout } from '@/components/main-layout';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

const alertSchema = z.object({
  email: z.string().email('Por favor, insira um e-mail válido.'),
  condition: z.enum(['above', 'below'], { required_error: 'Selecione uma condição.' }),
  threshold: z.coerce.number().min(0, 'O valor deve ser positivo.'),
});

type AlertFormData = z.infer<typeof alertSchema>;

type ActiveAlert = AlertFormData & { id: string };

export default function AlertsPage() {
  const [activeAlerts, setActiveAlerts] = useState<ActiveAlert[]>([
    { id: '1', email: 'voce@exemplo.com', condition: 'below', threshold: 5.4000 },
    { id: '2', email: 'voce@exemplo.com', condition: 'above', threshold: 5.6000 },
  ]);
  const { toast } = useToast();

  const { register, handleSubmit, control, formState: { errors }, reset } = useForm<AlertFormData>({
    resolver: zodResolver(alertSchema),
    defaultValues: {
      email: 'voce@exemplo.com'
    }
  });

  const onSubmit = (data: AlertFormData) => {
    const newAlert: ActiveAlert = {
      ...data,
      id: new Date().getTime().toString(),
    };
    setActiveAlerts((prev) => [...prev, newAlert]);
    toast({
      title: 'Alerta Criado',
      description: `Você será notificado quando o índice for ${data.condition === 'above' ? 'maior que' : 'menor que'} ${data.threshold.toFixed(4)}.`,
    });
    reset({ email: data.email, condition: undefined, threshold: undefined });
  };
  
  const deleteAlert = (id: string) => {
    setActiveAlerts((prev) => prev.filter(alert => alert.id !== id));
    toast({
        title: 'Alerta Removido',
        description: 'O alerta foi removido com sucesso.',
    });
  };


  return (
    <MainLayout>
      <div className="flex min-h-screen w-full flex-col">
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
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="email">Endereço de E-mail</Label>
                    <Input id="email" type="email" placeholder="voce@exemplo.com" {...register('email')} />
                    {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2 sm:col-span-1">
                      <Label htmlFor="condition">Condição</Label>
                       <Controller
                          name="condition"
                          control={control}
                          render={({ field }) => (
                            <Select onValueChange={field.onChange} value={field.value}>
                              <SelectTrigger id="condition">
                                <SelectValue placeholder="Selecione" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="above">Sobe Acima de</SelectItem>
                                <SelectItem value="below">Cai Abaixo de</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        />
                      {errors.condition && <p className="text-xs text-destructive">{errors.condition.message}</p>}
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="threshold">Valor do Índice</Label>
                      <Input id="threshold" type="number" step="any" placeholder="ex: 5,4304" {...register('threshold')} />
                      {errors.threshold && <p className="text-xs text-destructive">{errors.threshold.message}</p>}
                    </div>
                  </div>
                  <Button className="w-full sm:w-auto" type="submit">Criar Alerta</Button>
                </form>
              </CardContent>
            </Card>

            <div className="mt-8">
                 <h2 className="text-xl font-semibold mb-4">Alertas Ativos</h2>
                 {activeAlerts.length > 0 ? (
                    <Card>
                        <CardContent className="p-0">
                           {activeAlerts.map((alert, index) => (
                               <div key={alert.id} className={`p-6 flex items-center justify-between ${index < activeAlerts.length -1 ? 'border-b' : '' }`}>
                                   <div>
                                       <p className="font-medium">
                                          Notificar quando o índice {' '}
                                          {alert.condition === 'below' ? 
                                            <span className="font-bold text-destructive">cair abaixo de {alert.threshold.toFixed(4)}</span> :
                                            <span className="font-bold text-primary">subir acima de {alert.threshold.toFixed(4)}</span>
                                          }
                                       </p>
                                       <p className="text-sm text-muted-foreground">Enviando para {alert.email}</p>
                                   </div>
                                   <Button variant="outline" size="sm" onClick={() => deleteAlert(alert.id)}>Excluir</Button>
                               </div>
                           ))}
                        </CardContent>
                    </Card>
                 ) : (
                    <div className="text-center py-10 px-6 border rounded-lg bg-card/50">
                        <p className="text-muted-foreground">Você não possui alertas ativos.</p>
                        <p className="text-sm text-muted-foreground mt-1">Crie um alerta no formulário acima para começar.</p>
                    </div>
                 )}
            </div>
          </div>
        </main>
      </div>
    </MainLayout>
  );
}

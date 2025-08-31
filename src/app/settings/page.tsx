'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MainLayout } from '@/components/main-layout';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getAuth, createUserWithEmailAndPassword, onAuthStateChanged, User } from 'firebase/auth';
import { app, db } from '@/lib/firebase-config';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2 } from 'lucide-react';

const newUserSchema = z.object({
  name: z.string().min(3, 'O nome é obrigatório.'),
  email: z.string().email('Por favor, insira um e-mail válido.'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres.'),
});

type NewUserFormData = z.infer<typeof newUserSchema>;

interface ManagedUser {
  id: string;
  name: string;
  email: string | null;
  createdAt: string;
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingUsers, setIsFetchingUsers] = useState(true);
  const { toast } = useToast();

  const { register, handleSubmit, formState: { errors }, reset } = useForm<NewUserFormData>({
    resolver: zodResolver(newUserSchema),
  });
  
  // NOTE: In a real production app, listing users like this requires an admin backend.
  // This is a simplified implementation for demonstration.
  const fetchUsers = async () => {
    setIsFetchingUsers(true);
    try {
        const querySnapshot = await getDocs(collection(db, "users"));
        const userList = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as ManagedUser));
        setUsers(userList);
    } catch (error) {
        console.error("Error fetching users: ", error);
        toast({
            variant: "destructive",
            title: "Erro ao buscar usuários",
            description: "Não foi possível carregar a lista de usuários.",
        });
    } finally {
        setIsFetchingUsers(false);
    }
  };


  useEffect(() => {
    fetchUsers();
  }, []);

  const onSubmit = async (data: NewUserFormData) => {
    setIsLoading(true);
    const auth = getAuth(app);
    
    try {
        // This creates the user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user;
      
      // Store additional user info in Firestore
      await addDoc(collection(db, 'users'), {
        uid: user.uid,
        name: data.name,
        email: data.email,
        createdAt: new Date().toISOString(),
      });

      toast({
        title: 'Usuário Criado',
        description: `O usuário ${data.name} foi criado com sucesso.`,
      });
      reset();
      fetchUsers(); // Refresh the user list
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao Criar Usuário',
        description: error.code === 'auth/email-already-in-use'
          ? 'Este endereço de e-mail já está em uso.'
          : 'Ocorreu um erro. Por favor, tente novamente.',
      });
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <MainLayout>
      <div className="flex min-h-screen w-full flex-col">
        <PageHeader title="Configurações" />
        <main className="flex min-h-[calc(100vh_-_theme(spacing.16))] flex-1 flex-col gap-4 p-4 md:gap-8 md:p-10">
          <div className="mx-auto grid w-full max-w-6xl items-start gap-6 md:grid-cols-[180px_1fr] lg:grid-cols-[250px_1fr]">
            <nav className="grid gap-4 text-sm text-muted-foreground">
              <a href="#" 
                onClick={() => setActiveTab('users')}
                className={activeTab === 'users' ? "font-semibold text-primary" : ""}>
                Usuários
              </a>
              <a href="#" 
                 onClick={() => setActiveTab('sources')}
                 className={activeTab === 'sources' ? "font-semibold text-primary" : ""}>
                Fontes de Dados
              </a>
            </nav>
            <div className="grid gap-6">
              {activeTab === 'users' && (
                <Card>
                    <CardHeader>
                        <CardTitle>Gerenciamento de Usuários</CardTitle>
                        <CardDescription>
                            Adicione, visualize e gerencie os usuários que têm acesso ao painel.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                               <div className="space-y-2">
                                    <Label htmlFor="name">Nome</Label>
                                    <Input id="name" placeholder="Nome completo" {...register('name')} />
                                    {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">E-mail</Label>
                                    <Input id="email" type="email" placeholder="email@exemplo.com" {...register('email')} />
                                    {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="password">Senha</Label>
                                    <Input id="password" type="password" placeholder="Mínimo 6 caracteres" {...register('password')} />
                                    {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
                                </div>
                            </div>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Criar Usuário
                            </Button>
                        </form>
                    </CardContent>
                    <CardFooter className="flex-col items-start border-t px-6 py-4">
                        <h3 className="mb-4 text-lg font-medium">Usuários Existentes</h3>
                         {isFetchingUsers ? (
                            <div className="w-full text-center p-8">
                                <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
                                <p className="mt-2 text-sm text-muted-foreground">Carregando usuários...</p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nome</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Data de Criação</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {users.map(user => (
                                        <TableRow key={user.id}>
                                            <TableCell>{user.name}</TableCell>
                                            <TableCell>{user.email}</TableCell>
                                            <TableCell>{new Date(user.createdAt).toLocaleDateString('pt-BR')}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardFooter>
                </Card>
              )}
               {activeTab === 'sources' && (
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
              )}
            </div>
          </div>
        </main>
      </div>
    </MainLayout>
  );
}

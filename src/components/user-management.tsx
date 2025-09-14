
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, PlusCircle, Trash2, Edit, Mail, MessageSquare, MoreVertical, User as UserIcon, Phone, Calendar } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';


interface User {
  id: string;
  email?: string;
  displayName?: string;
  phoneNumber?: string;
  createdAt: string;
  isFirstLogin: boolean;
  role: 'admin' | 'user';
  isActive: boolean;
}

const userSchema = z.object({
  email: z.string().email('E-mail inválido'),
  displayName: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  phoneNumber: z.string().optional(),
  role: z.enum(['admin', 'user']),
  isActive: z.boolean(),
});

type UserFormData = z.infer<typeof userSchema>;

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [generatedPassword, setGeneratedPassword] = useState<string>('');
  const [emailText, setEmailText] = useState<string>('');
  const [currentUserForSharing, setCurrentUserForSharing] = useState<User | null>(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const { toast } = useToast();

  const form = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      role: 'user',
      isActive: true,
    },
  });

  const generateTemporaryPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };
  
  const generateWelcomeMessage = (user: {displayName?: string, email?:string}, password: string): {subject: string, body: string} => {
    const subject = "🎉 Bem-vindo ao Sistema Índice UCS - Suas credenciais de acesso";
    const body = `
🎉 Olá, ${user.displayName}!

Sua conta foi criada com sucesso no Sistema Índice UCS. Abaixo estão suas credenciais de acesso:

📧 Email: ${user.email}
🔑 Senha temporária: ${password}
🌐 Link de acesso: https://ucsindex.vercel.app/login

⚠️ IMPORTANTE - INSTRUÇÕES DE PRIMEIRO ACESSO:

1️⃣ Acesse o sistema usando o link acima
2️⃣ Faça login com o email e a senha temporária fornecidos
3️⃣ No primeiro acesso, você será obrigatoriamente direcionado para alterar sua senha
4️⃣ Escolha uma senha segura com no mínimo 6 caracteres

✅ Após alterar a senha, você terá acesso completo ao sistema.

📧📞 Precisa de ajuda? Entre em contato: luizpaulo.jesus@bmv.global

---
Atenciosamente,
👥 Equipe Índice UCS
`;
    return { subject, body: body.trim() };
  };
  
  const copyEmailText = async () => {
    try {
      await navigator.clipboard.writeText(emailText);
      toast({
        title: "Texto copiado!",
        description: "O texto do email foi copiado para a área de transferência.",
      });
    } catch (error) {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar o texto. Tente selecionar e copiar manualmente.",
        variant: "destructive",
      });
    }
  };

  const handleShareByEmail = (user: User | null, messageBody: string, subject: string) => {
    if (!user || !user.email) return;
    const mailtoLink = `mailto:${user.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(messageBody)}`;
    window.open(mailtoLink, '_blank');
  };
  
  const handleShareByWhatsApp = (user: User | null, messageBody: string) => {
    if (!user || !user.phoneNumber) {
        toast({
            title: "Telefone não cadastrado",
            description: "Não é possível enviar por WhatsApp pois o usuário não possui um número de telefone.",
            variant: "destructive",
        });
        return;
    }
    const cleanPhoneNumber = user.phoneNumber.replace(/\D/g, '');
    const whatsappLink = `https://wa.me/55${cleanPhoneNumber}?text=${encodeURIComponent(messageBody)}`;
    window.open(whatsappLink, '_blank');
  };

  const fetchUsers = async () => {
    setIsFetching(true);
    try {
      const response = await fetch('/api/users');
      if (!response.ok) {
        throw new Error('Erro ao buscar usuários');
      }
      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível carregar os usuários.',
      });
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const onSubmit = async (data: UserFormData) => {
    setIsLoading(true);
    
    try {
        if(editingUser) {
            await fetch('/api/users', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: editingUser.id, ...data }),
            });

            toast({
                title: 'Usuário atualizado',
                description: 'Os dados do usuário foram atualizados com sucesso.',
            });
        } else {
             const tempPassword = generateTemporaryPassword();
             const response = await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...data, password: tempPassword }),
             });
              
             if(!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Falha ao criar usuário");
             }

             const newUserResponse = await response.json();

              const newUser: User = {
                id: newUserResponse.id,
                ...data,
                isFirstLogin: true,
                createdAt: new Date().toISOString()
              };
              
              setCurrentUserForSharing(newUser);
              setGeneratedPassword(tempPassword);
              const { body, subject } = generateWelcomeMessage(newUser, tempPassword);
              setEmailText(body);
              setShowEmailModal(true);
              
              toast({
                title: 'Usuário criado com sucesso',
                description: `${data.displayName} foi adicionado ao sistema.`,
              });
        }
      
      form.reset({ role: 'user', displayName: '', email: '', phoneNumber: '', isActive: true });
      setIsDialogOpen(false);
      setEditingUser(null);
      await fetchUsers();

    } catch (error: any) {
      console.error('Erro ao salvar usuário:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar usuário',
        description: error.message || 'Ocorreu um erro inesperado.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deletingUserId) return;
    setIsLoading(true);
    try {
      const response = await fetch(`/api/users?id=${deletingUserId}`, { method: 'DELETE' });
       if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Falha ao excluir usuário");
      }

      toast({
        title: 'Usuário excluído',
        description: 'O usuário foi removido do sistema.',
      });
      await fetchUsers();
    } catch (error: any) {
      console.error('Erro ao excluir usuário:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível excluir o usuário.',
      });
    } finally {
      setIsLoading(false);
      setDeletingUserId(null);
    }
  };

  const handleNewUser = () => {
    setEditingUser(null);
    form.reset({ role: 'user', displayName: '', email: '', phoneNumber: '', isActive: true });
    setIsDialogOpen(true);
  };
  
  const handleEditUser = (user: User) => {
    setEditingUser(user);
    form.reset({
      email: user.email,
      displayName: user.displayName,
      phoneNumber: user.phoneNumber,
      role: user.role,
      isActive: user.isActive,
    });
    setIsDialogOpen(true);
  }

  return (
    <>
    <Card>
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 md:p-6">
        <div>
          <CardTitle>Gerenciamento de Usuários</CardTitle>
          <CardDescription>
            Gerencie os usuários que têm acesso ao sistema.
          </CardDescription>
        </div>
        <Button onClick={handleNewUser} className="w-full sm:w-auto">
          <PlusCircle className="mr-2 h-4 w-4" />
          Novo Usuário
        </Button>
      </CardHeader>
      <CardContent className="p-0 sm:p-6 sm:pt-0">
        
        {/* Mobile View - Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:hidden p-4">
            {isFetching ? (
                 [...Array(4)].map((_, i) => (
                    <Card key={i} className="p-4 space-y-3 animate-pulse">
                        <div className="flex justify-between items-start">
                            <Skeleton className="w-3/4 h-5 bg-muted rounded" />
                            <Skeleton className="w-6 h-6 bg-muted rounded" />
                        </div>
                        <Skeleton className="w-1/2 h-4 bg-muted rounded" />
                        <Skeleton className="w-1/3 h-4 bg-muted rounded" />
                    </Card>
                 ))
            ) : users.length === 0 ? (
                 <div className="text-center py-10 col-span-full">
                    <p className="text-sm text-muted-foreground">Nenhum usuário encontrado.</p>
                 </div>
            ) : (
                users.map(user => (
                     <Card key={user.id}>
                        <CardHeader className="flex flex-row items-center justify-between p-4">
                             <div className="font-semibold text-primary">{user.displayName}</div>
                             <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleEditUser(user)}>
                                        <Edit className="mr-2 h-4 w-4" /> Editar
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setDeletingUserId(user.id)} className="text-destructive">
                                        <Trash2 className="mr-2 h-4 w-4" /> Excluir
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                             </DropdownMenu>
                        </CardHeader>
                        <CardContent className="p-4 pt-0 space-y-2 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4" />
                                <span>{user.email}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4" />
                                <span>{user.phoneNumber || 'N/A'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <UserIcon className="h-4 w-4" />
                                 <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} className="capitalize">{user.role}</Badge>
                                 <Badge variant={user.isActive ? 'default' : 'destructive'}>{user.isActive ? 'Ativo' : 'Inativo'}</Badge>
                            </div>
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                <span>Criado em {new Date(user.createdAt).toLocaleDateString('pt-BR')}</span>
                            </div>
                        </CardContent>
                     </Card>
                ))
            )}
        </div>


        {/* Desktop View - Table */}
        <div className="rounded-md border hidden sm:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Função</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isFetching ? (
                [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                        <TableCell><Skeleton className="h-5 w-32"/></TableCell>
                        <TableCell><Skeleton className="h-5 w-40"/></TableCell>
                        <TableCell><Skeleton className="h-6 w-20"/></TableCell>
                        <TableCell><Skeleton className="h-6 w-24"/></TableCell>
                        <TableCell><Skeleton className="h-5 w-24"/></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-8 w-8 float-right"/></TableCell>
                    </TableRow>
                ))
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <p className="text-sm text-muted-foreground">Nenhum usuário encontrado.</p>
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.displayName}</TableCell>
                    <TableCell>
                      <div>{user.email}</div>
                      <div className="text-muted-foreground text-xs">{user.phoneNumber || 'N/A'}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} className="capitalize">
                        {user.role}
                      </Badge>
                    </TableCell>
                     <TableCell>
                      <Badge variant={user.isActive ? 'default' : 'destructive'} className="capitalize">
                        {user.isActive ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(user.createdAt).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell className="text-right">
                       <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditUser(user)}>
                                <Edit className="mr-2 h-4 w-4" /> Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setDeletingUserId(user.id)} className="text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" /> Excluir
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                       </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto mx-4">
          <DialogHeader>
            <DialogTitle>
              {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
            </DialogTitle>
            <DialogDescription>
              {editingUser
                ? 'Edite as informações do usuário.'
                : 'Crie um novo usuário. Uma senha temporária será gerada automaticamente.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">Nome Completo</Label>
              <Input
                id="displayName"
                {...form.register('displayName')}
                placeholder="Digite o nome completo"
              />
              {form.formState.errors.displayName && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.displayName.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                {...form.register('email')}
                placeholder="usuario@exemplo.com"
                disabled={!!editingUser}
              />
              {form.formState.errors.email && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>
             <div className="space-y-2">
              <Label htmlFor="phoneNumber">Telefone Celular (WhatsApp)</Label>
              <Input
                id="phoneNumber"
                {...form.register('phoneNumber')}
                placeholder="(XX) XXXXX-XXXX"
              />
              {form.formState.errors.phoneNumber && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.phoneNumber.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Função</Label>
              <select
                id="role"
                {...form.register('role')}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="user">Usuário</option>
                <option value="admin">Administrador</option>
              </select>
            </div>

            {editingUser && (
                <div className="space-y-2">
                    <Label htmlFor="isActive">Status</Label>
                     <select
                        id="isActive"
                        {...form.register('isActive')}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                     >
                        <option value="true">Ativo</option>
                        <option value="false">Inativo</option>
                    </select>
                </div>
            )}
            
            <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="w-full sm:w-auto"
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingUser ? 'Salvar Alterações' : 'Criar Usuário'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingUserId} onOpenChange={() => setDeletingUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza de que deseja excluir este usuário? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingUserId(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showEmailModal} onOpenChange={setShowEmailModal}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Credenciais do Usuário - Mensagem de Boas-Vindas</DialogTitle>
            <DialogDescription>
              Use os botões abaixo para enviar as credenciais para o novo usuário.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto pr-2">
            <div className="p-4 bg-muted rounded-lg ">
              <pre className="whitespace-pre-wrap text-sm font-mono">{emailText}</pre>
            </div>
          </div>
          <DialogFooter className="flex flex-col gap-3 pt-4 border-t">
             <div className="flex flex-col sm:flex-row gap-2 w-full">
                <Button 
                  onClick={() => handleShareByEmail(currentUserForSharing, emailText, "Bem-vindo ao Sistema Índice UCS")}
                  className="w-full sm:w-auto flex-1"
                >
                    <Mail className="mr-2 h-4 w-4" /> Enviar por Email
                </Button>
                <Button 
                  onClick={() => handleShareByWhatsApp(currentUserForSharing, emailText)}
                  className="w-full sm:w-auto flex-1"
                >
                    <MessageSquare className="mr-2 h-4 w-4" /> Enviar por WhatsApp
                </Button>
             </div>
             <div className="flex flex-col sm:flex-row gap-2 w-full">
                <Button 
                  variant="outline" 
                  onClick={() => setShowEmailModal(false)}
                  className="w-full sm:w-auto flex-1"
                >
                  Fechar
                </Button>
                <Button 
                  onClick={copyEmailText}
                  className="w-full sm:w-auto flex-1"
                >
                  Copiar Texto
                </Button>
             </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

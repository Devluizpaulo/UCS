

'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, PlusCircle, Trash2, Edit, Mail, MessageSquare } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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

interface User {
  id: string;
  email: string;
  displayName: string;
  phoneNumber?: string;
  createdAt: string;
  isFirstLogin: boolean;
  role: 'admin' | 'user';
}

const userSchema = z.object({
  email: z.string().email('E-mail inválido'),
  displayName: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  phoneNumber: z.string().optional(),
  role: z.enum(['admin', 'user']),
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
    },
  });

  const generateTemporaryPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };
  
  const generateWelcomeMessage = (user: User, password: string): {subject: string, body: string} => {
    const subject = "Bem-vindo ao Sistema Índice UCS - Suas credenciais de acesso";
    const body = `
Olá, ${user.displayName}!

Sua conta para acessar o Sistema Índice UCS foi criada com sucesso.

==================================
        CREDENCIAS DE ACESSO
==================================
*   **Email:** ${user.email}
*   **Senha Temporária:** ${password}
*   **Link de Acesso:** https://ucsindex.vercel.app/

==================================
     INSTRUÇÕES DE PRIMEIRO ACESSO
==================================
1.  **Acesse o sistema** através do link fornecido acima.
2.  **Faça login** com seu email e a senha temporária.
3.  **Altere sua senha:** O sistema exigirá que você crie uma nova senha pessoal e segura no primeiro acesso.

Atenciosamente,
Equipe Índice UCS
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
    if (!user) return;
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
      const response = await fetch('/api/admin/users');
      if (!response.ok) {
        throw new Error('Falha ao buscar usuários');
      }
      const data = await response.json();
      setUsers(data);
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
    const tempPassword = generateTemporaryPassword();
    
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, password: tempPassword }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao criar usuário no servidor');
      }

      const newUserResponse = await response.json();

      const newUser: User = {
        id: newUserResponse.uid,
        email: data.email,
        displayName: data.displayName,
        phoneNumber: data.phoneNumber,
        role: data.role,
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

      form.reset();
      setIsDialogOpen(false);
      await fetchUsers();
    } catch (error: any) {
      console.error('Erro ao criar usuário:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao criar usuário',
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
      // Implementar chamada à API para excluir usuário
      // const response = await fetch(`/api/admin/users/${deletingUserId}`, { method: 'DELETE' });
      // if (!response.ok) throw new Error('Falha ao excluir');
      
      toast({
        title: 'Usuário excluído',
        description: 'O usuário foi removido do sistema.',
      });
      await fetchUsers();
    } catch (error) {
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
    form.reset({ role: 'user' });
    setIsDialogOpen(true);
  };

  return (
    <Card className="mobile-card">
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-responsive">
        <div>
          <CardTitle className="text-responsive">Gerenciamento de Usuários</CardTitle>
          <CardDescription className="text-responsive">
            Gerencie os usuários que têm acesso ao sistema.
          </CardDescription>
        </div>
        <Button onClick={handleNewUser} className="button-mobile sm:w-auto">
          <PlusCircle className="mr-2 h-4 w-4" />
          Novo Usuário
        </Button>
      </CardHeader>
      <CardContent className="p-responsive">
        <div className="rounded-md border mobile-table-container">
          <Table className="mobile-table table-mobile">
            <TableHeader>
              <TableRow>
                <TableHead className="text-responsive">Nome</TableHead>
                <TableHead className="text-responsive">Contato</TableHead>
                <TableHead className="text-responsive">Função</TableHead>
                <TableHead className="text-responsive">Status</TableHead>
                <TableHead className="text-responsive hidden sm:table-cell">Criado em</TableHead>
                <TableHead className="text-right text-responsive">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isFetching ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    <p className="mt-2 text-sm text-muted-foreground">Carregando usuários...</p>
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <p className="text-sm text-muted-foreground">Nenhum usuário encontrado.</p>
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium text-responsive">{user.displayName}</TableCell>
                    <TableCell className="text-responsive text-xs sm:text-sm">
                      <div>{user.email}</div>
                      <div className="text-muted-foreground">{user.phoneNumber || 'N/A'}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} className="text-xs">
                        {user.role === 'admin' ? 'Administrador' : 'Usuário'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.isFirstLogin ? 'outline' : 'default'} className="text-xs">
                        {user.isFirstLogin ? 'Primeiro Login' : 'Ativo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-responsive">{new Date(user.createdAt).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingUser(user);
                            form.reset({
                              email: user.email,
                              displayName: user.displayName,
                              phoneNumber: user.phoneNumber,
                              role: user.role,
                            });
                            setIsDialogOpen(true);
                          }}
                          className="p-2"
                        >
                          <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDeletingUserId(user.id)}
                          className="p-2"
                        >
                          <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
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
            
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingUser ? 'Salvar' : 'Criar Usuário'}
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
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col">
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
          <DialogFooter className="flex-col sm:flex-row sm:justify-between gap-2 pt-4 border-t">
             <div className="flex gap-2">
                <Button onClick={() => handleShareByEmail(currentUserForSharing, emailText, "Bem-vindo ao Sistema Índice UCS")}>
                    <Mail className="mr-2 h-4 w-4" /> Enviar por Email
                </Button>
                 <Button onClick={() => handleShareByWhatsApp(currentUserForSharing, emailText)}>
                    <MessageSquare className="mr-2 h-4 w-4" /> Enviar por WhatsApp
                </Button>
             </div>
             <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowEmailModal(false)}>
                Fechar
                </Button>
                <Button onClick={copyEmailText}>
                Copiar Texto
                </Button>
             </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

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
import { Loader2, PlusCircle, Trash2, Edit, Eye, EyeOff } from 'lucide-react';
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
  DialogTrigger,
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
import { getAuth, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { firebaseConfig } from '@/lib/firebase-config';
import { db } from '@/lib/firebase-admin-config';

interface User {
  id: string;
  email: string;
  displayName: string;
  createdAt: string;
  isFirstLogin: boolean;
  role: 'admin' | 'user';
}

const userSchema = z.object({
  email: z.string().email('E-mail inválido'),
  displayName: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
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
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  const auth = getAuth(app);

  const form = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      role: 'user',
    },
  });

  // Gerar senha temporária
  const generateTemporaryPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  // Buscar usuários
  const fetchUsers = async () => {
    setIsFetching(true);
    try {
      // Aqui você implementaria a busca de usuários do Firestore
      // Por enquanto, vamos simular com dados mock
      const mockUsers: User[] = [
        {
          id: '1',
          email: 'admin@ucs.com',
          displayName: 'Administrador',
          createdAt: '2024-01-15',
          isFirstLogin: false,
          role: 'admin',
        },
      ];
      setUsers(mockUsers);
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

  // Criar usuário
  const onSubmit = async (data: UserFormData) => {
    setIsLoading(true);
    const tempPassword = generateTemporaryPassword();
    
    try {
      // Criar usuário no Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, tempPassword);
      const user = userCredential.user;

      // Atualizar perfil do usuário
      await updateProfile(user, {
        displayName: data.displayName,
      });

      // Salvar dados adicionais no Firestore
      // Aqui você salvaria os dados do usuário no Firestore
      // incluindo role, isFirstLogin: true, etc.

      setGeneratedPassword(tempPassword);
      setShowPassword(true);
      
      toast({
        title: 'Usuário criado com sucesso',
        description: `${data.displayName} foi adicionado ao sistema.`,
      });

      form.reset();
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

  // Excluir usuário
  const handleDeleteUser = async () => {
    if (!deletingUserId) return;

    setIsLoading(true);
    try {
      // Aqui você implementaria a exclusão do usuário
      // Tanto do Firebase Auth quanto do Firestore
      
      toast({
        title: 'Usuário excluído',
        description: 'O usuário foi removido do sistema.',
      });

      await fetchUsers();
    } catch (error) {
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
    form.reset({ role: 'user' });
    setGeneratedPassword('');
    setShowPassword(false);
    setIsDialogOpen(true);
  };

  const copyPasswordToClipboard = () => {
    navigator.clipboard.writeText(generatedPassword);
    toast({
      title: 'Senha copiada',
      description: 'A senha temporária foi copiada para a área de transferência.',
    });
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
                <TableHead className="text-responsive">E-mail</TableHead>
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
                    <TableCell className="text-responsive text-xs sm:text-sm">{user.email}</TableCell>
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

      {/* Dialog para criar/editar usuário */}
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
            
            {generatedPassword && showPassword && (
              <div className="space-y-2 p-4 bg-muted rounded-lg">
                <Label>Senha Temporária Gerada</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={generatedPassword}
                    readOnly
                    className="font-mono"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={copyPasswordToClipboard}
                  >
                    Copiar
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  O usuário deverá alterar esta senha no primeiro login.
                </p>
              </div>
            )}
            
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

      {/* Dialog de confirmação para exclusão */}
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
    </Card>
  );
}
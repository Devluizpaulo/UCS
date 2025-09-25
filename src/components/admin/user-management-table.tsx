
'use client';

import { useState } from 'react';
import type { UserRecord } from 'firebase-admin/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Trash2, Edit } from 'lucide-react';
import { UserFormModal } from './user-form-modal';
import { InviteLinkModal } from './invite-link-modal';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { createUser, updateUser, deleteUser, getUsers } from '@/lib/admin-actions';
import type { UserFormValues } from './user-form-modal';

interface UserManagementTableProps {
  initialUsers: UserRecord[];
}

interface InviteInfo {
  name: string;
  email: string;
  phoneNumber?: string;
  link: string;
}

export function UserManagementTable({ initialUsers }: UserManagementTableProps) {
  const [users, setUsers] = useState(initialUsers);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
  const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null);
  const { toast } = useToast();

  const refreshUsers = async () => {
    const updatedUsers = await getUsers();
    setUsers(updatedUsers);
  };

  const handleCreate = async (values: UserFormValues) => {
    try {
      const { user, link } = await createUser(values);
      toast({ title: 'Sucesso', description: `Usuário ${user.email} criado. Compartilhe o link de acesso.` });
      setIsFormModalOpen(false);
      setInviteInfo({
        name: user.displayName || 'Novo Usuário',
        email: user.email!,
        phoneNumber: user.phoneNumber,
        link
      });
      refreshUsers();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
    }
  };

  const handleUpdate = async (uid: string, values: Partial<UserFormValues>) => {
    try {
      await updateUser(uid, values);
      toast({ title: 'Sucesso', description: 'Usuário atualizado com sucesso.' });
      setIsFormModalOpen(false);
      setEditingUser(null);
      refreshUsers();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
    }
  };

  const handleDelete = async (uid: string) => {
    try {
      await deleteUser(uid);
      toast({ title: 'Sucesso', description: 'Usuário excluído com sucesso.' });
      refreshUsers();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Usuários Registrados</CardTitle>
              <CardDescription>Lista de todos os usuários com acesso à plataforma.</CardDescription>
            </div>
            <Button onClick={() => { setEditingUser(null); setIsFormModalOpen(true); }}>
              Adicionar Usuário
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data de Criação</TableHead>
                <TableHead>Último Login</TableHead>
                <TableHead>
                  <span className="sr-only">Ações</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.uid}>
                  <TableCell>
                    <div className="font-medium">{user.displayName || 'Nome não definido'}</div>
                    <div className="text-sm text-muted-foreground">{user.email}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.disabled ? 'destructive' : 'secondary'}>
                      {user.disabled ? 'Desativado' : 'Ativo'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(user.metadata.creationTime).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {user.metadata.lastSignInTime
                      ? new Date(user.metadata.lastSignInTime).toLocaleString()
                      : 'Nunca'}
                  </TableCell>
                  <TableCell>
                    <AlertDialog>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button aria-haspopup="true" size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Ações</DropdownMenuLabel>
                          <DropdownMenuItem onSelect={() => { setEditingUser(user); setIsFormModalOpen(true); }}>
                            <Edit className="mr-2 h-4 w-4" /> Editar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem className="text-destructive focus:text-destructive">
                              <Trash2 className="mr-2 h-4 w-4" /> Excluir
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta ação não pode ser desfeita. Isso excluirá permanentemente o usuário{' '}
                            <span className="font-bold">{user.email}</span>.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive hover:bg-destructive/90"
                            onClick={() => handleDelete(user.uid)}
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <UserFormModal
        isOpen={isFormModalOpen}
        onOpenChange={setIsFormModalOpen}
        onSubmit={editingUser ? (values) => handleUpdate(editingUser.uid, values) : handleCreate}
        user={editingUser}
      />
      {inviteInfo && (
        <InviteLinkModal
          isOpen={!!inviteInfo}
          onOpenChange={() => setInviteInfo(null)}
          inviteInfo={inviteInfo}
        />
      )}
    </>
  );
}

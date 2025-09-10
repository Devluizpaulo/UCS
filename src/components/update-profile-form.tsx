
'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UserCircle } from 'lucide-react';
import { getAuth } from 'firebase/auth'; // Only for getting the user object on the client
import { updateUserProfile } from '@/lib/profile-service';
import { Skeleton } from './ui/skeleton';

const profileSchema = z.object({
  displayName: z.string().min(2, 'O nome deve ter pelo menos 2 caracteres.'),
  email: z.string().email(),
  phoneNumber: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export function UpdateProfileForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const { toast } = useToast();
  const auth = getAuth();
  const user = auth.currentUser;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  });

  useEffect(() => {
    if (user) {
      reset({
        displayName: user.displayName || '',
        email: user.email || '',
        phoneNumber: user.phoneNumber || '',
      });
      setIsFetching(false);
    }
  }, [user, reset]);

  const onSubmit = async (data: ProfileFormData) => {
    if (!user) {
        toast({ variant: 'destructive', title: 'Erro', description: 'Usuário não autenticado.' });
        return;
    }
    setIsLoading(true);
    try {
      // Call the server action with the UID and new data
      await updateUserProfile(user.uid, data.displayName, data.phoneNumber);
      
      // We need to reload the user object on the client to see the changes
      await user.reload();

      // This is necessary to update the UI state, as `user.reload()` doesn't trigger a re-render
      reset({
        displayName: user.displayName || data.displayName,
        email: user.email || '',
        phoneNumber: user.phoneNumber || data.phoneNumber,
      });

      toast({
        title: 'Sucesso!',
        description: 'Seu perfil foi atualizado. Pode ser necessário recarregar a página para ver todas as alterações.',
      });

    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao atualizar perfil',
        description: 'Não foi possível atualizar o perfil. Tente novamente mais tarde.',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  if (isFetching) {
      return (
        <Card>
            <CardHeader>
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-4 w-full" />
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-10 w-full" />
                </div>
                 <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-10 w-full" />
                </div>
                 <Skeleton className="h-10 w-32" />
            </CardContent>
        </Card>
      )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCircle className="h-5 w-5" />
          Informações Pessoais
        </CardTitle>
        <CardDescription>
          Atualize seu nome e e-mail. O e-mail não pode ser alterado.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="displayName">Nome</Label>
            <Input id="displayName" {...register('displayName')} />
            {errors.displayName && (
              <p className="text-xs text-destructive">{errors.displayName.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" type="email" {...register('email')} disabled />
          </div>
           <div className="space-y-2">
            <Label htmlFor="phoneNumber">Telefone Celular (WhatsApp)</Label>
            <Input id="phoneNumber" {...register('phoneNumber')} placeholder="(XX) XXXXX-XXXX" />
            {errors.phoneNumber && (
              <p className="text-xs text-destructive">{errors.phoneNumber.message}</p>
            )}
          </div>
          <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Salvar Alterações
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

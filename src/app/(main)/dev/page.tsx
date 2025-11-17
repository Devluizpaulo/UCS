'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/page-header';
import { SlidersHorizontal, Database } from 'lucide-react';
import { FeatureFlags } from '@/components/admin/feature-flags';
import { FirestoreAdmin } from '@/components/admin/firestore-admin';

export default function DevToolsPage() {

  if (process.env.NODE_ENV !== 'development') {
    return (
        <div className="flex min-h-screen w-full flex-col items-center justify-center p-4">
            <Card className="max-w-lg">
                <CardHeader>
                    <CardTitle>Acesso Restrito</CardTitle>
                    <CardDescription>
                        Esta página está disponível apenas em ambiente de desenvolvimento.
                    </CardDescription>
                </CardHeader>
            </Card>
        </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col">
        <PageHeader 
            title="Ferramentas de Desenvolvedor"
            description="Recursos avançados para debug e manipulação de dados."
            icon={SlidersHorizontal}
        />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        <Tabs defaultValue="firestore" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="firestore">
                <Database className="mr-2 h-4 w-4" />
                Firestore Admin
            </TabsTrigger>
            <TabsTrigger value="flags">
                <SlidersHorizontal className="mr-2 h-4 w-4" />
                Feature Flags
            </TabsTrigger>
          </TabsList>
          <TabsContent value="firestore" className="mt-4">
            <FirestoreAdmin />
          </TabsContent>
          <TabsContent value="flags" className="mt-4">
            <FeatureFlags />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

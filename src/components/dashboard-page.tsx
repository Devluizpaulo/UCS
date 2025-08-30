'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { UploadCloud } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { UcsIndexChart } from '@/components/ucs-index-chart';
import { CommodityPrices } from '@/components/commodity-prices';
import type { ChartData } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { calculateUcsIndex } from '@/ai/flows/calculate-ucs-index-flow';

// Helper to generate mock data for chart history
const generateInitialData = (currentValue: number): ChartData[] => {
  const data: ChartData[] = [];
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 60000);
    const mockValue = currentValue * (1 + (Math.random() - 0.5) * 0.05); // Fluctuate within 5% of current value
    data.push({
      time: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      value: mockValue,
    });
  }
  // Ensure the last point is the actual current value
  data[data.length-1].value = currentValue;
  return data;
};

export function DashboardPage() {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loadingIndex, setLoadingIndex] = useState(true);

  useEffect(() => {
    async function fetchAndSetIndex() {
      try {
        setLoadingIndex(true);
        const { indexValue } = await calculateUcsIndex();
        
        setChartData((prevData) => {
          // If it's the first load, generate historical data
          if (prevData.length === 0) {
            return generateInitialData(indexValue);
          }

          // Otherwise, append the new value
          const newDataPoint = {
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            value: indexValue,
          };
          return [...prevData.slice(1), newDataPoint];
        });

      } catch (error) {
        console.error("Failed to fetch UCS Index:", error);
        toast({
          variant: "destructive",
          title: "Erro ao buscar Índice UCS",
          description: "Não foi possível carregar o valor do índice. Tente novamente mais tarde.",
        });
      } finally {
        setLoadingIndex(false);
      }
    }

    fetchAndSetIndex(); // Initial fetch
    const interval = setInterval(fetchAndSetIndex, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [toast]);

  const handleFileUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      toast({
        title: 'Arquivo Enviado',
        description: `${file.name} foi enviado com sucesso.`,
      });
      // Here you would process the file
    }
    // Reset file input to allow uploading the same file again
    if (event.target) {
      event.target.value = '';
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <PageHeader title="Painel">
        <Button onClick={handleFileUploadClick}>
          <UploadCloud className="mr-2 h-4 w-4" />
          Carregar Planilha
        </Button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
        />
      </PageHeader>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
          <div className="col-span-4 rounded-xl border bg-card text-card-foreground shadow-sm">
            <UcsIndexChart data={chartData} loading={loadingIndex}/>
          </div>
          <div className="col-span-4 lg:col-span-3">
            <CommodityPrices />
          </div>
        </div>
      </main>
    </div>
  );
}

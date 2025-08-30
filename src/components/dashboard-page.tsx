"use client";

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { UploadCloud } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { UcsIndexChart } from '@/components/ucs-index-chart';
import { CommodityPrices } from '@/components/commodity-prices';
import type { ChartData } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

// Helper to generate mock data
const generateInitialData = (): ChartData[] => {
  const data: ChartData[] = [];
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 60000); // one point per minute for last 30 mins
    data.push({
      time: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      value: 100 + Math.random() * 10 - 5,
    });
  }
  return data;
};

export function DashboardPage() {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setChartData(generateInitialData());

    const interval = setInterval(() => {
      setChartData((prevData) => {
        const lastValue = prevData.length > 0 ? prevData[prevData.length - 1].value : 100;
        const newValue = lastValue + Math.random() * 2 - 1; // smaller fluctuation
        const newDataPoint = {
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          value: Math.max(90, Math.min(110, newValue)), // Keep it within a range
        };
        const updatedData = [...prevData.slice(1), newDataPoint];
        return updatedData;
      });
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const handleFileUploadClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      toast({
        title: "File Uploaded",
        description: `${file.name} has been successfully uploaded.`,
      });
      // Here you would process the file
    }
    // Reset file input to allow uploading the same file again
    if(event.target) {
        event.target.value = '';
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <PageHeader title="Dashboard">
        <Button onClick={handleFileUploadClick}>
          <UploadCloud className="mr-2 h-4 w-4" />
          Upload Spreadsheet
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
            <UcsIndexChart data={chartData} />
          </div>
          <div className="col-span-4 lg:col-span-3">
             <CommodityPrices />
          </div>
        </div>
      </main>
    </div>
  );
}

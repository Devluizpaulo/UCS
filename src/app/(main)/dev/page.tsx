"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

type Flags = Record<string, boolean>;

function useDevFlags() {
  const [flags, setFlags] = useState<Flags>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem("dev_flags");
      if (raw) setFlags(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("dev_flags", JSON.stringify(flags));
    } catch {}
  }, [flags]);

  const setFlag = (key: string, value: boolean) => {
    setFlags((prev) => ({ ...prev, [key]: value }));
  };

  const reset = () => setFlags({});

  return { flags, setFlag, reset };
}

export default function DevToolsPage() {
  const { flags, setFlag, reset } = useDevFlags();

  const envInfo = useMemo(() => {
    return {
      nodeEnv: process.env.NODE_ENV || "",
      vercelEnv: process.env.NEXT_PUBLIC_VERCEL_ENV || "",
      appVersion: process.env.NEXT_PUBLIC_APP_VERSION || "",
      commit: process.env.NEXT_PUBLIC_GIT_COMMIT || "",
    };
  }, []);

  const defaultCandidates = [
    "useMockData",
    "disableCache",
    "slowNetwork",
    "enablePdfDebug",
    "showPerfOverlay",
  ];

  const keys = Array.from(new Set([...defaultCandidates, ...Object.keys(flags)])).sort();

  return (
    <div className="flex min-h-screen w-full flex-col gap-4 p-4 md:gap-8 md:p-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Feature Flags</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {keys.map((k) => (
              <div key={k} className="flex items-center justify-between">
                <Label htmlFor={k} className="capitalize">{k}</Label>
                <Switch id={k} checked={!!flags[k]} onCheckedChange={(v) => setFlag(k, !!v)} />
              </div>
            ))}
            <Separator className="my-2" />
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => reset()}>Limpar</Button>
              <Button
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(flags, null, 2));
                }}
              >Copiar JSON</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ambiente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span>NODE_ENV</span><span>{envInfo.nodeEnv}</span></div>
            <div className="flex justify-between"><span>VERCEL_ENV</span><span>{envInfo.vercelEnv}</span></div>
            <div className="flex justify-between"><span>APP_VERSION</span><span>{envInfo.appVersion}</span></div>
            <div className="flex justify-between"><span>COMMIT</span><span className="truncate max-w-[200px]">{envInfo.commit}</span></div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


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

export function FeatureFlags() {
  const { flags, setFlag, reset } = useDevFlags();

  const defaultCandidates = [
    "useMockData",
    "disableCache",
    "slowNetwork",
    "enablePdfDebug",
    "showPerfOverlay",
  ];

  const keys = Array.from(new Set([...defaultCandidates, ...Object.keys(flags)])).sort();

  return (
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
  );
}

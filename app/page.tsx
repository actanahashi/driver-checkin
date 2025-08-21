"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { MapPin, Car, Clock, KeyRound } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type GeoPoint = { latitude: number; longitude: number };

function getPositionOnce(opts: PositionOptions): Promise<GeoPoint> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocalização não é suportada neste navegador."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        }),
      (err) => {
        let reason = "Erro ao obter localização.";
        if (err.code === err.PERMISSION_DENIED)
          reason = "Permissão de localização negada.";
        if (err.code === err.POSITION_UNAVAILABLE)
          reason = "Serviço de localização indisponível.";
        if (err.code === err.TIMEOUT)
          reason = "Tempo esgotado para obter a localização.";
        reject(new Error(reason));
      },
      opts
    );
  });
}

async function getResilientLocation(): Promise<GeoPoint> {
  try {
    return await getPositionOnce({
      enableHighAccuracy: true,
      timeout: 12000,
      maximumAge: 0,
    });
  } catch {
    return await getPositionOnce({
      enableHighAccuracy: false,
      timeout: 25000,
      maximumAge: 5 * 60 * 1000,
    });
  }
}

function getCurrentDateTimeBRLikePostman(): string {
  return new Date().toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour12: false,
  });
}

function formatPlaca(value: string) {
  const cleaned = value.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  if (cleaned.length <= 3) return cleaned;
  if (cleaned.length <= 7) return cleaned.slice(0, 3) + cleaned.slice(3);
  return cleaned.slice(0, 7);
}

export default function DriverCheckInPage() {
  const [placa, setPlaca] = useState("");
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleCheckIn = async () => {
    if (!placa.trim() || !token.trim()) {
      toast({
        title: "Erro",
        description: "Placa e token são obrigatórios",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const location = await getResilientLocation();

      const payload = {
        NR_PLACA: placa.toUpperCase().trim(),
        DT_POSICAO: getCurrentDateTimeBRLikePostman(),
        NR_LATITUDE: location.latitude.toString(),
        NR_LONGITUDE: location.longitude.toString(),
      };

      const res = await fetch("/api/postCheckIn", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token.trim()}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Falha na API: ${res.status} ${txt}`);
      }

      toast({
        title: "Check-in realizado!",
        description: `Placa ${placa.toUpperCase()} registrada com sucesso`,
      });
      setPlaca("");
    } catch (error) {
      toast({
        title: "Erro no check-in",
        description:
          error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 flex items-center justify-center">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <Car className="w-8 h-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-800">
            Check-in Motorista
          </CardTitle>
          <CardDescription className="text-gray-600">
            Informe os dados abaixo para registrar sua posição
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="placa">Placa do Veículo</Label>
            <Input
              id="placa"
              type="text"
              placeholder="ABC1234"
              value={placa}
              onChange={(e) => setPlaca(formatPlaca(e.target.value))}
              maxLength={7}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="token">Token de Autenticação</Label>
            <Input
              id="token"
              type="password"
              placeholder="Cole seu token aqui"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              disabled={loading}
            />
          </div>

          <Button
            onClick={handleCheckIn}
            disabled={loading || !placa.trim() || !token.trim()}
            className="w-full h-12 text-lg font-semibold"
          >
            {loading ? "Realizando Check-in..." : "Fazer Check-in"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

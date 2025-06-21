
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { QrCode, RefreshCw, Smartphone } from 'lucide-react';

const WhatsAppQRCode = () => {
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [qrCode, setQrCode] = useState<string | null>(null);

  const generateQRCode = () => {
    setConnectionStatus('connecting');
    // Simulate QR code generation
    setTimeout(() => {
      setQrCode('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ3aGl0ZSIvPgogIDx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LXNpemU9IjE0cHgiPgogICAgUVIgQ29kZSBTaW11bGF0aW9uCiAgPC90ZXh0Pgo8L3N2Zz4=');
    }, 2000);
  };

  const handleConnect = () => {
    if (connectionStatus === 'connecting') {
      setConnectionStatus('connected');
    } else {
      generateQRCode();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="h-5 w-5" />
          Conexão WhatsApp
        </CardTitle>
        <CardDescription>
          Escaneie o QR Code para conectar sua conta do WhatsApp
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 text-center">
          <div className="flex justify-center">
            <Badge variant={
              connectionStatus === 'connected' ? 'default' : 
              connectionStatus === 'connecting' ? 'secondary' : 'outline'
            }>
              {connectionStatus === 'connected' ? 'Conectado' : 
               connectionStatus === 'connecting' ? 'Conectando...' : 'Desconectado'}
            </Badge>
          </div>

          {connectionStatus === 'connecting' && qrCode && (
            <div className="flex justify-center">
              <div className="border-2 border-dashed border-gray-300 p-4 rounded-lg">
                <img src={qrCode} alt="QR Code" className="w-48 h-48" />
              </div>
            </div>
          )}

          {connectionStatus === 'connected' ? (
            <div className="space-y-2">
              <Smartphone className="mx-auto h-12 w-12 text-green-600" />
              <p className="text-sm text-muted-foreground">
                WhatsApp conectado com sucesso!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground space-y-1">
                <p>1. Abra o WhatsApp no seu celular</p>
                <p>2. Toque em Menu (⋮) ou Configurações</p>
                <p>3. Toque em Aparelhos conectados</p>
                <p>4. Toque em Conectar um aparelho</p>
                <p>5. Escaneie o QR Code abaixo</p>
              </div>
              
              <Button onClick={handleConnect} disabled={connectionStatus === 'connecting'}>
                {connectionStatus === 'connecting' ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Gerando QR Code...
                  </>
                ) : (
                  <>
                    <QrCode className="w-4 h-4 mr-2" />
                    Gerar QR Code
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default WhatsAppQRCode;

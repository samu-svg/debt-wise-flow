
import React, { memo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Cloud, Zap } from 'lucide-react';

interface WhatsAppHeaderProps {
  connection: {
    isConnected: boolean;
  };
  isConfigDirty: boolean;
  credentials: {
    healthStatus: string;
  };
}

const WhatsAppHeader = memo(({ connection, isConfigDirty, credentials }: WhatsAppHeaderProps) => {
  return (
    <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-6">
      <div>
        <h1 className="text-3xl sm:text-4xl font-bold flex items-center gap-3 text-gray-900 mb-2">
          <div className="p-2 bg-green-100 rounded-xl">
            <Cloud className="w-8 h-8 sm:w-10 sm:h-10 text-green-600" />
          </div>
          <span className="truncate">WhatsApp Cloud API</span>
        </h1>
        <p className="text-base sm:text-lg text-gray-600 max-w-2xl">
          Gerenciamento completo da integração com WhatsApp Business - 
          Credenciais seguras, mensagens persistidas e lista de aprovados
        </p>
      </div>
      
      <div className="flex justify-end">
        <div className="flex items-center gap-3">
          <Badge 
            variant={connection.isConnected ? "default" : "secondary"}
            className={`flex items-center gap-2 text-sm px-4 py-2 ${
              connection.isConnected ? 'bg-green-100 text-green-800 border-green-300' : 'bg-gray-100 text-gray-600 border-gray-300'
            }`}
          >
            <div className={`w-2 h-2 rounded-full ${
              connection.isConnected ? 'bg-green-600 animate-pulse' : 'bg-gray-400'
            }`} />
            <span>
              {connection.isConnected ? 'API Online' : 'API Offline'}
            </span>
            {isConfigDirty && (
              <span className="text-xs bg-orange-200 text-orange-800 px-1.5 py-0.5 rounded-full">
                *
              </span>
            )}
          </Badge>
          
          <div className="hidden sm:flex items-center gap-2 text-xs text-gray-500">
            <Zap className="w-3 h-3" />
            <span>Supabase Integration - {new Date().toLocaleTimeString('pt-BR')}</span>
          </div>
        </div>
      </div>
    </div>
  );
});

WhatsAppHeader.displayName = 'WhatsAppHeader';

export default WhatsAppHeader;

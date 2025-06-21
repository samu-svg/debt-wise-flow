
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

const WhatsAppHealthDashboard = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-orange-500" />
          Status de Saúde
        </CardTitle>
        <CardDescription>
          Funcionalidade temporariamente desabilitada
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-gray-500">
          <p>Esta funcionalidade foi temporariamente removida.</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default WhatsAppHealthDashboard;

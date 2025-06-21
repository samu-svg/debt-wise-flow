
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Upload, Database, Shield } from 'lucide-react';

const Backup = () => {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Backup</h2>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Exportar Dados
            </CardTitle>
            <CardDescription>
              Faça o download de todos os seus dados em formato seguro
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                <p>• Dados de clientes</p>
                <p>• Registros de dívidas</p>
                <p>• Configurações do sistema</p>
              </div>
              <Button className="w-full">
                <Download className="w-4 h-4 mr-2" />
                Exportar Backup
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Importar Dados
            </CardTitle>
            <CardDescription>
              Restaure seus dados a partir de um arquivo de backup
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                <p>• Formatos suportados: JSON, CSV</p>
                <p>• Verificação de integridade</p>
                <p>• Backup automático antes da importação</p>
              </div>
              <Button variant="outline" className="w-full">
                <Upload className="w-4 h-4 mr-2" />
                Selecionar Arquivo
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Backup Automático
            </CardTitle>
            <CardDescription>
              Configure backups automáticos regulares
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Frequência</label>
                <select className="w-full p-2 border rounded-md">
                  <option>Diário</option>
                  <option>Semanal</option>
                  <option>Mensal</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Horário</label>
                <input 
                  type="time" 
                  className="w-full p-2 border rounded-md"
                  defaultValue="02:00"
                />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <Shield className="h-4 w-4 text-green-600" />
              <span className="text-sm text-muted-foreground">
                Último backup: Hoje às 02:00
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Backup;

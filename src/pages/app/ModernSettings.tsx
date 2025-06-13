
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import BackupStatus from '@/components/BackupStatus';
import { 
  User, 
  Bell, 
  Shield, 
  Database,
  Settings as SettingsIcon
} from 'lucide-react';

const ModernSettings = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Configurações</h1>
        <p className="text-gray-600 mt-2">Gerencie suas preferências e configurações do sistema</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Account Settings */}
        <Card className="bg-white border border-gray-100">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <User className="w-5 h-5" />
              Conta
            </CardTitle>
            <CardDescription>
              Informações pessoais e configurações da conta
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input id="name" placeholder="Seu nome completo" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="seu@email.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input id="phone" placeholder="(11) 99999-9999" />
            </div>
            <Button className="w-full bg-indigo-600 hover:bg-indigo-700">
              Salvar Alterações
            </Button>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="bg-white border border-gray-100">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notificações
            </CardTitle>
            <CardDescription>
              Configure como você quer receber notificações
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Pagamentos Recebidos</p>
                <p className="text-sm text-gray-600">Notificar quando um pagamento for confirmado</p>
              </div>
              <Switch />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Dívidas Vencidas</p>
                <p className="text-sm text-gray-600">Alerta diário de dívidas em atraso</p>
              </div>
              <Switch />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">WhatsApp Desconectado</p>
                <p className="text-sm text-gray-600">Notificar se o WhatsApp desconectar</p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card className="bg-white border border-gray-100">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Segurança
            </CardTitle>
            <CardDescription>
              Configurações de segurança e privacidade
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Senha Atual</Label>
              <Input id="current-password" type="password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">Nova Senha</Label>
              <Input id="new-password" type="password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
              <Input id="confirm-password" type="password" />
            </div>
            <Button variant="outline" className="w-full">
              Alterar Senha
            </Button>
          </CardContent>
        </Card>

        {/* Backup */}
        <Card className="bg-white border border-gray-100">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Database className="w-5 h-5" />
              Backup dos Dados
            </CardTitle>
            <CardDescription>
              Gerencie o backup automático dos seus dados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BackupStatus />
          </CardContent>
        </Card>
      </div>

      {/* System Info */}
      <Card className="bg-white border border-gray-100">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <SettingsIcon className="w-5 h-5" />
            Informações do Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="font-medium text-gray-900">Versão</p>
              <p className="text-gray-600">DebtWise v1.0.0</p>
            </div>
            <div>
              <p className="font-medium text-gray-900">Último Backup</p>
              <p className="text-gray-600">Hoje, 14:30</p>
            </div>
            <div>
              <p className="font-medium text-gray-900">Clientes Cadastrados</p>
              <p className="text-gray-600">24 clientes</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ModernSettings;

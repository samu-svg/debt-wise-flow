
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Activity, Wifi, MessageCircle, Clock } from 'lucide-react';

const WhatsAppHealthDashboard = () => {
  const healthMetrics = {
    connectionStatus: 'connected',
    apiResponseTime: 250,
    messageDeliveryRate: 98.5,
    rateLimitUsage: 75
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Connection Status</CardTitle>
          <Wifi className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <Badge variant={healthMetrics.connectionStatus === 'connected' ? 'default' : 'destructive'}>
            {healthMetrics.connectionStatus === 'connected' ? 'Connected' : 'Disconnected'}
          </Badge>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">API Response Time</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{healthMetrics.apiResponseTime}ms</div>
          <p className="text-xs text-muted-foreground">Average response time</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Delivery Rate</CardTitle>
          <MessageCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{healthMetrics.messageDeliveryRate}%</div>
          <Progress value={healthMetrics.messageDeliveryRate} className="mt-2" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Rate Limit Usage</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{healthMetrics.rateLimitUsage}%</div>
          <Progress value={healthMetrics.rateLimitUsage} className="mt-2" />
        </CardContent>
      </Card>
    </div>
  );
};

export default WhatsAppHealthDashboard;

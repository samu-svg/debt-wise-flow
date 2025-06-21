
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bug, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';

const WhatsAppDebugPanel = () => {
  const [debugLogs, setDebugLogs] = useState([
    { level: 'info', message: 'WhatsApp API connected successfully', timestamp: new Date() },
    { level: 'warning', message: 'Rate limit approaching (80/100)', timestamp: new Date() },
    { level: 'error', message: 'Failed to send message to +5511999999999', timestamp: new Date() }
  ]);

  const refreshLogs = () => {
    const newLog = {
      level: 'info',
      message: `System check completed at ${new Date().toLocaleTimeString()}`,
      timestamp: new Date()
    };
    setDebugLogs([newLog, ...debugLogs]);
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error':
        return 'destructive';
      case 'warning':
        return 'secondary';
      default:
        return 'default';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bug className="h-5 w-5" />
              Debug Panel
            </CardTitle>
            <CardDescription>
              Monitor system logs and debug information
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={refreshLogs}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-64">
          <div className="space-y-2">
            {debugLogs.map((log, index) => (
              <div key={index} className="flex items-start gap-2 p-2 border rounded text-sm">
                {getLevelIcon(log.level)}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant={getLevelColor(log.level) as any}>
                      {log.level.toUpperCase()}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {log.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="mt-1">{log.message}</p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default WhatsAppDebugPanel;

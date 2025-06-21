
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Phone } from 'lucide-react';

const WhatsAppAllowlistManager = () => {
  const [allowedNumbers, setAllowedNumbers] = useState<string[]>([
    '+5511999999999',
    '+5511888888888'
  ]);
  const [newNumber, setNewNumber] = useState('');

  const handleAddNumber = () => {
    if (newNumber && !allowedNumbers.includes(newNumber)) {
      setAllowedNumbers([...allowedNumbers, newNumber]);
      setNewNumber('');
    }
  };

  const handleRemoveNumber = (number: string) => {
    setAllowedNumbers(allowedNumbers.filter(n => n !== number));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Phone className="h-5 w-5" />
          Lista de Números Permitidos
        </CardTitle>
        <CardDescription>
          Gerencie os números que podem receber mensagens automáticas
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={newNumber}
              onChange={(e) => setNewNumber(e.target.value)}
              placeholder="+55119999999999"
            />
            <Button onClick={handleAddNumber}>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar
            </Button>
          </div>
          
          <div className="space-y-2">
            {allowedNumbers.map((number) => (
              <div key={number} className="flex items-center justify-between p-2 border rounded">
                <Badge variant="outline">{number}</Badge>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => handleRemoveNumber(number)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WhatsAppAllowlistManager;

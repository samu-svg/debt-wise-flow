
import { useState, useEffect } from 'react';
import { useSupabaseData } from './useSupabaseData';

export const useLocalAutomation = () => {
  const [isActive, setIsActive] = useState(false);
  const [lastExecution, setLastExecution] = useState<Date | null>(null);
  const { data: clientes } = useSupabaseData();

  const startAutomation = () => {
    setIsActive(true);
    setLastExecution(new Date());
    console.log('Local automation started');
  };

  const stopAutomation = () => {
    setIsActive(false);
    console.log('Local automation stopped');
  };

  return {
    isActive,
    lastExecution,
    startAutomation,
    stopAutomation,
    clientesCount: clientes?.length || 0
  };
};

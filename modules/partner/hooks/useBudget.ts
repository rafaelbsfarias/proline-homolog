import { useState, useCallback } from 'react';
import { PartnerService } from './usePartnerServices';

export interface BudgetItem {
  service: PartnerService;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Budget {
  id?: string;
  name: string;
  clientName: string;
  items: BudgetItem[];
  totalValue: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export function useBudget() {
  const [budget, setBudget] = useState<Budget>({
    name: '',
    clientName: '',
    items: [],
    totalValue: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addService = useCallback((service: PartnerService) => {
    setBudget(prev => {
      // Verificar se o serviço já está no orçamento
      const existingItem = prev.items.find(item => item.service.id === service.id);

      if (existingItem) {
        // Se já existe, aumentar a quantidade
        const updatedItems = prev.items.map(item =>
          item.service.id === service.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                totalPrice: item.unitPrice * (item.quantity + 1),
              }
            : item
        );
        return {
          ...prev,
          items: updatedItems,
          totalValue: updatedItems.reduce((total, item) => total + item.totalPrice, 0),
        };
      } else {
        // Se não existe, adicionar novo item
        const newItem: BudgetItem = {
          service,
          quantity: 1,
          unitPrice: service.price,
          totalPrice: service.price,
        };
        const updatedItems = [...prev.items, newItem];
        return {
          ...prev,
          items: updatedItems,
          totalValue: updatedItems.reduce((total, item) => total + item.totalPrice, 0),
        };
      }
    });
  }, []);

  const removeService = useCallback((serviceId: string) => {
    setBudget(prev => {
      const updatedItems = prev.items.filter(item => item.service.id !== serviceId);
      return {
        ...prev,
        items: updatedItems,
        totalValue: updatedItems.reduce((total, item) => total + item.totalPrice, 0),
      };
    });
  }, []);

  const updateQuantity = useCallback(
    (serviceId: string, quantity: number) => {
      if (quantity <= 0) {
        removeService(serviceId);
        return;
      }

      setBudget(prev => {
        const updatedItems = prev.items.map(item =>
          item.service.id === serviceId
            ? {
                ...item,
                quantity,
                totalPrice: item.unitPrice * quantity,
              }
            : item
        );
        return {
          ...prev,
          items: updatedItems,
          totalValue: updatedItems.reduce((total, item) => total + item.totalPrice, 0),
        };
      });
    },
    [removeService]
  );

  const updateBudgetInfo = useCallback((name: string, clientName: string) => {
    setBudget(prev => ({
      ...prev,
      name,
      clientName,
    }));
  }, []);

  const clearBudget = useCallback(() => {
    setBudget({
      name: '',
      clientName: '',
      items: [],
      totalValue: 0,
    });
  }, []);

  const isServiceSelected = useCallback(
    (serviceId: string) => {
      return budget.items.some(item => item.service.id === serviceId);
    },
    [budget.items]
  );

  const getServiceQuantity = useCallback(
    (serviceId: string) => {
      const item = budget.items.find(item => item.service.id === serviceId);
      return item?.quantity || 0;
    },
    [budget.items]
  );

  return {
    budget,
    loading,
    error,
    addService,
    removeService,
    updateQuantity,
    updateBudgetInfo,
    clearBudget,
    isServiceSelected,
    getServiceQuantity,
  };
}

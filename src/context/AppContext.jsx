import React, { createContext, useState } from 'react';
import { initialData } from '../store';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [data, setData] = useState(initialData);

  const updateCommission = (newCommission) => {
    setData(prev => ({ ...prev, commission: parseInt(newCommission) }));
  };

  const addBeneficiary = (beneficiary) => {
    setData(prev => ({ ...prev, beneficiaries: [...prev.beneficiaries, { ...beneficiary, id: Date.now() }] }));
  };

  const updateBeneficiary = (id, updatedFields) => {
    setData(prev => ({
      ...prev,
      beneficiaries: prev.beneficiaries.map(b => b.id === id ? { ...b, ...updatedFields } : b)
    }));
  };

  const toggleBeneficiaryStatus = (id) => {
    setData(prev => ({
      ...prev,
      beneficiaries: prev.beneficiaries.map(b => 
        b.id === id ? { ...b, status: b.status === 'activo' ? 'inactivo' : 'activo' } : b
      )
    }));
  };

  const addTransaction = (transaction) => {
    setData(prev => ({
      ...prev,
      transactions: [...(prev.transactions || []), { ...transaction, id: Date.now() }]
    }));
  };

  return (
    <AppContext.Provider value={{
      data,
      updateCommission,
      addBeneficiary,
      updateBeneficiary,
      toggleBeneficiaryStatus,
      addTransaction
    }}>
      {children}
    </AppContext.Provider>
  );
};

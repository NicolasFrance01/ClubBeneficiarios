import React, { createContext, useState, useEffect } from 'react';
import { initialData } from '../store';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [data, setData] = useState(initialData);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Simple local storage persistence for login state
  useEffect(() => {
    const isLogged = localStorage.getItem('atlascore_auth');
    if (isLogged === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const login = (email, password) => {
    // Basic mock authentication
    if (email === 'admin@atlascore.com' || email.includes('atlascore')) {
      setIsAuthenticated(true);
      localStorage.setItem('atlascore_auth', 'true');
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('atlascore_auth');
  };

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
      isAuthenticated,
      login,
      logout,
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


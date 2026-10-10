import React, { createContext, useState, useEffect } from 'react';
import { initialData } from '../store';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [data, setData] = useState(() => {
    const savedData = localStorage.getItem('atlascore_data');
    if (savedData) {
      try {
        return JSON.parse(savedData);
      } catch (e) {
        return initialData;
      }
    }
    return initialData;
  });
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeUser, setActiveUser] = useState(null);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('atlascore_data', JSON.stringify(data));
  }, [data]);

  // Simple local storage persistence for login state
  useEffect(() => {
    const isLogged = localStorage.getItem('atlascore_auth');
    const storedUserId = localStorage.getItem('atlascore_user_id');
    
    if (isLogged === 'true' && storedUserId) {
      const u = data.users.find(user => user.id.toString() === storedUserId);
      if (u) {
        setIsAuthenticated(true);
        setActiveUser(u);
      }
    }
  }, [data.users]);

  const login = (email, password) => {
    const user = data.users.find(u => u.email === email && u.password === password);
    if (user) {
      if (user.needsPasswordChange) {
        return { requireChange: true, user };
      }
      setIsAuthenticated(true);
      setActiveUser(user);
      localStorage.setItem('atlascore_auth', 'true');
      localStorage.setItem('atlascore_user_id', user.id);
      return { success: true, user };
    }
    return { success: false, error: 'Credenciales incorrectas' };
  };

  const changePassword = (userId, newPassword) => {
    setData(prev => ({
      ...prev,
      users: prev.users.map(u => u.id === userId ? { ...u, password: newPassword, needsPasswordChange: false } : u)
    }));
    
    const user = data.users.find(u => u.id === userId);
    if (user) {
      setIsAuthenticated(true);
      setActiveUser({ ...user, password: newPassword, needsPasswordChange: false });
      localStorage.setItem('atlascore_auth', 'true');
      localStorage.setItem('atlascore_user_id', userId);
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setActiveUser(null);
    localStorage.removeItem('atlascore_auth');
    localStorage.removeItem('atlascore_user_id');
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

  const addUser = (user) => {
    setData(prev => ({
      ...prev,
      users: [...prev.users, { ...user, id: Date.now() }]
    }));
  };

  const updateUser = (id, updatedFields) => {
    setData(prev => ({
      ...prev,
      users: prev.users.map(u => u.id === id ? { ...u, ...updatedFields } : u)
    }));
  };

  const removeUser = (id) => {
    setData(prev => ({
      ...prev,
      users: prev.users.filter(u => u.id !== id)
    }));
  };

  return (
    <AppContext.Provider value={{
      data,
      isAuthenticated,
      activeUser,
      login,
      logout,
      changePassword,
      updateCommission,
      addBeneficiary,
      updateBeneficiary,
      toggleBeneficiaryStatus,
      addTransaction,
      addUser,
      updateUser,
      removeUser
    }}>
      {children}
    </AppContext.Provider>
  );
};


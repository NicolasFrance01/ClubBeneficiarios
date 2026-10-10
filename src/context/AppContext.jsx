import React, { createContext, useState, useEffect } from 'react';
import { initialData } from '../store';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [data, setData] = useState(initialData);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeUser, setActiveUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const mapDbToApp = (dbData) => {
    return {
      ...initialData,
      users: dbData.users.map(u => ({
        ...u,
        needsPasswordChange: u.needs_password_change
      })),
      beneficiaries: dbData.beneficiaries.map(b => ({
        ...b,
        paymentMethod: b.payment_method,
        referredBy: b.referred_by,
        foto_frente: b.foto_frente,
        foto_dorso: b.foto_dorso
      })),
      transactions: dbData.transactions.map(t => ({
        ...t,
        comprobanteUrl: t.comprobante_url
      }))
    };
  };

  const fetchDb = async () => {
    try {
      const res = await fetch('/api/sync');
      if (res.ok) {
        const dbData = await res.json();
        setData(mapDbToApp(dbData));
      }
    } catch (e) {
      console.error("Failed to sync with DB", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDb();
  }, []);

  const syncAction = async (action, payload) => {
    try {
      await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, payload })
      });
      // We don't block the UI wait, we just trust it updates.
    } catch (e) {
      console.error("Action sync failed", e);
    }
  };

  useEffect(() => {
    const isLogged = localStorage.getItem('atlascore_auth_v2');
    const storedUserId = localStorage.getItem('atlascore_user_id_v2');
    
    if (!isLoading && isLogged === 'true' && storedUserId) {
      const u = data.users.find(user => user.id.toString() === storedUserId);
      if (u) {
        setIsAuthenticated(true);
        setActiveUser(u);
      }
    }
  }, [isLoading, data.users]);

  const login = (email, password) => {
    const user = data.users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
    if (user) {
      if (user.needsPasswordChange) {
        return { requireChange: true, user };
      }
      setIsAuthenticated(true);
      setActiveUser(user);
      localStorage.setItem('atlascore_auth_v2', 'true');
      localStorage.setItem('atlascore_user_id_v2', user.id);
      return { success: true, user };
    }
    return { success: false, error: 'Credenciales incorrectas' };
  };

  const changePassword = (userId, newPassword) => {
    const updatedUser = { id: userId, password: newPassword, needsPasswordChange: false };
    
    setData(prev => ({
      ...prev,
      users: prev.users.map(u => u.id === userId ? { ...u, ...updatedUser } : u)
    }));
    
    syncAction('UPDATE_USER', updatedUser);

    const user = data.users.find(u => u.id === userId);
    if (user) {
      setIsAuthenticated(true);
      setActiveUser({ ...user, ...updatedUser });
      localStorage.setItem('atlascore_auth_v2', 'true');
      localStorage.setItem('atlascore_user_id_v2', userId);
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setActiveUser(null);
    localStorage.removeItem('atlascore_auth_v2');
    localStorage.removeItem('atlascore_user_id_v2');
  };

  const updateCommission = (newCommission) => {
    setData(prev => ({ ...prev, commission: parseInt(newCommission) }));
  };

  const addBeneficiary = (beneficiary) => {
    const tempId = Date.now();
    setData(prev => ({ ...prev, beneficiaries: [...prev.beneficiaries, { ...beneficiary, id: tempId }] }));
    syncAction('ADD_BENEFICIARY', beneficiary).then(() => fetchDb());
  };

  const updateBeneficiary = (id, updatedFields) => {
    setData(prev => ({
      ...prev,
      beneficiaries: prev.beneficiaries.map(b => b.id === id ? { ...b, ...updatedFields } : b)
    }));
    syncAction('UPDATE_BENEFICIARY', { id, ...updatedFields });
  };

  const toggleBeneficiaryStatus = (id) => {
    const beneficiary = data.beneficiaries.find(b => b.id === id);
    if (!beneficiary) return;
    const newStatus = beneficiary.status === 'activo' ? 'inactivo' : 'activo';
    
    setData(prev => ({
      ...prev,
      beneficiaries: prev.beneficiaries.map(b => 
        b.id === id ? { ...b, status: newStatus } : b
      )
    }));
    syncAction('UPDATE_BENEFICIARY', { id, status: newStatus });
  };

  const removeBeneficiary = (id) => {
    setData(prev => ({
      ...prev,
      beneficiaries: prev.beneficiaries.filter(b => b.id !== id)
    }));
    syncAction('DELETE_BENEFICIARY', { id });
  };

  const addTransaction = (transaction) => {
    const tempId = Date.now();
    setData(prev => ({
      ...prev,
      transactions: [{ ...transaction, id: tempId }, ...(prev.transactions || [])]
    }));
    syncAction('ADD_TRANSACTION', transaction).then(() => fetchDb());
  };

  const addUser = (user) => {
    const tempId = Date.now();
    setData(prev => ({
      ...prev,
      users: [...prev.users, { ...user, id: tempId }]
    }));
    syncAction('ADD_USER', user).then(() => fetchDb());
  };

  const updateUser = (id, updatedFields) => {
    setData(prev => ({
      ...prev,
      users: prev.users.map(u => u.id === id ? { ...u, ...updatedFields } : u)
    }));
    syncAction('UPDATE_USER', { id, ...updatedFields });
  };

  const removeUser = (id) => {
    setData(prev => ({
      ...prev,
      users: prev.users.filter(u => u.id !== id)
    }));
    syncAction('DELETE_USER', { id });
  };

  if (isLoading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg-main)', color: 'var(--primary)' }}>Cargando datos del servidor...</div>;
  }

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
      removeBeneficiary,
      addTransaction,
      addUser,
      updateUser,
      removeUser
    }}>
      {children}
    </AppContext.Provider>
  );
};

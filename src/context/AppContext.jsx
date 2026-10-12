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
      users: dbData.users ? dbData.users.map(u => ({
        ...u,
        needsPasswordChange: u.needs_password_change
      })) : initialData.users,
      beneficiaries: dbData.beneficiaries ? dbData.beneficiaries.map(b => ({
        ...b,
        paymentMethod: b.payment_method,
        referredBy: b.referred_by,
        referente: b.referred_by,
        foto_frente: b.foto_frente,
        foto_dorso: b.foto_dorso
      })) : [],
      transactions: dbData.transactions ? dbData.transactions.map(t => ({
        ...t,
        comprobanteUrl: t.comprobante_url
      })) : [],
      referents: dbData.referents ? dbData.referents.map(r => ({
        ...r,
        cbuAlias: r.cbu_alias,
        commissionType: r.commission_type || 'ingreso',
        commissionMonths: Number(r.commission_months) || 1,
        commissionAmount: Number(r.commission_amount) || 2500,
        createdAt: r.created_at
      })) : [],
      plans: dbData.plans && dbData.plans.length > 0 ? dbData.plans.map(p => ({
        id: p.id,
        name: p.name,
        basePrice: Number(p.base_price),
        commission: Number(p.commission),
        description: p.description,
        includes: p.includes,
        sedes: p.sedes
      })) : initialData.plans
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

  const login = async (email, password) => {
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const data = await res.json();
      
      if (res.ok && data.success) {
        if (data.user.needsPasswordChange) {
          return { requireChange: true, user: data.user };
        }
        setIsAuthenticated(true);
        setActiveUser(data.user);
        localStorage.setItem('atlascore_auth_v2', 'true');
        localStorage.setItem('atlascore_user_id_v2', data.user.id);
        return { success: true, user: data.user };
      } else {
        return { success: false, error: data.error || 'Credenciales incorrectas' };
      }
    } catch (e) {
      console.error('Login error', e);
      return { success: false, error: 'Error de red' };
    }
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
    syncAction('UPDATE_BENEFICIARY', { id, ...updatedFields }).then(() => fetchDb());
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
    syncAction('UPDATE_BENEFICIARY', { id, status: newStatus }).then(() => fetchDb());
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

  const updatePlanCommission = (planId, newCommission) => {
    const num = Number(newCommission);
    setData(prev => ({
      ...prev,
      plans: prev.plans.map(p => p.id === planId ? { ...p, commission: num } : p)
    }));
    syncAction('UPDATE_PLAN', { id: planId, commission: num });
  };

  const addReferent = (referent) => {
    const tempId = Date.now();
    setData(prev => ({
      ...prev,
      referents: [...(prev.referents || []), { ...referent, id: tempId }]
    }));
    syncAction('ADD_REFERENT', referent).then(() => fetchDb());
  };

  const updateReferent = (id, updatedFields) => {
    setData(prev => ({
      ...prev,
      referents: (prev.referents || []).map(r => r.id === id ? { ...r, ...updatedFields } : r)
    }));
    syncAction('UPDATE_REFERENT', { id, ...updatedFields });
  };

  const removeReferent = (id) => {
    setData(prev => ({
      ...prev,
      referents: (prev.referents || []).filter(r => r.id !== id)
    }));
    syncAction('DELETE_REFERENT', { id });
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
      updatePlanCommission,
      addBeneficiary,
      updateBeneficiary,
      toggleBeneficiaryStatus,
      removeBeneficiary,
      addTransaction,
      addUser,
      updateUser,
      removeUser,
      addReferent,
      updateReferent,
      removeReferent
    }}>
      {children}
    </AppContext.Provider>
  );
};

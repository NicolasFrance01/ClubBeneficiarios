import React, { useContext, useState } from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, CreditCard, BadgeDollarSign, ShieldCheck, Dumbbell, LogOut, ChevronLeft, ChevronRight } from 'lucide-react';
import { AppContext } from './context/AppContext';
import Dashboard from './pages/Dashboard';
import Beneficiaries from './pages/Beneficiaries';
import Plans from './pages/Plans';
import Payments from './pages/Payments';
import SystemUsers from './pages/SystemUsers';
import FitnessGroups from './pages/FitnessGroups';
import Login from './pages/Login';
import './App.css';

function App() {
  const { isAuthenticated, logout } = useContext(AppContext);
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <BrowserRouter>
      <div className="app-container">
        <aside className={`sidebar glass-panel ${isCollapsed ? 'collapsed' : ''}`}>
          <div className="sidebar-header">
            <ShieldCheck size={32} color="var(--primary)" style={{ minWidth: '32px' }} />
            {!isCollapsed && <h2>Atlascore</h2>}
          </div>
          {!isCollapsed && <p className="sidebar-subtitle">Beneficios Fitness</p>}
          
          <nav className="sidebar-nav" style={{ flex: 1, marginTop: isCollapsed ? '2rem' : '0' }}>
            <NavLink to="/" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'} title="Dashboard">
              <LayoutDashboard size={20} style={{ minWidth: '20px' }} />
              {!isCollapsed && <span>Dashboard</span>}
            </NavLink>
            <NavLink to="/beneficiarios" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'} title="Beneficiarios">
              <Users size={20} style={{ minWidth: '20px' }} />
              {!isCollapsed && <span>Beneficiarios</span>}
            </NavLink>
            <NavLink to="/planes" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'} title="Planes y Valores">
              <CreditCard size={20} style={{ minWidth: '20px' }} />
              {!isCollapsed && <span>Planes y Valores</span>}
            </NavLink>
            <NavLink to="/fitness-groups" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'} title="Liquidación FG">
              <Dumbbell size={20} style={{ minWidth: '20px' }} />
              {!isCollapsed && <span>Liquidación FG</span>}
            </NavLink>
            <NavLink to="/pagos" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'} title="Pagos e Historial">
              <BadgeDollarSign size={20} style={{ minWidth: '20px' }} />
              {!isCollapsed && <span>Pagos e Historial</span>}
            </NavLink>
            <NavLink to="/usuarios" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'} title="Fundadores">
              <ShieldCheck size={20} style={{ minWidth: '20px' }} />
              {!isCollapsed && <span>Fundadores</span>}
            </NavLink>
          </nav>

          <div style={{ padding: '1rem', borderTop: '1px solid var(--border-light)', marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <button onClick={() => setIsCollapsed(!isCollapsed)} className="nav-item" style={{ background: 'transparent', border: 'none', width: '100%', cursor: 'pointer', justifyContent: isCollapsed ? 'center' : 'flex-start' }} title="Colapsar menú">
              {isCollapsed ? <ChevronRight size={20} style={{ minWidth: '20px' }} /> : <ChevronLeft size={20} style={{ minWidth: '20px' }} />}
              {!isCollapsed && <span>Ocultar Menú</span>}
            </button>
            <button onClick={logout} className="nav-item" style={{ background: 'transparent', border: 'none', width: '100%', cursor: 'pointer', color: 'var(--danger)', justifyContent: isCollapsed ? 'center' : 'flex-start' }} title="Cerrar Sesión">
              <LogOut size={20} style={{ minWidth: '20px' }} />
              {!isCollapsed && <span>Cerrar Sesión</span>}
            </button>
          </div>
        </aside>
        
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/beneficiarios" element={<Beneficiaries />} />
            <Route path="/planes" element={<Plans />} />
            <Route path="/fitness-groups" element={<FitnessGroups />} />
            <Route path="/pagos" element={<Payments />} />
            <Route path="/usuarios" element={<SystemUsers />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;

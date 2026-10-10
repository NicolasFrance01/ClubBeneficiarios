import React from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, CreditCard, BadgeDollarSign, ShieldCheck, Dumbbell } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Beneficiaries from './pages/Beneficiaries';
import Plans from './pages/Plans';
import Payments from './pages/Payments';
import SystemUsers from './pages/SystemUsers';
import FitnessGroups from './pages/FitnessGroups';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        <aside className="sidebar glass-panel">
          <div className="sidebar-header">
            <ShieldCheck size={32} color="var(--primary)" />
            <h2>Atlascore</h2>
          </div>
          <p className="sidebar-subtitle">Beneficios Fitness</p>
          
          <nav className="sidebar-nav">
            <NavLink to="/" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
              <LayoutDashboard size={20} />
              <span>Dashboard</span>
            </NavLink>
            <NavLink to="/beneficiarios" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
              <Users size={20} />
              <span>Beneficiarios</span>
            </NavLink>
            <NavLink to="/planes" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
              <CreditCard size={20} />
              <span>Planes y Valores</span>
            </NavLink>
            <NavLink to="/fitness-groups" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
              <Dumbbell size={20} />
              <span>Liquidación FG</span>
            </NavLink>
            <NavLink to="/pagos" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
              <BadgeDollarSign size={20} />
              <span>Pagos e Historial</span>
            </NavLink>
            <NavLink to="/usuarios" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
              <ShieldCheck size={20} />
              <span>Fundadores</span>
            </NavLink>
          </nav>
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

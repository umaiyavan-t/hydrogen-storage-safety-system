import React from 'react';
import {
  LayoutDashboard,
  Cylinder,
  Activity,
  AlertTriangle,
  Wrench,
  ShieldCheck,
  Flame,
  LogOut
} from 'lucide-react';

export const Sidebar = ({ currentTab, setCurrentTab, alertCount = 0, currentUser, onLogout }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'vessels', label: 'Storage Tanks', icon: Cylinder },
    { id: 'telemetry', label: 'Live Charts', icon: Activity },
    { id: 'alerts', label: 'Safety Alerts', icon: AlertTriangle, badge: alertCount },
    { id: 'maintenance', label: 'Maintenance', icon: Wrench },
    { id: 'compliance', label: 'Inspections', icon: ShieldCheck }
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo-badge">
          <Flame size={20} />
        </div>
        <div>
          <div className="brand-title">H2Shield</div>
          <div className="brand-subtitle">Hydrogen Facility Monitor</div>
        </div>
      </div>

      <nav className="nav-links">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setCurrentTab(item.id)}
            >
              <Icon size={18} />
              <span>{item.label}</span>
              {item.badge > 0 && (
                <span className="nav-badge badge-critical">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        {currentUser && (
          <div style={{ marginBottom: 14, paddingBottom: 12, borderBottom: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
              <span style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: currentUser.role === 'SAFETY_ENGINEER' ? '#dc2626' : currentUser.role === 'OPERATOR' ? '#059669' : '#2563eb'
              }}></span>
              <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.85rem' }}>{currentUser.name}</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', marginBottom: 8, fontFamily: 'monospace' }}>
              {currentUser.badge} • {currentUser.roleTitle}
            </div>
            <button
              id="sidebar-btn-switch-role"
              className="btn btn-secondary btn-sm"
              onClick={onLogout}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: '0.78rem' }}
            >
              <LogOut size={13} />
              <span>Switch Role</span>
            </button>
          </div>
        )}
        <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: 2 }}>Storage Zone Alpha</div>
        <div>NFPA 2 & ISO 19880 Safe</div>
      </div>
    </aside>
  );
};

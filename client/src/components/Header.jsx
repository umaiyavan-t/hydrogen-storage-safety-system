import React from 'react';
import { PlusCircle, LogOut } from 'lucide-react';
import { StatusBadge } from './StatusBadge';

export const Header = ({ title, facilityStatus, isConnected, onOpenIncidentModal, currentUser, onLogout }) => {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <h1 className="page-heading">{title}</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <StatusBadge status={facilityStatus || 'NOMINAL_OPERATIONS'} />
          <div className="facility-status-chip" style={{ background: '#f1f5f9', color: '#475569' }}>
            <span className={`live-indicator-dot ${isConnected ? '' : 'disconnected'}`} style={{ backgroundColor: isConnected ? '#10b981' : '#94a3b8' }}></span>
            <span>{isConnected ? 'Live Telemetry' : 'Offline'}</span>
          </div>
        </div>
      </div>

      <div className="topbar-right" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {currentUser && (
          <div id="user-profile-badge" style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 8,
            padding: '5px 10px',
            fontSize: '0.8rem'
          }}>
            <div style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: currentUser.role === 'SAFETY_ENGINEER' ? '#dc2626' : currentUser.role === 'OPERATOR' ? '#059669' : '#2563eb'
            }}></div>
            <div>
              <span id="header-user-name" style={{ fontWeight: 700, color: '#0f172a' }}>{currentUser.name}</span>
              <span id="header-user-role" style={{ color: '#64748b', marginLeft: 4 }}>({currentUser.badge} • {currentUser.roleTitle})</span>
            </div>
          </div>
        )}

        <button 
          id="btn-switch-role"
          className="btn btn-secondary btn-sm"
          onClick={onLogout}
          title="Switch active user or change role"
          style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <LogOut size={14} color="#64748b" />
          <span>Switch Role</span>
        </button>

        <button 
          className="btn btn-secondary btn-sm"
          onClick={onOpenIncidentModal}
          style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <PlusCircle size={15} color="var(--color-primary)" />
          <span>Report an Issue</span>
        </button>
      </div>
    </header>
  );
};

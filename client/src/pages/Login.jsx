import React, { useState } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  UserCheck, 
  KeyRound, 
  Lock, 
  ChevronRight, 
  Flame, 
  FileCheck2, 
  AlertCircle 
} from 'lucide-react';
import { api } from '../services/api';

const DEFAULT_PERSONNEL = [
  {
    userId: 'usr-thorne',
    badge: 'SE-7001',
    name: 'Dr. Aris Thorne',
    role: 'SAFETY_ENGINEER',
    roleTitle: 'Plant Safety Engineer',
    zone: 'All High-Pressure Buffers & Cryo Enclosures',
    clearance: 'Level 4: Full Actuation & Emergency Shutdown',
    accentColor: '#dc2626',
    bgColor: '#fef2f2',
    borderColor: '#fca5a5',
    pin: '7001',
    permissions: [
      'Emergency Venting & Deluge Actuation',
      'MAWP & Safety Threshold Overrides',
      'Emergency Shutdown (ESD) Triggers',
      '1-Click Safety Alert Resolution'
    ]
  },
  {
    userId: 'usr-vance',
    badge: 'OP-4202',
    name: 'Marcus Vance',
    role: 'OPERATOR',
    roleTitle: 'Control Room Operator',
    zone: 'Zone Alpha & Beta Monitoring',
    clearance: 'Level 2: Telemetry & Alarm Acknowledgment',
    accentColor: '#059669',
    bgColor: '#ecfdf5',
    borderColor: '#6ee7b7',
    pin: '4202',
    permissions: [
      'Live 4s Telemetry Streaming & Monitoring',
      'Audible/Visual Alarm Acknowledgment',
      'Operator Emergency Relief Actuation',
      'Threshold Modification: RESTRICTED'
    ]
  },
  {
    userId: 'usr-rostova',
    badge: 'AUD-9103',
    name: 'Elena Rostova',
    role: 'COMPLIANCE_AUDITOR',
    roleTitle: 'Lead Compliance Auditor',
    zone: 'Regulatory & Inspection Division',
    clearance: 'Level 1: Inspection & Compliance Sign-Off',
    accentColor: '#2563eb',
    bgColor: '#eff6ff',
    borderColor: '#93c5fd',
    pin: '9103',
    permissions: [
      'NFPA 2 & ISO 19880-1 Audit Verification',
      'Historical Sensor Log Data Export',
      'Inspection Task Sign-Off & Verification',
      'Actuator Hardware Control: RESTRICTED'
    ]
  }
];

export const Login = ({ onLogin }) => {
  const [selectedUser, setSelectedUser] = useState(DEFAULT_PERSONNEL[0]);
  const [enteredPin, setEnteredPin] = useState('7001');
  const [errorMsg, setErrorMsg] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleSelectPersonnel = (person) => {
    setSelectedUser(person);
    setEnteredPin(person.pin);
    setErrorMsg('');
  };

  const handleAuthenticate = async (userToAuth, pinToUse) => {
    const user = userToAuth || selectedUser;
    const pin = pinToUse || enteredPin;
    setIsAuthenticating(true);
    setErrorMsg('');

    try {
      const res = await api.login({ userId: user.userId, pin });
      if (res.success && res.data) {
        onLogin(res.data);
      } else {
        setErrorMsg(res.message || 'Authentication failed. Invalid PIN.');
      }
    } catch {
      // Fallback for offline execution
      onLogin(user);
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0f172a',
      color: '#f8fafc',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '32px 16px',
      fontFamily: 'Inter, system-ui, sans-serif'
    }}>
      {/* Brand Header */}
      <div style={{ textAlign: 'center', maxWidth: 720, marginBottom: 32 }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          background: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          color: '#fca5a5',
          borderRadius: 999,
          padding: '6px 16px',
          fontSize: '0.8rem',
          fontWeight: 600,
          marginBottom: 16
        }}>
          <Flame size={14} color="#ef4444" />
          <span>NFPA 2 & ISO 19880-1 INDUSTRIAL SAFETY CONTROL ENCLAVE</span>
        </div>

        <h1 style={{
          fontSize: '2rem',
          fontWeight: 800,
          letterSpacing: '-0.025em',
          margin: '0 0 8px 0',
          color: '#ffffff'
        }}>
          Hydrogen Storage Facility Safety System
        </h1>
        <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.95rem' }}>
          Role-Based Access Control (RVAC) Security Verification. Select authorized personnel to proceed.
        </p>
      </div>

      {/* Personnel Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 20,
        maxWidth: 1040,
        width: '100%',
        marginBottom: 28
      }}>
        {DEFAULT_PERSONNEL.map((person) => {
          const isSelected = selectedUser.userId === person.userId;
          return (
            <div
              key={person.userId}
              id={`role-card-${person.role.toLowerCase()}`}
              onClick={() => handleSelectPersonnel(person)}
              style={{
                backgroundColor: isSelected ? '#1e293b' : '#131e33',
                border: `2px solid ${isSelected ? person.accentColor : 'rgba(255, 255, 255, 0.08)'}`,
                borderRadius: 14,
                padding: 20,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                position: 'relative',
                boxShadow: isSelected ? `0 8px 24px -4px ${person.accentColor}33` : 'none'
              }}
            >
              {/* Badge & Clearance Chip */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  padding: '3px 8px',
                  borderRadius: 6,
                  fontSize: '0.75rem',
                  fontFamily: 'monospace',
                  fontWeight: 700,
                  color: '#cbd5e1'
                }}>
                  {person.badge}
                </span>
                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  color: person.accentColor
                }}>
                  {person.role}
                </span>
              </div>

              {/* Name & Title */}
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 4px 0', color: '#ffffff' }}>
                {person.name}
              </h3>
              <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: 14 }}>
                {person.roleTitle}
              </div>

              {/* Clearance */}
              <div style={{
                background: person.bgColor,
                border: `1px solid ${person.borderColor}`,
                color: person.accentColor,
                padding: '6px 10px',
                borderRadius: 8,
                fontSize: '0.75rem',
                fontWeight: 600,
                marginBottom: 14
              }}>
                {person.clearance}
              </div>

              {/* Permissions list */}
              <div style={{ fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.5, marginBottom: 16 }}>
                {person.permissions.map((perm, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ color: perm.includes('RESTRICTED') ? '#f87171' : person.accentColor }}>•</span>
                    <span style={{ color: perm.includes('RESTRICTED') ? '#ef4444' : '#cbd5e1' }}>{perm}</span>
                  </div>
                ))}
              </div>

              {/* Quick Login Button */}
              <button
                id={`login-btn-${person.userId.replace('usr-', '')}`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleAuthenticate(person, person.pin);
                }}
                style={{
                  width: '100%',
                  background: isSelected ? person.accentColor : 'rgba(255, 255, 255, 0.08)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 8,
                  padding: '10px 14px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  transition: 'background 0.15s'
                }}
              >
                <span>Authorize as {person.name.split(' ')[0]}</span>
                <ChevronRight size={15} />
              </button>
            </div>
          );
        })}
      </div>

      {/* Manual Authentication Form */}
      <div style={{
        maxWidth: 520,
        width: '100%',
        backgroundColor: '#1e293b',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: 14,
        padding: 24
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <Lock size={18} color="#38bdf8" />
          <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#f1f5f9' }}>
            Selected Operator: <strong style={{ color: '#38bdf8' }}>{selectedUser.name}</strong> ({selectedUser.badge})
          </span>
        </div>

        {errorMsg && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#fca5a5',
            padding: '8px 12px',
            borderRadius: 8,
            fontSize: '0.85rem',
            marginBottom: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <AlertCircle size={15} color="#ef4444" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={(e) => { e.preventDefault(); handleAuthenticate(selectedUser, enteredPin); }}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: 6 }}>
              Security Access PIN (Default for {selectedUser.name.split(' ')[0]}: <code style={{ color: '#38bdf8' }}>{selectedUser.pin}</code>)
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="input-pin"
                type="password"
                value={enteredPin}
                onChange={(e) => setEnteredPin(e.target.value)}
                maxLength={6}
                placeholder="Enter 4-digit PIN"
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  backgroundColor: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: 8,
                  padding: '10px 14px 10px 36px',
                  color: '#ffffff',
                  fontSize: '0.95rem',
                  fontFamily: 'monospace'
                }}
              />
              <KeyRound size={16} color="#64748b" style={{ position: 'absolute', left: 12, top: 12 }} />
            </div>
          </div>

          <button
            id="btn-submit-auth"
            type="submit"
            disabled={isAuthenticating}
            style={{
              width: '100%',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              border: 'none',
              borderRadius: 8,
              padding: '12px',
              fontSize: '0.95rem',
              fontWeight: 600,
              cursor: isAuthenticating ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8
            }}
          >
            <UserCheck size={18} />
            <span>{isAuthenticating ? 'Authenticating...' : `Confirm Clearance & Access Console`}</span>
          </button>
        </form>
      </div>
    </div>
  );
};

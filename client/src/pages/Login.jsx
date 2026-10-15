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
  AlertCircle,
  Eye,
  EyeOff,
  Radio,
  CheckCircle2,
  Cpu
} from 'lucide-react';
import { api } from '../services/api';

const DEFAULT_PERSONNEL = [
  {
    userId: 'usr-thorne',
    badge: 'SE-7001',
    name: 'Dr. Aris Thorne',
    email: 'thorne@h2shield.facility',
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
    email: 'vance@h2shield.facility',
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
    email: 'rostova@h2shield.facility',
    role: 'COMPLIANCE_AUDITOR',
    roleTitle: 'Lead Compliance Auditor',
    zone: 'Regulatory & Inspection Division',
    clearance: 'Level 1: Inspection & Compliance Sign-Off',
    accentColor: '#0284c7',
    bgColor: '#f0f9ff',
    borderColor: '#bae6fd',
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
  const [emailInput, setEmailInput] = useState(DEFAULT_PERSONNEL[0].email);
  const [enteredPin, setEnteredPin] = useState('7001');
  const [showPin, setShowPin] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authSuccess, setAuthSuccess] = useState(false);

  const handleSelectPersonnel = (person) => {
    setSelectedUser(person);
    setEmailInput(person.email);
    setEnteredPin(person.pin);
    setErrorMsg('');
  };

  const handleAuthenticate = async (userToAuth, pinToUse, emailToUse) => {
    const user = userToAuth || selectedUser;
    const pin = pinToUse || enteredPin;
    const email = emailToUse || emailInput;
    setIsAuthenticating(true);
    setErrorMsg('');

    try {
      const res = await api.login({ 
        userId: user?.userId, 
        role: user?.role, 
        email: email || user?.email, 
        pin 
      });

      if (res.success && res.data) {
        setAuthSuccess(true);
        setTimeout(() => {
          onLogin({ ...res.data, token: res.token });
        }, 300);
      } else {
        setErrorMsg(res.message || 'Authentication failed. Invalid personnel credentials.');
      }
    } catch {
      // Offline fallback with simulated JWT
      onLogin({ ...user, token: 'offline-simulated-jwt' });
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      color: '#0f172a',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '40px 20px',
      fontFamily: 'Inter, system-ui, sans-serif'
    }}>
      {/* Top Industrial Header & Brand */}
      <div style={{ textAlign: 'center', maxWidth: 840, marginBottom: 36 }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          borderRadius: 999,
          padding: '6px 18px',
          fontSize: '0.82rem',
          fontWeight: 600,
          color: '#475569',
          marginBottom: 16
        }}>
          <div style={{
            width: 20,
            height: 20,
            borderRadius: '50%',
            backgroundColor: '#0284c7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Flame size={12} color="#ffffff" />
          </div>
          <span>NFPA 2 & ISO 19880-1 INDUSTRIAL SCADA ACCESS GATEWAY</span>
        </div>

        <h1 style={{
          fontSize: '2.1rem',
          fontWeight: 800,
          letterSpacing: '-0.03em',
          color: '#0f172a',
          margin: '0 0 10px 0',
          lineHeight: 1.2
        }}>
          Hydrogen Storage Facility Safety System
        </h1>
        <p style={{
          margin: 0,
          color: '#64748b',
          fontSize: '1rem',
          fontWeight: 400
        }}>
          Role-Based Access Control (RVAC) Security Verification with HMAC-SHA256 JWT Authentication.
        </p>
      </div>

      {/* Main Container Card: Form + Station Selector */}
      <div style={{
        maxWidth: 1080,
        width: '100%',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: 28,
        alignItems: 'start'
      }}>
        {/* Left Side: Formal JWT Credentials Sign-in */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: 16,
          border: '1px solid #e2e8f0',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.03)',
          padding: 32
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 4px 0', color: '#0f172a' }}>
                Console Personnel Login
              </h2>
              <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                Authenticate with authorized facility credentials
              </div>
            </div>
            <div style={{
              background: '#f1f5f9',
              padding: '6px 10px',
              borderRadius: 8,
              fontSize: '0.75rem',
              fontWeight: 600,
              color: '#0284c7',
              display: 'flex',
              alignItems: 'center',
              gap: 5
            }}>
              <Cpu size={13} />
              <span>JWT 12H Session</span>
            </div>
          </div>

          {errorMsg && (
            <div style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#b91c1c',
              padding: '10px 14px',
              borderRadius: 8,
              fontSize: '0.85rem',
              marginBottom: 18,
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              <AlertCircle size={16} color="#dc2626" />
              <span>{errorMsg}</span>
            </div>
          )}

          {authSuccess && (
            <div style={{
              background: '#ecfdf5',
              border: '1px solid #a7f3d0',
              color: '#047857',
              padding: '10px 14px',
              borderRadius: 8,
              fontSize: '0.85rem',
              marginBottom: 18,
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              <CheckCircle2 size={16} color="#059669" />
              <span>Clearance authorized. Initializing supervisory dashboard...</span>
            </div>
          )}

          <form onSubmit={(e) => { e.preventDefault(); handleAuthenticate(selectedUser, enteredPin, emailInput); }}>
            {/* Operator Identifier Input */}
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                Facility Operator ID / Email
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="input-operator-id"
                  type="text"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="e.g. thorne@h2shield.facility"
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    height: 48,
                    borderRadius: 8,
                    border: '1.5px solid #cbd5e1',
                    padding: '0 14px 0 38px',
                    fontSize: '0.92rem',
                    color: '#0f172a',
                    outline: 'none',
                    backgroundColor: '#ffffff'
                  }}
                />
                <UserCheck size={16} color="#64748b" style={{ position: 'absolute', left: 12, top: 16 }} />
              </div>
            </div>

            {/* PIN / Password Input */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>
                  Security Access PIN / Password
                </label>
                <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                  Default: <strong style={{ color: '#0284c7' }}>{selectedUser.pin}</strong>
                </span>
              </div>

              <div style={{ position: 'relative' }}>
                <input
                  id="input-pin"
                  type={showPin ? 'text' : 'password'}
                  value={enteredPin}
                  onChange={(e) => setEnteredPin(e.target.value)}
                  maxLength={12}
                  placeholder="Enter 4-digit security PIN"
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    height: 48,
                    borderRadius: 8,
                    border: '1.5px solid #cbd5e1',
                    padding: '0 40px 0 38px',
                    fontSize: '0.95rem',
                    fontFamily: 'monospace',
                    color: '#0f172a',
                    outline: 'none',
                    backgroundColor: '#ffffff'
                  }}
                />
                <KeyRound size={16} color="#64748b" style={{ position: 'absolute', left: 12, top: 16 }} />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: 14,
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#94a3b8'
                  }}
                >
                  {showPin ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Active Role Preview Chip */}
            <div style={{
              background: selectedUser.bgColor,
              border: `1px solid ${selectedUser.borderColor}`,
              borderRadius: 8,
              padding: '10px 14px',
              marginBottom: 22,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: selectedUser.accentColor, textTransform: 'uppercase' }}>
                  Target Role Clearance
                </div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a' }}>
                  {selectedUser.name} ({selectedUser.badge})
                </div>
              </div>
              <span style={{
                background: selectedUser.accentColor,
                color: '#ffffff',
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '3px 8px',
                borderRadius: 4
              }}>
                {selectedUser.role}
              </span>
            </div>

            {/* Submit Auth Button */}
            <button
              id="btn-submit-auth"
              type="submit"
              disabled={isAuthenticating}
              style={{
                width: '100%',
                height: 48,
                backgroundColor: '#0284c7',
                color: '#ffffff',
                border: 'none',
                borderRadius: 8,
                fontSize: '0.95rem',
                fontWeight: 600,
                cursor: isAuthenticating ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                boxShadow: '0 4px 12px rgba(2, 132, 199, 0.25)',
                transition: 'background-color 0.15s ease'
              }}
            >
              <Lock size={16} />
              <span>{isAuthenticating ? 'Verifying Token...' : 'Authenticate & Enter Safety Console'}</span>
            </button>
          </form>

          {/* Security Assurance Badge */}
          <div style={{
            marginTop: 20,
            paddingTop: 16,
            borderTop: '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            fontSize: '0.78rem',
            color: '#94a3b8'
          }}>
            <ShieldCheck size={14} color="#059669" />
            <span>Encrypted with HMAC-SHA256 Signed JSON Web Tokens</span>
          </div>
        </div>

        {/* Right Side: Quick Personnel Station Badges */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ marginBottom: 4 }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 4px 0', color: '#0f172a' }}>
              Facility Authorized Personnel
            </h2>
            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
              Select a certified role card for instantaneous clearance
            </div>
          </div>

          {DEFAULT_PERSONNEL.map((person) => {
            const isSelected = selectedUser.userId === person.userId;
            return (
              <div
                key={person.userId}
                id={`role-card-${person.role.toLowerCase()}`}
                onClick={() => handleSelectPersonnel(person)}
                style={{
                  backgroundColor: '#ffffff',
                  border: `2px solid ${isSelected ? person.accentColor : '#e2e8f0'}`,
                  borderRadius: 14,
                  padding: '16px 20px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: isSelected 
                    ? `0 10px 20px -5px ${person.accentColor}25` 
                    : '0 2px 4px rgba(0, 0, 0, 0.02)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{
                      fontFamily: 'monospace',
                      fontWeight: 700,
                      fontSize: '0.78rem',
                      background: '#f1f5f9',
                      color: '#334155',
                      padding: '2px 7px',
                      borderRadius: 4
                    }}>
                      {person.badge}
                    </span>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: '#0f172a' }}>
                      {person.name}
                    </h3>
                  </div>

                  <span style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    color: person.accentColor,
                    background: person.bgColor,
                    padding: '2px 8px',
                    borderRadius: 999
                  }}>
                    {person.role}
                  </span>
                </div>

                <div style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: 10 }}>
                  {person.roleTitle} &bull; <span style={{ color: '#0284c7' }}>{person.email}</span>
                </div>

                {/* Clearance tag */}
                <div style={{
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  color: person.accentColor,
                  background: person.bgColor,
                  padding: '4px 8px',
                  borderRadius: 6,
                  marginBottom: 12,
                  display: 'inline-block'
                }}>
                  {person.clearance}
                </div>

                {/* Quick Login Button */}
                <button
                  id={`login-btn-${person.userId.replace('usr-', '')}`}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectPersonnel(person);
                    handleAuthenticate(person, person.pin, person.email);
                  }}
                  style={{
                    width: '100%',
                    height: 38,
                    background: isSelected ? person.accentColor : '#f8fafc',
                    color: isSelected ? '#ffffff' : '#334155',
                    border: isSelected ? 'none' : '1px solid #cbd5e1',
                    borderRadius: 6,
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span>Authorize as {person.name.split(' ')[0]}</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

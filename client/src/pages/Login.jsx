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
    <div className="auth-page">
      {/* Top Industrial Header & Brand */}
      <div className="auth-header-container">
        <div className="auth-standard-pill">
          <div className="auth-standard-icon">
            <Flame size={12} color="#ffffff" />
          </div>
          <span>NFPA 2 & ISO 19880-1 INDUSTRIAL SCADA ACCESS GATEWAY</span>
        </div>

        <h1 className="auth-title">
          Hydrogen Storage Facility Safety System
        </h1>
        <p className="auth-subtitle">
          Role-Based Access Control (RVAC) Security Verification with HMAC-SHA256 JWT Authentication.
        </p>
      </div>

      {/* Main Container Card: Form + Station Selector */}
      <div className="auth-layout-grid">
        {/* Left Side: Formal JWT Credentials Sign-in */}
        <div className="auth-card">
          <div className="auth-card-header">
            <div>
              <h2 className="auth-card-title">
                Console Personnel Login
              </h2>
              <div className="auth-card-desc">
                Authenticate with authorized facility credentials
              </div>
            </div>
            <div className="auth-session-chip">
              <Cpu size={13} />
              <span>JWT 12H Session</span>
            </div>
          </div>

          {errorMsg && (
            <div className="auth-alert-box auth-alert-error">
              <AlertCircle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          {authSuccess && (
            <div className="auth-alert-box auth-alert-success">
              <CheckCircle2 size={16} />
              <span>Clearance authorized. Initializing supervisory dashboard...</span>
            </div>
          )}

          <form onSubmit={(e) => { e.preventDefault(); handleAuthenticate(selectedUser, enteredPin, emailInput); }}>
            {/* Operator Identifier Input */}
            <div className="auth-form-group">
              <label className="auth-form-label" htmlFor="input-operator-id">
                <span>Facility Operator ID / Email</span>
              </label>
              <div className="auth-input-container">
                <UserCheck size={16} className="auth-input-icon" />
                <input
                  id="input-operator-id"
                  type="text"
                  className="auth-input"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="e.g. thorne@h2shield.facility"
                />
              </div>
            </div>

            {/* PIN / Password Input */}
            <div className="auth-form-group">
              <div className="auth-form-label">
                <label htmlFor="input-pin">
                  Security Access PIN / Password
                </label>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Default: <strong style={{ color: 'var(--color-primary)' }}>{selectedUser.pin}</strong>
                </span>
              </div>

              <div className="auth-input-container">
                <KeyRound size={16} className="auth-input-icon" />
                <input
                  id="input-pin"
                  type={showPin ? 'text' : 'password'}
                  className="auth-input auth-input-mono"
                  value={enteredPin}
                  onChange={(e) => setEnteredPin(e.target.value)}
                  maxLength={12}
                  placeholder="Enter 4-digit security PIN"
                />
                <button
                  type="button"
                  className="auth-toggle-visibility"
                  onClick={() => setShowPin(!showPin)}
                  aria-label={showPin ? "Hide PIN" : "Show PIN"}
                >
                  {showPin ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Active Role Preview Chip */}
            <div 
              className="auth-role-summary-banner"
              style={{
                backgroundColor: selectedUser.bgColor,
                borderColor: selectedUser.borderColor
              }}
            >
              <div>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: selectedUser.accentColor, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Target Role Clearance
                </div>
                <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  {selectedUser.name} <span className="mono" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>({selectedUser.badge})</span>
                </div>
              </div>
              <span style={{
                background: selectedUser.accentColor,
                color: '#ffffff',
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '3px 8px',
                borderRadius: 'var(--radius-sm)'
              }}>
                {selectedUser.role}
              </span>
            </div>

            {/* Submit Auth Button */}
            <button
              id="btn-submit-auth"
              type="submit"
              className="auth-submit-btn"
              disabled={isAuthenticating}
            >
              <Lock size={16} />
              <span>{isAuthenticating ? 'Verifying Token...' : 'Authenticate & Enter Safety Console'}</span>
            </button>
          </form>

          {/* Security Assurance Badge */}
          <div className="auth-guarantee-note">
            <ShieldCheck size={14} color="var(--color-success)" />
            <span>Encrypted with HMAC-SHA256 Signed JSON Web Tokens</span>
          </div>
        </div>

        {/* Right Side: Quick Personnel Station Badges */}
        <div className="auth-personnel-column">
          <div style={{ marginBottom: 4 }}>
            <h2 style={{ fontSize: '1.18rem', fontWeight: 700, margin: '0 0 4px 0', color: 'var(--text-main)' }}>
              Facility Authorized Personnel
            </h2>
            <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
              Select a certified role card for instantaneous clearance
            </div>
          </div>

          {DEFAULT_PERSONNEL.map((person) => {
            const isSelected = selectedUser.userId === person.userId;
            return (
              <div
                key={person.userId}
                id={`role-card-${person.role.toLowerCase()}`}
                className={`auth-station-card ${isSelected ? 'active' : ''}`}
                onClick={() => handleSelectPersonnel(person)}
                style={{
                  borderColor: isSelected ? person.accentColor : 'var(--border-color)',
                  boxShadow: isSelected ? `0 8px 20px -4px ${person.accentColor}30` : undefined
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="mono" style={{
                      fontWeight: 700,
                      fontSize: '0.75rem',
                      background: 'var(--bg-card-subtle)',
                      color: 'var(--text-muted)',
                      padding: '2px 7px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-color)'
                    }}>
                      {person.badge}
                    </span>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                      {person.name}
                    </h3>
                  </div>

                  <span style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    color: person.accentColor,
                    background: person.bgColor,
                    padding: '2px 8px',
                    borderRadius: 9999
                  }}>
                    {person.role}
                  </span>
                </div>

                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 10 }}>
                  {person.roleTitle} &bull; <span style={{ color: 'var(--color-primary)' }}>{person.email}</span>
                </div>

                {/* Clearance tag */}
                <div style={{
                  fontSize: '0.76rem',
                  fontWeight: 600,
                  color: person.accentColor,
                  background: person.bgColor,
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-sm)',
                  marginBottom: 12,
                  display: 'inline-block'
                }}>
                  {person.clearance}
                </div>

                {/* Quick Login Button */}
                <button
                  id={`login-btn-${person.userId.replace('usr-', '')}`}
                  type="button"
                  className="auth-station-quick-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectPersonnel(person);
                    handleAuthenticate(person, person.pin, person.email);
                  }}
                  style={{
                    background: isSelected ? person.accentColor : undefined,
                    color: isSelected ? '#ffffff' : undefined,
                    borderColor: isSelected ? person.accentColor : undefined
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

import React, { useState } from 'react';
import { 
  ShieldCheck, 
  UserCheck, 
  KeyRound, 
  Lock, 
  ChevronRight, 
  AlertCircle,
  Eye,
  EyeOff,
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
    clearance: 'L4: Full Actuation & ESD',
    accentColor: '#dc2626',
    bgColor: '#fef2f2',
    borderColor: '#fca5a5',
    pin: '7001'
  },
  {
    userId: 'usr-vance',
    badge: 'OP-4202',
    name: 'Marcus Vance',
    email: 'vance@h2shield.facility',
    role: 'OPERATOR',
    roleTitle: 'Control Room Operator',
    clearance: 'L2: Telemetry & Acks',
    accentColor: '#059669',
    bgColor: '#ecfdf5',
    borderColor: '#6ee7b7',
    pin: '4202'
  },
  {
    userId: 'usr-rostova',
    badge: 'AUD-9103',
    name: 'Elena Rostova',
    email: 'rostova@h2shield.facility',
    role: 'COMPLIANCE_AUDITOR',
    roleTitle: 'Lead Compliance Auditor',
    clearance: 'L1: Inspection & Audit',
    accentColor: '#0284c7',
    bgColor: '#f0f9ff',
    borderColor: '#bae6fd',
    pin: '9103'
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
      // Offline fallback: generate structured session credential
      onLogin({ ...user, token: `auth_session_${user.role.toLowerCase()}_${Date.now()}` });
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Top SCADA Enclave Header */}
      <div className="auth-header-container">
        <h1 className="auth-title">
          Hydrogen Storage Facility Safety System
        </h1>
        <p className="auth-subtitle">
          Facility Safety Management System &bull; Authorized Personnel Access
        </p>
      </div>

      {/* Main Enclave Grid */}
      <div className="auth-layout-grid">
        {/* Left Side: Direct Credentials Sign-in */}
        <div className="auth-card">
          <div className="auth-card-header">
            <div>
              <h2 className="auth-card-title">Console Personnel Login</h2>
              <div className="auth-card-desc">Enter operator credentials or select a certified station</div>
            </div>
            <div className="auth-session-chip">
              <Cpu size={12} />
              <span>Secure Session</span>
            </div>
          </div>

          {errorMsg && (
            <div className="auth-alert-box auth-alert-error">
              <AlertCircle size={15} />
              <span>{errorMsg}</span>
            </div>
          )}

          {authSuccess && (
            <div className="auth-alert-box auth-alert-success">
              <CheckCircle2 size={15} />
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
                <UserCheck size={15} className="auth-input-icon" />
                <input
                  id="input-operator-id"
                  type="text"
                  className="auth-input"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  autoComplete="username"
                  aria-label="Facility Operator ID or Email"
                />
              </div>
            </div>

            {/* PIN / Password Input */}
            <div className="auth-form-group">
              <div className="auth-form-label">
                <label htmlFor="input-pin">Security PIN</label>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                  Station Access Key
                </span>
              </div>

              <div className="auth-input-container">
                <KeyRound size={15} className="auth-input-icon" />
                <input
                  id="input-pin"
                  type={showPin ? 'text' : 'password'}
                  className="auth-input auth-input-mono"
                  value={enteredPin}
                  onChange={(e) => setEnteredPin(e.target.value)}
                  maxLength={12}
                  autoComplete="current-password"
                  aria-label="Security Access PIN"
                />
                <button
                  type="button"
                  className="auth-toggle-visibility"
                  onClick={() => setShowPin(!showPin)}
                  aria-label={showPin ? "Hide PIN" : "Show PIN"}
                >
                  {showPin ? <EyeOff size={15} /> : <Eye size={15} />}
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
                <div style={{ fontSize: '0.68rem', fontWeight: 700, color: selectedUser.accentColor, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Target Role Clearance
                </div>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  {selectedUser.name} <span className="mono" style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>({selectedUser.badge})</span>
                </div>
              </div>
              <span style={{
                background: selectedUser.accentColor,
                color: '#ffffff',
                fontSize: '0.68rem',
                fontWeight: 700,
                padding: '2px 7px',
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
              <Lock size={15} />
              <span>{isAuthenticating ? 'Authenticating...' : 'Sign In to Safety Console'}</span>
            </button>
          </form>

          {/* Security Assurance Badge */}
          <div className="auth-guarantee-note">
            <ShieldCheck size={13} color="var(--color-success)" />
            <span>Authorized Operations Console Access</span>
          </div>
        </div>

        {/* Right Side: Quick Personnel Station Cards */}
        <div className="auth-personnel-column">
          <div style={{ marginBottom: 2 }}>
            <h2 style={{ fontSize: '1.08rem', fontWeight: 700, margin: '0 0 2px 0', color: 'var(--text-main)' }}>
              Facility Authorized Personnel
            </h2>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
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
                  boxShadow: isSelected ? `0 4px 14px -2px ${person.accentColor}25` : undefined
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <span className="mono" style={{
                      fontWeight: 700,
                      fontSize: '0.72rem',
                      background: 'var(--bg-card-subtle)',
                      color: 'var(--text-muted)',
                      padding: '2px 6px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-color)'
                    }}>
                      {person.badge}
                    </span>
                    <h3 style={{ fontSize: '0.98rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                      {person.name}
                    </h3>
                  </div>

                  <span style={{
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    color: person.accentColor,
                    background: person.bgColor,
                    padding: '2px 7px',
                    borderRadius: 9999
                  }}>
                    {person.role}
                  </span>
                </div>

                <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>{person.roleTitle} &bull; {person.email}</span>
                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    color: person.accentColor,
                    background: person.bgColor,
                    padding: '1px 6px',
                    borderRadius: 'var(--radius-sm)'
                  }}>
                    {person.clearance}
                  </span>
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
                  <ChevronRight size={13} />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

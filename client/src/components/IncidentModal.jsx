import React, { useState } from 'react';
import { X, AlertOctagon, Send, Flame, AlertTriangle, Wrench, Thermometer } from 'lucide-react';

export const IncidentModal = ({ vessels, onClose, onSubmit }) => {
  const [vesselId, setVesselId] = useState(vessels[0]?.vesselId || 'H2-TNK-01');
  const [severity, setSeverity] = useState('CRITICAL');
  const [metric, setMetric] = useState('Flammable Gas Leak');
  const [message, setMessage] = useState('Hydrogen gas odor and perimeter sensor dispersion detected.');
  const [activePreset, setActivePreset] = useState('leak');
  const [loading, setLoading] = useState(false);

  const presets = [
    {
      id: 'leak',
      label: 'Gas Leak / Odor',
      icon: Flame,
      severity: 'CRITICAL',
      metric: 'Flammable Gas Dispersion Leak',
      message: 'Hydrogen gas odor and perimeter sensor dispersion detected near flange seal.'
    },
    {
      id: 'pressure',
      label: 'High Pressure Spike',
      icon: AlertTriangle,
      severity: 'CRITICAL',
      metric: 'Abnormal High Pressure Spike',
      message: 'Pressure reading rapidly climbing towards maximum allowable working limit.'
    },
    {
      id: 'valve',
      label: 'Valve Stuck / Jam',
      icon: Wrench,
      severity: 'WARNING',
      metric: 'Actuator Valve Jam',
      message: 'Solenoid isolation valve not responding to automatic safety closure command.'
    },
    {
      id: 'temp',
      label: 'High Temperature',
      icon: Thermometer,
      severity: 'WARNING',
      metric: 'Excessive Tank Core Temperature',
      message: 'Vessel skin surface temperature exceeding normal cryogenic operating limits.'
    }
  ];

  const handleSelectPreset = (p) => {
    setActivePreset(p.id);
    setSeverity(p.severity);
    setMetric(p.metric);
    setMessage(p.message);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    try {
      setLoading(true);
      await onSubmit({
        vesselId,
        severity,
        metric,
        message,
        triggerValue: 'Manual Safety Report',
        thresholdValue: 'Safety Limit'
      });
      onClose();
    } catch (err) {
      console.error('Failed to submit incident alert:', err);
    } finally {
      setLoading(false);
    }
  };

  const selectedVesselObj = vessels.find(v => v.vesselId === vesselId) || vessels[0];

  return (
    <div className="modal-backdrop">
      <div className="modal-card" style={{ maxWidth: 540, width: '92%' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ 
              width: 32, 
              height: 32, 
              borderRadius: 8, 
              background: '#fef2f2', 
              color: '#dc2626', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              <AlertOctagon size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0 }}>Report a Safety Issue</h3>
              <p style={{ fontSize: '0.76rem', color: 'var(--text-dim)', margin: 0 }}>
                Instant broadcast to all safety consoles & logs
              </p>
            </div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={onClose} style={{ padding: 4 }}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            
            {/* Quick 1-Click Presets */}
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>
                Select Issue Type (1-Click Presets):
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {presets.map(p => {
                  const Icon = p.icon;
                  const isSelected = activePreset === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleSelectPreset(p)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '10px 12px',
                        borderRadius: 8,
                        border: `1.5px solid ${isSelected ? 'var(--color-primary)' : 'var(--border-color)'}`,
                        background: isSelected ? 'var(--color-primary-light)' : '#ffffff',
                        color: isSelected ? 'var(--color-primary)' : 'var(--text-main)',
                        fontWeight: isSelected ? 700 : 500,
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                        textAlign: 'left'
                      }}
                    >
                      <Icon size={16} color={isSelected ? 'var(--color-primary)' : '#64748b'} />
                      <span>{p.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Target Tank Picker */}
            <div className="form-group">
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                Affected Storage Tank:
              </label>
              <select 
                className="form-input"
                value={vesselId}
                onChange={e => setVesselId(e.target.value)}
                style={{ fontWeight: 600 }}
              >
                {vessels.map(v => (
                  <option key={v.vesselId} value={v.vesselId}>
                    {v.vesselId} — {v.name} ({v.currentPressureBar} bar)
                  </option>
                ))}
              </select>
            </div>

            {/* Details Box */}
            <div className="form-group">
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                Issue Description:
              </label>
              <textarea 
                className="form-input"
                rows="3"
                value={message}
                onChange={e => setMessage(e.target.value)}
                aria-label="Issue description"
                required
                style={{ fontSize: '0.85rem' }}
              />
            </div>
          </div>

          <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
              Tank: <strong className="mono">{vesselId}</strong> | Severity: <strong>{severity}</strong>
            </span>

            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn btn-sm btn-danger-solid" 
                disabled={loading}
                style={{ fontWeight: 700 }}
              >
                <Send size={13} />
                <span>{loading ? 'Submitting...' : 'Submit Safety Alert'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

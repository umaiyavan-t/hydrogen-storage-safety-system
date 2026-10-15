import React, { useState } from 'react';
import { X, Sliders, Check } from 'lucide-react';

export const ThresholdModal = ({ vessel, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    warningPressureBar: vessel?.warningPressureBar || 650,
    maxPressureBar: vessel?.maxPressureBar || 700,
    warningTempC: vessel?.warningTempC || 45,
    maxTempC: vessel?.maxTempC || 65,
    maxLelPercentage: vessel?.maxLelPercentage || 25
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    await onSave(vessel.vesselId, formData);
    setSubmitting(false);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sliders size={18} style={{ color: 'var(--color-primary)' }} />
            <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Calibrate Safety Thresholds</h3>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={onClose} style={{ padding: 4 }}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Configuring dynamic safety envelopes for <strong>{vessel.name}</strong> ({vessel.vesselId}).
            </div>

            <div className="form-group">
              <label>Warning Pressure Threshold (bar)</label>
              <input 
                type="number" 
                className="form-input mono"
                value={formData.warningPressureBar}
                onChange={e => setFormData({ ...formData, warningPressureBar: Number(e.target.value) })}
                required 
              />
            </div>

            <div className="form-group">
              <label>Critical Pressure Relief Limit (bar)</label>
              <input 
                type="number" 
                className="form-input mono"
                value={formData.maxPressureBar}
                onChange={e => setFormData({ ...formData, maxPressureBar: Number(e.target.value) })}
                required 
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label>Warning Temp (°C)</label>
                <input 
                  type="number" 
                  step="0.1"
                  className="form-input mono"
                  value={formData.warningTempC}
                  onChange={e => setFormData({ ...formData, warningTempC: Number(e.target.value) })}
                  required 
                />
              </div>
              <div className="form-group">
                <label>Max Temp (°C)</label>
                <input 
                  type="number" 
                  step="0.1"
                  className="form-input mono"
                  value={formData.maxTempC}
                  onChange={e => setFormData({ ...formData, maxTempC: Number(e.target.value) })}
                  required 
                />
              </div>
            </div>

            <div className="form-group">
              <label>Max LEL % Ceiling (OSHA standard is 25% LEL)</label>
              <input 
                type="number" 
                step="0.5"
                className="form-input mono"
                value={formData.maxLelPercentage}
                onChange={e => setFormData({ ...formData, maxLelPercentage: Number(e.target.value) })}
                required 
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              <Check size={16} />
              <span>{submitting ? 'Updating...' : 'Apply Thresholds'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

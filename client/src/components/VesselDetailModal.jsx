import React, { useState } from 'react';
import { 
  X, 
  Wind, 
  Sliders, 
  ShieldAlert, 
  Cpu, 
  Gauge, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  ArrowRight
} from 'lucide-react';
import { StatusBadge } from './StatusBadge';

export const VesselDetailModal = ({ 
  vessel, 
  onClose, 
  onToggleReliefValve, 
  onOpenThresholdModal 
}) => {
  const [inletOpen, setInletOpen] = useState(true);
  const [outletOpen, setOutletOpen] = useState(true);

  if (!vessel) return null;

  const pressureRatio = Math.min(100, ((vessel.currentPressureBar / vessel.maxPressureBar) * 100)).toFixed(1);
  const lelRatio = Math.min(100, ((vessel.lelPercentage / vessel.maxLelPercentage) * 100)).toFixed(1);

  return (
    <div className="modal-backdrop">
      <div 
        className="modal-card" 
        style={{ 
          maxWidth: 680, 
          width: '95%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Modal Header */}
        <div className="modal-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span className="mono" style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--color-primary)' }}>
                {vessel.vesselId}
              </span>
              <StatusBadge status={vessel.status} />
              <span style={{ fontSize: '0.75rem', background: '#f1f5f9', padding: '2px 8px', borderRadius: 12, color: 'var(--text-muted)' }}>
                {vessel.type}
              </span>
            </div>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>{vessel.name}</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Location: {vessel.zone}</span>
          </div>

          <button className="btn btn-secondary btn-sm" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body" style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* Pressure & Safety Envelope Gauge */}
          <div style={{ background: '#f8fafc', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Gauge size={18} style={{ color: 'var(--color-primary)' }} />
                <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Vessel Pressure & Safety Limits</span>
              </div>
              <span className="mono" style={{ fontWeight: 800, fontSize: '1.2rem', color: vessel.currentPressureBar > vessel.warningPressureBar ? 'var(--color-danger)' : 'var(--text-main)' }}>
                {vessel.currentPressureBar} <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>bar</span>
              </span>
            </div>

            {/* Visual Multi-Segment Bar */}
            <div style={{ height: 14, background: '#e2e8f0', borderRadius: 8, overflow: 'hidden', position: 'relative', marginBottom: 8 }}>
              <div 
                style={{ 
                  height: '100%', 
                  width: `${pressureRatio}%`,
                  background: vessel.currentPressureBar >= vessel.maxPressureBar 
                    ? 'var(--color-danger)' 
                    : vessel.currentPressureBar >= vessel.warningPressureBar 
                    ? 'var(--color-warning)' 
                    : 'var(--color-primary)',
                  transition: 'width 0.4s ease, background 0.4s ease'
                }} 
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-dim)', fontFamily: 'monospace' }}>
              <span>0 bar</span>
              <span>Warning: {vessel.warningPressureBar} bar</span>
              <span>MAWP Ceiling: {vessel.maxPressureBar} bar</span>
            </div>
          </div>

          {/* Real-Time Solenoid Actuator Controls */}
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Cpu size={16} />
              <span>Solenoid Valve Actuators & Emergency Interlocks</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
              
              {/* Emergency Relief Vent Solenoid */}
              <div style={{ 
                border: '1px solid var(--border-color)', 
                borderRadius: 'var(--radius-md)', 
                padding: 14,
                background: vessel.reliefValveOpen ? '#fef2f2' : '#ffffff'
              }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: 4 }}>Overpressure Vent Solenoid</div>
                <div style={{ fontWeight: 700, fontSize: '0.92rem', color: vessel.reliefValveOpen ? 'var(--color-danger)' : 'var(--text-main)', marginBottom: 10 }}>
                  {vessel.reliefValveOpen ? 'VENT OPEN (VENTING)' : 'SOLENOID CLOSED'}
                </div>
                <button 
                  className={`btn btn-sm ${vessel.reliefValveOpen ? 'btn-danger-solid' : 'btn-secondary'}`}
                  style={{ width: '100%' }}
                  onClick={() => onToggleReliefValve(vessel.vesselId, !vessel.reliefValveOpen)}
                >
                  <Wind size={14} />
                  <span>{vessel.reliefValveOpen ? 'Close Vent' : 'Actuate Emergency Vent'}</span>
                </button>
              </div>

              {/* Inlet Valve */}
              <div style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: 14, background: '#ffffff' }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: 4 }}>Cryogenic Inlet Solenoid</div>
                <div style={{ fontWeight: 700, fontSize: '0.92rem', color: inletOpen ? 'var(--color-success)' : 'var(--text-dim)', marginBottom: 10 }}>
                  {inletOpen ? 'INLET ACTIVE' : 'INLET ISOLATED'}
                </div>
                <button 
                  className="btn btn-secondary btn-sm"
                  style={{ width: '100%' }}
                  onClick={() => setInletOpen(!inletOpen)}
                >
                  <span>{inletOpen ? 'Isolate Inlet' : 'Open Inlet'}</span>
                </button>
              </div>

              {/* Outlet Valve */}
              <div style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: 14, background: '#ffffff' }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: 4 }}>Dispense Outlet Solenoid</div>
                <div style={{ fontWeight: 700, fontSize: '0.92rem', color: outletOpen ? 'var(--color-success)' : 'var(--text-dim)', marginBottom: 10 }}>
                  {outletOpen ? 'FLOW ENABLED' : 'FLOW BLOCKED'}
                </div>
                <button 
                  className="btn btn-secondary btn-sm"
                  style={{ width: '100%' }}
                  onClick={() => setOutletOpen(!outletOpen)}
                >
                  <span>{outletOpen ? 'Block Flow' : 'Enable Flow'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Sensor Diagnostics */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: 12, background: '#ffffff' }}>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-dim)' }}>H2 Ambient Concentration</div>
              <div className="mono" style={{ fontWeight: 800, fontSize: '1.05rem', marginTop: 2 }}>
                {vessel.currentH2ConcentrationPpm} ppm <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-dim)' }}>({vessel.lelPercentage}% LEL)</span>
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>
                Lower Explosive Limit (LEL) warning band: &gt; 10%
              </div>
            </div>

            <div style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: 12, background: '#ffffff' }}>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-dim)' }}>Sensor Signal Integrity</div>
              <div className="mono" style={{ fontWeight: 800, fontSize: '1.05rem', marginTop: 2, color: vessel.sensorHealthPercent < 70 ? 'var(--color-danger)' : 'var(--color-success)' }}>
                {vessel.sensorHealthPercent}% Healthy
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>
                Signal-to-noise ratio: Nominal 4-20mA loop
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button 
            className="btn btn-secondary btn-sm"
            onClick={() => {
              onClose();
              onOpenThresholdModal(vessel);
            }}
          >
            <Sliders size={14} />
            <span>Configure Safety Thresholds</span>
          </button>

          <button className="btn btn-primary btn-sm" onClick={onClose}>
            <span>Done</span>
          </button>
        </div>
      </div>
    </div>
  );
};

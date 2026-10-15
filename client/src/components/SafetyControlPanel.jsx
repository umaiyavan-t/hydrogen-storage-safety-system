import React, { useState } from 'react';
import { ShieldAlert, Wind, Droplets, Flame, FlaskConical, RotateCcw } from 'lucide-react';

export const SafetyControlPanel = ({ 
  vessels, 
  onTriggerESD, 
  facilityStatus 
}) => {
  const [activeDrill, setActiveDrill] = useState(null);
  const ventingCount = vessels.filter(v => v.reliefValveOpen).length;
  const criticalCount = vessels.filter(v => v.status === 'CRITICAL').length;

  const handleDrill = async (drillKey) => {
    setActiveDrill(drillKey);
    if (onTriggerESD) {
      await onTriggerESD(drillKey);
    }
  };

  return (
    <div className="panel" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="panel-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ShieldAlert size={18} style={{ color: criticalCount > 0 ? 'var(--color-danger)' : 'var(--color-warning)' }} />
          <div>
            <div className="panel-title">Emergency Controls</div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>
              Quick vent release & fire safety systems
            </div>
          </div>
        </div>

        <span className={`badge ${criticalCount > 0 ? 'badge-critical' : 'badge-nominal'}`}>
          {criticalCount > 0 ? 'TRIP READY' : 'ALL SAFE'}
        </span>
      </div>

      <div className="panel-body" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* ESD Vent Action Card */}
        <div style={{ 
          background: ventingCount > 0 ? '#fef2f2' : '#f8fafc', 
          border: `1px solid ${ventingCount > 0 ? '#fecaca' : 'var(--border-color)'}`,
          borderRadius: 'var(--radius-md)',
          padding: 12
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)' }}>Flare Relief Vents</span>
            <span className={`badge ${ventingCount > 0 ? 'badge-critical' : 'badge-nominal'}`} style={{ fontSize: '0.72rem' }}>
              {ventingCount > 0 ? `${ventingCount} Vents Open` : 'All Vents Closed'}
            </span>
          </div>
          
          <button 
            className="btn btn-sm btn-danger-solid"
            style={{ width: '100%', justifyContent: 'center', fontWeight: 700 }}
            onClick={() => handleDrill('ESD_VENT')}
          >
            <Wind size={14} />
            <span>Open Emergency Vents (All Tanks)</span>
          </button>
        </div>

        {/* Safety System Grid Tiles */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: 10, background: '#ffffff' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-primary)', marginBottom: 4 }}>
              <Droplets size={14} />
              <span style={{ fontSize: '0.76rem', fontWeight: 700 }}>Fire Sprinklers</span>
            </div>
            <div style={{ fontSize: '0.86rem', fontWeight: 800 }}>ARMED & READY</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>Automatic water deluge</div>
          </div>

          <div style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: 10, background: '#ffffff' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#f59e0b', marginBottom: 4 }}>
              <Flame size={14} />
              <span style={{ fontSize: '0.76rem', fontWeight: 700 }}>Flare Burner</span>
            </div>
            <div style={{ fontSize: '0.86rem', fontWeight: 800 }}>PILOT FLAME LIT</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>Safe hydrogen burning</div>
          </div>
        </div>

        {/* SCADA Safety Drill & Commissioning Scenarios */}
        <div style={{
          background: '#f8fafc',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          padding: 12
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <FlaskConical size={14} color="var(--color-primary)" />
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)' }}>
                SCADA Drill Scenarios
              </span>
            </div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Plant Simulation Mode</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            <button
              type="button"
              className="btn btn-sm btn-secondary"
              onClick={() => handleDrill('OVERPRESSURE')}
              title="Inject Overpressure Spike (695 bar)"
              style={{ fontSize: '0.75rem', padding: '6px 8px', justifyContent: 'flex-start', gap: 6 }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#dc2626', display: 'inline-block' }} />
              <span>Overpressure</span>
            </button>

            <button
              type="button"
              className="btn btn-sm btn-secondary"
              onClick={() => handleDrill('LEAK')}
              title="Simulate Flammable H2 Dispersion (18.5% LEL)"
              style={{ fontSize: '0.75rem', padding: '6px 8px', justifyContent: 'flex-start', gap: 6 }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#f59e0b', display: 'inline-block' }} />
              <span>Gas Dispersion</span>
            </button>

            <button
              type="button"
              className="btn btn-sm btn-secondary"
              onClick={() => handleDrill('SENSOR_FAIL')}
              title="Simulate Sensor Heartbeat Loss"
              style={{ fontSize: '0.75rem', padding: '6px 8px', justifyContent: 'flex-start', gap: 6 }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#a855f7', display: 'inline-block' }} />
              <span>Sensor Drop</span>
            </button>

            <button
              type="button"
              className="btn btn-sm btn-secondary"
              onClick={() => handleDrill('RESET')}
              title="Reset All Vessels & Alarms to Nominal Baseline"
              style={{ fontSize: '0.75rem', padding: '6px 8px', justifyContent: 'flex-start', gap: 6 }}
            >
              <RotateCcw size={12} color="#059669" />
              <span>Reset Facility</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

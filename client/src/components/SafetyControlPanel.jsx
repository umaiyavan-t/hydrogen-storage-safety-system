import React, { useState } from 'react';
import { ShieldAlert, Wind, Droplets, Flame, FlaskConical, RotateCcw, ShieldCheck } from 'lucide-react';

export const SafetyControlPanel = ({ 
  vessels, 
  onTriggerESD, 
  facilityStatus 
}) => {
  const [feedbackMsg, setFeedbackMsg] = useState(null);
  const [loadingAction, setLoadingAction] = useState(null);

  const ventingCount = vessels.filter(v => v.reliefValveOpen).length;
  const criticalCount = vessels.filter(v => v.status === 'CRITICAL').length;

  const handleDrill = async (drillKey, label) => {
    try {
      setLoadingAction(drillKey);
      if (label) setFeedbackMsg(`Executing: ${label}...`);
      if (onTriggerESD) {
        const res = await onTriggerESD(drillKey);
        if (res?.message) {
          setFeedbackMsg(res.message);
        } else if (label) {
          setFeedbackMsg(`Applied: ${label}`);
        }
      }
    } catch (err) {
      setFeedbackMsg(`Error: ${err.message}`);
    } finally {
      setLoadingAction(null);
      setTimeout(() => setFeedbackMsg(null), 4000);
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
          
          {ventingCount > 0 ? (
            <button 
              className="btn btn-sm btn-secondary"
              style={{ width: '100%', justifyContent: 'center', fontWeight: 700, gap: 6 }}
              onClick={() => handleDrill('CLOSE_VENTS', 'Seal All Vents')}
              disabled={loadingAction !== null}
            >
              <ShieldCheck size={14} style={{ color: 'var(--color-primary)' }} />
              <span>Seal All Emergency Vents (Close)</span>
            </button>
          ) : (
            <button 
              className="btn btn-sm btn-danger-solid"
              style={{ width: '100%', justifyContent: 'center', fontWeight: 700, gap: 6 }}
              onClick={() => handleDrill('ESD_VENT', 'Open All Vents')}
              disabled={loadingAction !== null}
            >
              <Wind size={14} />
              <span>Open Emergency Vents (All Tanks)</span>
            </button>
          )}
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

        {/* Integrated White-Theme Simulation Cockpit */}
        <div style={{
          background: '#f8fafc',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          padding: 12,
          display: 'flex',
          flexDirection: 'column',
          gap: 10
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <FlaskConical size={14} style={{ color: 'var(--color-primary)' }} />
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)' }}>
                Simulation Cockpit
              </span>
            </div>
            <span className="badge badge-nominal" style={{ fontSize: '0.68rem', padding: '2px 8px' }}>
              SCADA ENGINE
            </span>
          </div>

          {/* Drill Action Buttons Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <button
              type="button"
              className="btn btn-sm btn-secondary"
              onClick={() => handleDrill('OVERPRESSURE', 'Overpressure Spike')}
              disabled={loadingAction !== null}
              title="Progressive Overpressure Spike (695 bar)"
              style={{ fontSize: '0.74rem', padding: '6px 10px', justifyContent: 'flex-start', gap: 6 }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#dc2626', display: 'inline-block' }} />
              <span>Overpressure</span>
            </button>

            <button
              type="button"
              className="btn btn-sm btn-secondary"
              onClick={() => handleDrill('LEAK', 'Gas Leak')}
              disabled={loadingAction !== null}
              title="Flammable Gas Dispersion (18.5% LEL)"
              style={{ fontSize: '0.74rem', padding: '6px 10px', justifyContent: 'flex-start', gap: 6 }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#f59e0b', display: 'inline-block' }} />
              <span>Gas Dispersion</span>
            </button>

            <button
              type="button"
              className="btn btn-sm btn-secondary"
              onClick={() => handleDrill('SENSOR_FAIL', 'Sensor Drop')}
              disabled={loadingAction !== null}
              title="Sensor Signal Degradation (34%)"
              style={{ fontSize: '0.74rem', padding: '6px 10px', justifyContent: 'flex-start', gap: 6 }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#a855f7', display: 'inline-block' }} />
              <span>Sensor Drop</span>
            </button>

            <button
              type="button"
              className="btn btn-sm btn-secondary"
              onClick={() => handleDrill('CLOSE_VENTS', 'Seal All Vents')}
              disabled={loadingAction !== null}
              title="Immediately seal all 6 tank relief valves"
              style={{ fontSize: '0.74rem', padding: '6px 10px', justifyContent: 'flex-start', gap: 6 }}
            >
              <ShieldCheck size={13} color="#0284c7" />
              <span>Seal All Vents</span>
            </button>
          </div>

          {/* 1-Click Reset Baseline */}
          <button
            type="button"
            className="btn btn-sm btn-secondary"
            onClick={() => handleDrill('RESET', 'Reset Baseline')}
            disabled={loadingAction !== null}
            title="Restore all 6 vessels to normal operating baseline"
            style={{ 
              width: '100%', 
              justifyContent: 'center', 
              fontWeight: 700, 
              fontSize: '0.75rem',
              color: '#059669',
              background: '#ecfdf5',
              borderColor: '#a7f3d0',
              gap: 6
            }}
          >
            <RotateCcw size={12} color="#059669" />
            <span>Reset Plant Baseline</span>
          </button>

          {feedbackMsg && (
            <div style={{
              fontSize: '0.7rem',
              color: 'var(--text-muted)',
              textAlign: 'center',
              fontFamily: "'JetBrains Mono', monospace"
            }}>
              {feedbackMsg}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

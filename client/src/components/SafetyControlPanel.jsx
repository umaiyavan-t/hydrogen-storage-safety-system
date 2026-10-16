import React from 'react';
import { ShieldAlert, Wind, Droplets, Flame } from 'lucide-react';

export const SafetyControlPanel = ({ 
  vessels, 
  onTriggerESD, 
  facilityStatus 
}) => {
  const ventingCount = vessels.filter(v => v.reliefValveOpen).length;
  const criticalCount = vessels.filter(v => v.status === 'CRITICAL').length;

  const handleDrill = async (drillKey) => {
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
      </div>
    </div>
  );
};

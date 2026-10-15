import React from 'react';
import { Sliders, Wind, Eye } from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';

export const VesselsView = ({ 
  vessels, 
  onOpenThresholdModal, 
  onToggleReliefValve,
  onInspectVessel 
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="panel">
        <div className="panel-header">
          <div>
            <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>Pressure Storage Assets Directory</h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Complete vessel registry including Type IV composite tanks, cryogenic liquid dewars, and cavern buffers.
            </p>
          </div>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Vessel Identifier</th>
                <th>Asset Classification</th>
                <th>Safety Zone</th>
                <th>Inventory (kg)</th>
                <th>Operating Pressure</th>
                <th>Vessel Temp</th>
                <th>LEL % / PPM</th>
                <th>Relief Valve</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {vessels.map(v => (
                <tr key={v.vesselId} style={{ cursor: 'pointer' }}>
                  <td onClick={() => onInspectVessel && onInspectVessel(v)}>
                    <div className="mono" style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{v.vesselId}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{v.name}</div>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-main)' }}>{v.type}</span>
                  </td>
                  <td>
                    <span className="badge badge-info" style={{ fontSize: '0.72rem' }}>{v.zone}</span>
                  </td>
                  <td className="mono">
                    <strong>{v.currentStockKg.toLocaleString()}</strong> / {v.capacityKg.toLocaleString()} kg
                  </td>
                  <td className="mono">
                    <span style={{ fontWeight: 600 }}>{v.currentPressureBar}</span> / {v.maxPressureBar} bar
                  </td>
                  <td className="mono">
                    {v.currentTempC}°C
                  </td>
                  <td className="mono">
                    <span style={{ 
                      color: v.lelPercentage > 1.0 ? 'var(--color-warning)' : 'inherit',
                      fontWeight: v.lelPercentage > 1.0 ? 700 : 400
                    }}>
                      {v.lelPercentage}% ({v.currentH2ConcentrationPpm} ppm)
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${v.reliefValveOpen ? 'badge-critical' : 'badge-nominal'}`}>
                      {v.reliefValveOpen ? 'VENT OPEN' : 'SEALED'}
                    </span>
                  </td>
                  <td>
                    <StatusBadge status={v.status} />
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button 
                        className="btn btn-secondary btn-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onInspectVessel && onInspectVessel(v);
                        }}
                        title="Deep-Dive Inspect"
                      >
                        <Eye size={13} />
                        <span>Inspect</span>
                      </button>
                      <button 
                        className="btn btn-secondary btn-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenThresholdModal(v);
                        }}
                        title="Calibrate Safety Limits"
                      >
                        <Sliders size={13} />
                        <span>Limits</span>
                      </button>
                      <button 
                        className={`btn btn-sm ${v.reliefValveOpen ? 'btn-danger-solid' : 'btn-secondary'}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleReliefValve(v.vesselId, !v.reliefValveOpen);
                        }}
                      >
                        <Wind size={13} />
                        <span>{v.reliefValveOpen ? 'Close' : 'Vent'}</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

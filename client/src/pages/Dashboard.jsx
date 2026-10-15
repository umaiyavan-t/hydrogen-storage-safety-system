import React, { useState } from 'react';
import { 
  Database, 
  AlertTriangle, 
  ShieldCheck, 
  Gauge, 
  Wind, 
  CheckCircle, 
  Sliders, 
  Flame, 
  Eye,
  Check
} from 'lucide-react';
import { MetricCard } from '../components/MetricCard';
import { StatusBadge } from '../components/StatusBadge';
import { TelemetryAreaChart } from '../components/TelemetryAreaChart';
import { SafetyControlPanel } from '../components/SafetyControlPanel';

export const Dashboard = ({ 
  overview, 
  vessels, 
  alerts, 
  onAcknowledgeAlert, 
  onResolveAlert,
  onOpenThresholdModal, 
  onToggleReliefValve,
  onInspectVessel,
  onTriggerScenario 
}) => {
  const [selectedChartVesselId, setSelectedChartVesselId] = useState(vessels[0]?.vesselId || 'H2-TNK-01');
  const activeAlerts = alerts.filter(a => !a.resolved);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* 1. KPIs Bento Grid */}
      <div className="metrics-grid">
        <MetricCard 
          label="Stored Hydrogen" 
          value={overview?.currentStockKg ? overview.currentStockKg.toLocaleString() : '0'} 
          unit="kg"
          subtext={`of ${overview?.totalCapacityKg ? overview.totalCapacityKg.toLocaleString() : '0'} kg max capacity`}
          icon={Database}
          badgeText={`${overview?.storageUtilizationPercent || 0}%`}
          badgeType="info"
        />

        <MetricCard 
          label="Active Alerts" 
          value={overview?.openAlerts ?? 0} 
          unit={overview?.criticalAlerts ? `(${overview.criticalAlerts} Critical)` : ''}
          subtext={overview?.criticalAlerts > 0 ? 'Action required immediately' : 'All tanks within safe limits'}
          icon={AlertTriangle}
          badgeText={overview?.criticalAlerts > 0 ? 'URGENT' : 'NOMINAL'}
          badgeType={overview?.criticalAlerts > 0 ? 'critical' : 'nominal'}
        />

        <MetricCard 
          label="Sensor Health" 
          value={`${overview?.avgSensorHealth ?? 99}%`} 
          subtext="Gas & pressure sensor grid"
          icon={Gauge}
          badgeText="GOOD"
          badgeType="nominal"
        />

        <MetricCard 
          label="Inspection Score" 
          value={`${overview?.complianceScore ?? 100}%`} 
          subtext="NFPA 2 safety checklist"
          icon={ShieldCheck}
          badgeText="PASSED"
          badgeType="nominal"
        />
      </div>

      {/* 2. Visual Telemetry Chart & Safety Controls Split Bento Card */}
      <div className="bento-row">
        <TelemetryAreaChart 
          vessels={vessels} 
          selectedVesselId={selectedChartVesselId}
          onSelectVessel={setSelectedChartVesselId}
        />

        <SafetyControlPanel 
          vessels={vessels}
          onTriggerESD={onTriggerScenario}
          facilityStatus={overview?.facilityStatus}
        />
      </div>

      {/* 3. Active Safety Alerts Banner */}
      {activeAlerts.length > 0 && (
        <div className="panel" style={{ borderColor: 'var(--color-warning-border)' }}>
          <div className="panel-header" style={{ background: '#fffbeb' }}>
            <div className="panel-title" style={{ color: '#b45309' }}>
              <AlertTriangle size={18} />
              <span>Live Safety Alerts ({activeAlerts.length})</span>
            </div>
            <span style={{ fontSize: '0.78rem', color: '#92400e' }}>
              Resolve alerts directly below or click any tank to inspect
            </span>
          </div>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Alert ID</th>
                  <th>Severity</th>
                  <th>Tank</th>
                  <th>Issue</th>
                  <th>Reading</th>
                  <th>Details</th>
                  <th>Quick Action</th>
                </tr>
              </thead>
              <tbody>
                {activeAlerts.slice(0, 5).map(alert => (
                  <tr key={alert.alertId}>
                    <td className="mono" style={{ fontWeight: 600 }}>{alert.alertId}</td>
                    <td><StatusBadge status={alert.severity} /></td>
                    <td style={{ fontWeight: 600 }}>{alert.vesselName}</td>
                    <td>{alert.metric}</td>
                    <td className="mono" style={{ fontSize: '0.8rem', fontWeight: 600 }}>{alert.triggerValue}</td>
                    <td style={{ maxWidth: 300, fontSize: '0.82rem' }}>{alert.message}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        {!alert.acknowledged && (
                          <button 
                            className="btn btn-secondary btn-sm"
                            onClick={() => onAcknowledgeAlert(alert.alertId)}
                            title="Acknowledge you have seen this alert"
                          >
                            <span>Acknowledge</span>
                          </button>
                        )}
                        <button 
                          className="btn btn-sm btn-primary"
                          onClick={() => onResolveAlert && onResolveAlert(alert.alertId)}
                          style={{ padding: '4px 8px', fontSize: '0.75rem', background: '#059669', borderColor: '#059669' }}
                          title="Mark this safety issue as resolved"
                        >
                          <Check size={13} />
                          <span>Resolve</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. Storage Tanks Live Cards Grid */}
      <div className="panel">
        <div className="panel-header">
          <div className="panel-title">
            <Flame size={18} style={{ color: 'var(--color-primary)' }} />
            <span>Storage Tanks</span>
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
            Live readings updating every 3s — click any tank to inspect
          </span>
        </div>
        <div className="panel-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
            {vessels.map(v => {
              const pressurePct = Math.min(100, Math.round((v.currentPressureBar / v.maxPressureBar) * 100));
              const lelRatio = Math.min(100, Math.round((v.lelPercentage / v.maxLelPercentage) * 100));
              
              return (
                <div 
                  key={v.vesselId} 
                  style={{ 
                    border: '1px solid var(--border-color)', 
                    borderRadius: 'var(--radius-md)', 
                    padding: 16,
                    background: '#ffffff',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 14,
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span className="mono" style={{ fontSize: '0.78rem', color: 'var(--text-dim)', fontWeight: 600 }}>{v.vesselId}</span>
                        <StatusBadge status={v.status} />
                      </div>
                      <div style={{ fontWeight: 700, fontSize: '0.96rem', marginTop: 3 }}>{v.name}</div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{v.zone}</div>
                    </div>
                    
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button 
                        className="btn btn-secondary btn-sm" 
                        onClick={() => onInspectVessel && onInspectVessel(v)}
                        title="Inspect Tank & Valve Controls"
                      >
                        <Eye size={14} />
                        <span>Inspect</span>
                      </button>
                      <button 
                        className="btn btn-secondary btn-sm" 
                        onClick={() => onOpenThresholdModal(v)}
                        title="Calibrate Safety Limits"
                      >
                        <Sliders size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Pressure Metric Bar */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600 }}>
                      <span style={{ color: 'var(--text-muted)' }}>Tank Pressure</span>
                      <span className="mono">{v.currentPressureBar} / {v.maxPressureBar} bar</span>
                    </div>
                    <div className="telemetry-bar-wrap">
                      <div 
                        className="telemetry-bar-fill" 
                        style={{ 
                          width: `${pressurePct}%`,
                          backgroundColor: pressurePct > 90 ? 'var(--color-danger)' : pressurePct > 75 ? 'var(--color-warning)' : 'var(--color-primary)' 
                        }}
                      />
                    </div>
                  </div>

                  {/* LEL Flammability Metric Bar */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600 }}>
                      <span style={{ color: 'var(--text-muted)' }}>Gas Leak Level (% LEL)</span>
                      <span className="mono">{v.lelPercentage}% ({v.currentH2ConcentrationPpm} ppm)</span>
                    </div>
                    <div className="telemetry-bar-wrap">
                      <div 
                        className="telemetry-bar-fill" 
                        style={{ 
                          width: `${lelRatio}%`,
                          backgroundColor: lelRatio > 25 ? 'var(--color-danger)' : lelRatio > 10 ? 'var(--color-warning)' : 'var(--color-success)' 
                        }}
                      />
                    </div>
                  </div>

                  {/* Footer details & relief valve control */}
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between', 
                    paddingTop: 10, 
                    borderTop: '1px solid var(--border-color)',
                    fontSize: '0.8rem'
                  }}>
                    <div>
                      <span style={{ color: 'var(--text-dim)' }}>Temperature: </span>
                      <strong className="mono">{v.currentTempC}°C</strong>
                    </div>

                    <button 
                      className={`btn btn-sm ${v.reliefValveOpen ? 'btn-danger-solid' : 'btn-secondary'}`}
                      onClick={() => onToggleReliefValve(v.vesselId, !v.reliefValveOpen)}
                    >
                      <Wind size={13} />
                      <span>{v.reliefValveOpen ? 'Vent OPEN' : 'Emergency Vent'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

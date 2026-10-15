import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, CheckSquare, Search, Filter } from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';

export const AlertsIncidents = ({ alerts, onAcknowledgeAlert, onResolveAlert }) => {
  const [filterSeverity, setFilterSeverity] = useState('ALL');
  const [showResolved, setShowResolved] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = alerts.filter(a => {
    if (!showResolved && a.resolved) return false;
    if (filterSeverity !== 'ALL' && a.severity !== filterSeverity) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        a.alertId.toLowerCase().includes(term) ||
        a.vesselName.toLowerCase().includes(term) ||
        a.message.toLowerCase().includes(term)
      );
    }
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Filters bar */}
      <div className="panel" style={{ padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexGrow: 1, maxWidth: 360 }}>
            <Search size={16} style={{ color: 'var(--text-dim)' }} />
            <input 
              type="text"
              aria-label="Filter alerts and incidents"
              className="form-input"
              style={{ width: '100%' }}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Severity:</span>
            <select 
              className="form-input"
              value={filterSeverity}
              onChange={e => setFilterSeverity(e.target.value)}
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">Critical Only</option>
              <option value="WARNING">Warning Only</option>
              <option value="ADVISORY">Advisory Only</option>
            </select>

            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', cursor: 'pointer', marginLeft: 8 }}>
              <input 
                type="checkbox" 
                checked={showResolved} 
                onChange={e => setShowResolved(e.target.checked)} 
              />
              <span>Include Resolved</span>
            </label>
          </div>
        </div>
      </div>

      {/* Alerts Table */}
      <div className="panel">
        <div className="panel-header">
          <div className="panel-title">
            <AlertTriangle size={18} style={{ color: 'var(--color-warning)' }} />
            <span>Incident & Safety Notification Log ({filtered.length})</span>
          </div>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Alert ID</th>
                <th>Time</th>
                <th>Severity</th>
                <th>Affected Asset</th>
                <th>Safety Parameter</th>
                <th>Condition / Message</th>
                <th>Acknowledgment</th>
                <th>Resolution Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: 30, color: 'var(--text-dim)' }}>
                    No alerts match the active filter criteria.
                  </td>
                </tr>
              ) : (
                filtered.map(alert => (
                  <tr key={alert.alertId}>
                    <td className="mono" style={{ fontWeight: 700 }}>{alert.alertId}</td>
                    <td className="mono" style={{ fontSize: '0.78rem' }}>
                      {new Date(alert.createdAt).toLocaleString()}
                    </td>
                    <td>
                      <StatusBadge status={alert.severity} />
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{alert.vesselName}</div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>{alert.zone}</div>
                    </td>
                    <td>
                      <div>{alert.metric}</div>
                      <div className="mono" style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{alert.triggerValue}</div>
                    </td>
                    <td style={{ maxWidth: 280 }}>{alert.message}</td>
                    <td>
                      {alert.acknowledged ? (
                        <div style={{ fontSize: '0.78rem' }}>
                          <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>Acknowledged</span>
                          <div style={{ color: 'var(--text-dim)', fontSize: '0.72rem' }}>by {alert.acknowledgedBy}</div>
                        </div>
                      ) : (
                        <button 
                          className="btn btn-secondary btn-sm"
                          onClick={() => onAcknowledgeAlert(alert.alertId)}
                        >
                          <CheckCircle size={13} />
                          <span>Acknowledge</span>
                        </button>
                      )}
                    </td>
                    <td>
                      {alert.resolved ? (
                        <span className="badge badge-passed">RESOLVED</span>
                      ) : (
                        <button 
                          className="btn btn-primary btn-sm"
                          onClick={() => onResolveAlert(alert.alertId)}
                        >
                          <CheckSquare size={13} />
                          <span>Close Incident</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

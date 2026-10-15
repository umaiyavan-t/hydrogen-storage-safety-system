import React, { useState, useEffect } from 'react';
import { Activity, Gauge, TrendingUp, History, RefreshCw, Download } from 'lucide-react';
import { api } from '../services/api';

export const TelemetryAnalytics = ({ vessels }) => {
  const [selectedVesselId, setSelectedVesselId] = useState(vessels[0]?.vesselId || 'H2-TNK-01');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadHistory = async (id) => {
    try {
      setLoading(true);
      const res = await api.getTelemetryHistory(id);
      if (res.success) {
        setHistory(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedVesselId) {
      loadHistory(selectedVesselId);
    }
  }, [selectedVesselId]);

  const selectedVessel = vessels.find(v => v.vesselId === selectedVesselId) || vessels[0];

  // Append latest live sensor telemetry updates to history
  useEffect(() => {
    if (selectedVessel && history.length > 0) {
      const lastPoint = history[history.length - 1];
      if (Math.abs(lastPoint.pressureBar - selectedVessel.currentPressureBar) > 0.05) {
        setHistory(prev => [
          ...prev.slice(-29),
          {
            timestamp: new Date().toISOString(),
            vesselId: selectedVessel.vesselId,
            pressureBar: selectedVessel.currentPressureBar,
            tempC: selectedVessel.currentTempC,
            lelPercentage: selectedVessel.lelPercentage,
            h2ConcentrationPpm: selectedVessel.currentH2ConcentrationPpm,
            sensorHealthPercent: selectedVessel.sensorHealthPercent,
            reliefValveOpen: selectedVessel.reliefValveOpen
          }
        ]);
      }
    }
  }, [selectedVessel?.currentPressureBar, selectedVessel?.currentTempC]);

  // Export telemetry history to CSV
  const handleExportCSV = () => {
    if (!history || history.length === 0) return;
    const headers = ['Timestamp', 'VesselID', 'Pressure_Bar', 'Temp_C', 'LEL_Percent', 'H2_PPM', 'SensorHealth_Percent', 'VentRelief_Open'];
    const rows = history.map(h => [
      new Date(h.timestamp).toISOString(),
      h.vesselId,
      h.pressureBar,
      h.tempC,
      h.lelPercentage,
      h.h2ConcentrationPpm,
      h.sensorHealthPercent,
      h.reliefValveOpen ? 'OPEN' : 'CLOSED'
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `telemetry_${selectedVesselId}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Calculate dynamic adaptive SVG sparkline path for pressure
  const pressures = history.map(h => h.pressureBar);
  const dataMin = pressures.length > 0 ? Math.min(...pressures) : (selectedVessel?.currentPressureBar || 500);
  const dataMax = pressures.length > 0 ? Math.max(...pressures) : (selectedVessel?.currentPressureBar || 500);
  const span = Math.max(6, dataMax - dataMin);
  const minP = Math.floor(Math.max(0, dataMin - span * 0.25));
  const maxP = Math.ceil(dataMax + span * 0.25);
  const midP = Math.round((minP + maxP) / 2);

  const svgWidth = 640;
  const svgHeight = 140;
  const padding = { top: 20, right: 30, bottom: 25, left: 58 };
  const innerWidth = svgWidth - padding.left - padding.right;
  const innerHeight = svgHeight - padding.top - padding.bottom;

  const points = history.map((h, i) => {
    const x = padding.left + (i / Math.max(history.length - 1, 1)) * innerWidth;
    const y = padding.top + innerHeight - ((h.pressureBar - minP) / (maxP - minP || 1)) * innerHeight;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');

  const warnP = selectedVessel?.warningPressureBar;
  const showWarn = warnP && warnP >= minP && warnP <= maxP;
  const warnY = showWarn ? padding.top + innerHeight - ((warnP - minP) / (maxP - minP || 1)) * innerHeight : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Selector & Actions */}
      <div className="panel" style={{ padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>Select Vessel Sensor Stream:</span>
            <select 
              className="form-input" 
              value={selectedVesselId}
              onChange={e => setSelectedVesselId(e.target.value)}
              style={{ fontWeight: 600 }}
            >
              {vessels.map(v => (
                <option key={v.vesselId} value={v.vesselId}>
                  {v.vesselId} - {v.name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button 
              className="btn btn-secondary btn-sm"
              onClick={handleExportCSV}
              disabled={history.length === 0}
            >
              <Download size={14} />
              <span>Export Telemetry CSV</span>
            </button>

            <button 
              className="btn btn-secondary btn-sm"
              onClick={() => loadHistory(selectedVesselId)}
              disabled={loading}
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              <span>Refresh Trends</span>
            </button>
          </div>
        </div>
      </div>

      {/* Telemetry Graph Card */}
      <div className="panel">
        <div className="panel-header">
          <div className="panel-title">
            <TrendingUp size={18} style={{ color: 'var(--color-primary)' }} />
            <span>Pressure Telemetry Trend (Last 30 Sampling Cycles)</span>
          </div>
          <span className="mono" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-primary)' }}>
            Current: {selectedVessel?.currentPressureBar} bar (Ceiling: {selectedVessel?.maxPressureBar} bar)
          </span>
        </div>
        <div className="panel-body">
          {history.length > 0 ? (
            <div style={{ width: '100%', overflowX: 'auto' }}>
              <svg width="100%" height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`} style={{ background: '#fafafa', borderRadius: 'var(--radius-sm)' }}>
                {/* Grid lines & Y-axis labels */}
                <line x1={padding.left} y1={padding.top} x2={svgWidth - padding.right} y2={padding.top} stroke="#e2e8f0" strokeDasharray="4" />
                <text x={padding.left - 6} y={padding.top + 4} textAnchor="end" fontSize="10" fill="#94a3b8" fontFamily="monospace">{maxP} bar</text>

                <line x1={padding.left} y1={padding.top + innerHeight / 2} x2={svgWidth - padding.right} y2={padding.top + innerHeight / 2} stroke="#e2e8f0" strokeDasharray="4" />
                <text x={padding.left - 6} y={padding.top + innerHeight / 2 + 4} textAnchor="end" fontSize="10" fill="#94a3b8" fontFamily="monospace">{midP} bar</text>

                <line x1={padding.left} y1={padding.top + innerHeight} x2={svgWidth - padding.right} y2={padding.top + innerHeight} stroke="#e2e8f0" strokeDasharray="4" />
                <text x={padding.left - 6} y={padding.top + innerHeight + 4} textAnchor="end" fontSize="10" fill="#94a3b8" fontFamily="monospace">{minP} bar</text>

                {/* Warning threshold line if within range */}
                {showWarn && warnY !== null && (
                  <g>
                    <line x1={padding.left} y1={warnY} x2={svgWidth - padding.right} y2={warnY} stroke="#ef4444" strokeDasharray="6 4" strokeWidth="1.5" />
                    <text x={svgWidth - padding.right - 4} y={warnY - 4} textAnchor="end" fontSize="9" fill="#ef4444" fontWeight="700" fontFamily="monospace">
                      WARN: {warnP} BAR
                    </text>
                  </g>
                )}

                {/* Polyline trend */}
                <polyline
                  fill="none"
                  stroke={selectedVessel?.currentPressureBar > selectedVessel?.warningPressureBar ? 'var(--color-danger)' : 'var(--color-primary)'}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={points}
                />

                {/* Live tip pulse point */}
                {history.length > 0 && (() => {
                  const lastH = history[history.length - 1];
                  const lastX = padding.left + innerWidth;
                  const lastY = padding.top + innerHeight - ((lastH.pressureBar - minP) / (maxP - minP || 1)) * innerHeight;
                  const isCrit = selectedVessel?.currentPressureBar > selectedVessel?.warningPressureBar;
                  return (
                    <g key="active-tip">
                      <circle cx={lastX} cy={lastY} r="6" fill="none" stroke={isCrit ? '#ef4444' : 'var(--color-primary)'} strokeWidth="1.5" opacity="0.6" />
                      <circle cx={lastX} cy={lastY} r="3.5" fill={isCrit ? '#ef4444' : 'var(--color-primary)'} stroke="#ffffff" strokeWidth="1.5" />
                    </g>
                  );
                })()}
              </svg>
            </div>
          ) : (
            <div style={{ padding: 30, textAlign: 'center', color: 'var(--text-dim)' }}>
              Awaiting telemetry records...
            </div>
          )}
        </div>
      </div>

      {/* Raw Telemetry Log Table */}
      <div className="panel">
        <div className="panel-header">
          <div className="panel-title">
            <History size={18} />
            <span>Raw Ingest Stream Log ({selectedVesselId})</span>
          </div>
        </div>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Pressure (bar)</th>
                <th>Temp (°C)</th>
                <th>LEL %</th>
                <th>Concentration (ppm)</th>
                <th>Sensor Health</th>
                <th>Vent Status</th>
              </tr>
            </thead>
            <tbody>
              {history.slice(0, 10).map((h, idx) => (
                <tr key={idx}>
                  <td className="mono" style={{ fontSize: '0.78rem' }}>
                    {new Date(h.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="mono" style={{ fontWeight: 600 }}>{h.pressureBar} bar</td>
                  <td className="mono">{h.tempC}°C</td>
                  <td className="mono">{h.lelPercentage}%</td>
                  <td className="mono">{h.h2ConcentrationPpm} ppm</td>
                  <td className="mono">{h.sensorHealthPercent}%</td>
                  <td>
                    <span className={`badge ${h.reliefValveOpen ? 'badge-critical' : 'badge-nominal'}`}>
                      {h.reliefValveOpen ? 'OPEN' : 'SEALED'}
                    </span>
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

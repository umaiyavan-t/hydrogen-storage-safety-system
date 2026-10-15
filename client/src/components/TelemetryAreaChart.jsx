import React, { useState, useEffect } from 'react';
import { TrendingUp, Sliders, Maximize2, Minimize2 } from 'lucide-react';
import { api } from '../services/api';

export const TelemetryAreaChart = ({ vessels, selectedVesselId, onSelectVessel }) => {
  const [telemetryHistory, setTelemetryHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hoverIndex, setHoverIndex] = useState(null);
  const [zoomMode, setZoomMode] = useState('auto'); // 'auto' | 'full'

  const targetVesselId = selectedVesselId || vessels[0]?.vesselId || 'H2-TNK-01';
  const targetVessel = vessels.find(v => v.vesselId === targetVesselId) || vessels[0];

  // Fetch telemetry history on vessel change
  useEffect(() => {
    let isMounted = true;
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const res = await api.getTelemetryHistory(targetVesselId);
        if (res.success && isMounted) {
          setTelemetryHistory(res.data);
        }
      } catch (err) {
        console.error('Failed to load telemetry history:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchHistory();
    return () => { isMounted = false; };
  }, [targetVesselId]);

  // Append live telemetry when vessel updates via WebSocket
  useEffect(() => {
    if (targetVessel && telemetryHistory.length > 0) {
      const lastPoint = telemetryHistory[telemetryHistory.length - 1];
      if (Math.abs(lastPoint.pressureBar - targetVessel.currentPressureBar) > 0.05) {
        setTelemetryHistory(prev => [
          ...prev.slice(-24),
          {
            timestamp: new Date().toISOString(),
            vesselId: targetVessel.vesselId,
            pressureBar: targetVessel.currentPressureBar,
            tempC: targetVessel.currentTempC,
            lelPercentage: targetVessel.lelPercentage
          }
        ]);
      }
    }
  }, [targetVessel?.currentPressureBar, targetVessel?.currentTempC]);

  // Chart dimensions
  const width = 640;
  const height = 180;
  const padding = { top: 22, right: 30, bottom: 30, left: 52 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  // Compute Adaptive Scales (Auto-Zoom calibrated to avoid micro-noise magnification)
  const pressures = telemetryHistory.map(d => d.pressureBar || 0);
  const dataMin = pressures.length > 0 ? Math.min(...pressures) : (targetVessel?.currentPressureBar || 500);
  const dataMax = pressures.length > 0 ? Math.max(...pressures) : (targetVessel?.currentPressureBar || 500);
  
  let minP, maxP;
  if (zoomMode === 'auto') {
    // Industrial auto-scale: minimum span 28 bar or 8% MAWP prevents flat lines without over-magnifying 0.2 bar sensor noise
    const minSpan = Math.max(28, (targetVessel?.maxPressureBar || 700) * 0.08);
    const span = Math.max(minSpan, (dataMax - dataMin) * 1.35);
    const mid = (dataMax + dataMin) / 2;
    minP = Math.max(0, Math.floor(mid - span / 2));
    maxP = Math.ceil(mid + span / 2);
  } else {
    // Full scale 0 to MAWP + 5%
    minP = 0;
    maxP = Math.ceil((targetVessel?.maxPressureBar || 700) * 1.05);
  }

  const getX = (index) => {
    if (telemetryHistory.length <= 1) return padding.left;
    return padding.left + (index / (telemetryHistory.length - 1)) * innerWidth;
  };

  const getY = (val) => {
    const range = maxP - minP || 1;
    const clamped = Math.min(maxP, Math.max(minP, val));
    return padding.top + innerHeight - ((clamped - minP) / range) * innerHeight;
  };

  // Fritsch-Carlson Monotone Cubic Spline (D3 curveMonotoneX implementation)
  const buildMonotoneXPath = (points) => {
    const n = points.length;
    if (n === 0) return '';
    if (n === 1) return `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
    if (n === 2) {
      return `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)} L ${points[1].x.toFixed(1)} ${points[1].y.toFixed(1)}`;
    }

    // 1. Calculate secant slopes (deltas)
    const dx = new Float64Array(n - 1);
    const dy = new Float64Array(n - 1);
    const m = new Float64Array(n - 1);

    for (let i = 0; i < n - 1; i++) {
      dx[i] = Math.max(0.001, points[i + 1].x - points[i].x);
      dy[i] = points[i + 1].y - points[i].y;
      m[i] = dy[i] / dx[i];
    }

    // 2. Tangents (initial weighted harmonic average)
    const d = new Float64Array(n);
    d[0] = m[0];
    d[n - 1] = m[n - 2];

    for (let i = 1; i < n - 1; i++) {
      if (m[i - 1] * m[i] <= 0) {
        d[i] = 0; // Flat tangent at local extrema guarantees monotonicity without overshoot
      } else {
        const dxSum = dx[i - 1] + dx[i];
        d[i] = (3 * dxSum) / ((2 * dx[i] + dx[i - 1]) / m[i - 1] + (dx[i] + 2 * dx[i - 1]) / m[i]);
      }
    }

    // 3. Fritsch-Carlson refinement pass
    for (let i = 0; i < n - 1; i++) {
      if (dy[i] === 0) {
        d[i] = 0;
        d[i + 1] = 0;
      } else {
        const a = d[i] / m[i];
        const b = d[i + 1] / m[i];
        const h = a * a + b * b;
        if (h > 9) {
          const tau = 3 / Math.sqrt(h);
          d[i] = tau * a * m[i];
          d[i + 1] = tau * b * m[i];
        }
      }
    }

    // 4. Construct SVG Cubic Bezier spline commands
    let path = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
    for (let i = 0; i < n - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];
      const segDx = (p2.x - p1.x) / 3;
      const cp1x = p1.x + segDx;
      const cp1y = p1.y + d[i] * segDx;
      const cp2x = p2.x - segDx;
      const cp2y = p2.y - d[i + 1] * segDx;

      path += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }
    return path;
  };

  const svgCoords = telemetryHistory.map((d, i) => ({
    x: getX(i),
    y: getY(d.pressureBar),
    pressure: d.pressureBar,
    temp: d.tempC,
    timestamp: d.timestamp
  }));

  const monotoneLinePath = buildMonotoneXPath(svgCoords);
  const bottomY = padding.top + innerHeight;
  const monotoneAreaPath = svgCoords.length > 0
    ? `${monotoneLinePath} L ${svgCoords[svgCoords.length - 1].x.toFixed(1)} ${bottomY} L ${svgCoords[0].x.toFixed(1)} ${bottomY} Z`
    : '';

  // Warning threshold
  const warningThreshold = targetVessel?.warningPressureBar || 650;
  const isWarningInView = warningThreshold >= minP && warningThreshold <= maxP;
  const warningY = getY(warningThreshold);
  const isBreached = (targetVessel?.currentPressureBar || 0) >= warningThreshold;

  const currentHoverPoint = hoverIndex !== null && telemetryHistory[hoverIndex]
    ? telemetryHistory[hoverIndex]
    : telemetryHistory[telemetryHistory.length - 1];

  // Grid tick values (4 steps)
  const yTicks = [
    minP,
    Math.round(minP + (maxP - minP) * 0.33),
    Math.round(minP + (maxP - minP) * 0.66),
    maxP
  ];

  // Time Axis Ticks (4 points across the history span)
  const timeTicks = [
    { label: 'T-30m', x: padding.left },
    { label: 'T-20m', x: padding.left + innerWidth * 0.33 },
    { label: 'T-10m', x: padding.left + innerWidth * 0.66 },
    { label: 'Live Now', x: padding.left + innerWidth }
  ];

  const lastCoord = svgCoords.length > 0 ? svgCoords[svgCoords.length - 1] : null;
  const hoverCoord = hoverIndex !== null && svgCoords[hoverIndex] ? svgCoords[hoverIndex] : null;

  return (
    <div className="panel" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div className="panel-header" style={{ flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <TrendingUp size={18} style={{ color: isBreached ? 'var(--color-danger)' : 'var(--color-primary)' }} />
          <div>
            <div className="panel-title">Live Tank Pressure Stream</div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>
              D3 MonotoneX spline telemetry with gradient underlay
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Zoom Mode Toggle */}
          <button 
            className="btn btn-secondary btn-sm"
            onClick={() => setZoomMode(zoomMode === 'auto' ? 'full' : 'auto')}
            style={{ padding: '3px 8px', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: 4 }}
            title={zoomMode === 'auto' ? 'Switch to Full 0-MAWP Scale' : 'Switch to Auto-Zoom Wave'}
          >
            {zoomMode === 'auto' ? <Maximize2 size={12} /> : <Minimize2 size={12} />}
            <span>{zoomMode === 'auto' ? 'Wave Zoom' : 'Full Scale'}</span>
          </button>

          {/* Target Vessel Picker */}
          <select 
            className="form-input"
            value={targetVesselId}
            onChange={e => onSelectVessel && onSelectVessel(e.target.value)}
            style={{ 
              padding: '3px 8px', 
              fontSize: '0.78rem', 
              fontWeight: 700, 
              background: '#f8fafc',
              borderColor: 'var(--border-color)',
              borderRadius: 6
            }}
          >
            {vessels.map(v => (
              <option key={v.vesselId} value={v.vesselId}>
                {v.vesselId} ({v.currentPressureBar} bar)
              </option>
            ))}
          </select>

          <span 
            className="mono" 
            style={{ 
              fontSize: '0.8rem', 
              fontWeight: 800,
              padding: '3px 8px',
              borderRadius: 6,
              background: isBreached ? '#fef2f2' : '#f0fdf4',
              color: isBreached ? '#b91c1c' : '#15803d',
              border: `1px solid ${isBreached ? '#fecaca' : '#bbf7d0'}`
            }}
          >
            {targetVessel?.currentPressureBar} bar
          </span>
        </div>
      </div>

      {/* SVG Chart */}
      <div className="panel-body" style={{ flex: 1, padding: '12px 16px', display: 'flex', flexDirection: 'column' }}>
        <div 
          style={{ width: '100%', position: 'relative' }}
          onMouseLeave={() => setHoverIndex(null)}
        >
          <svg 
            viewBox={`0 0 ${width} ${height}`} 
            style={{ width: '100%', height: 'auto', overflow: 'visible', userSelect: 'none' }}
            onMouseMove={(e) => {
              if (svgCoords.length === 0) return;
              const rect = e.currentTarget.getBoundingClientRect();
              const mouseSvgX = ((e.clientX - rect.left) / rect.width) * width;
              // Find closest point by x coordinate
              let closestIdx = 0;
              let minDiff = Infinity;
              for (let i = 0; i < svgCoords.length; i++) {
                const diff = Math.abs(svgCoords[i].x - mouseSvgX);
                if (diff < minDiff) {
                  minDiff = diff;
                  closestIdx = i;
                }
              }
              setHoverIndex(closestIdx);
            }}
          >
            <defs>
              {/* Rich D3 MonotoneX Gradient Underlays */}
              <linearGradient id="monotoneGradientNominal" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#0284c7" stopOpacity="0.35" />
                <stop offset="45%" stopColor="#0ea5e9" stopOpacity="0.14" />
                <stop offset="100%" stopColor="#0284c7" stopOpacity="0.00" />
              </linearGradient>

              <linearGradient id="monotoneGradientCritical" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#ef4444" stopOpacity="0.40" />
                <stop offset="45%" stopColor="#f87171" stopOpacity="0.16" />
                <stop offset="100%" stopColor="#ef4444" stopOpacity="0.00" />
              </linearGradient>
            </defs>

            {/* Horizontal Gridlines & Y-Axis Labels */}
            {yTicks.map((val, idx) => {
              const yPos = getY(val);
              return (
                <g key={idx}>
                  <line 
                    x1={padding.left} 
                    y1={yPos} 
                    x2={width - padding.right} 
                    y2={yPos} 
                    stroke="#e2e8f0" 
                    strokeDasharray="3 3"
                    strokeWidth="1"
                  />
                  <text 
                    x={padding.left - 6} 
                    y={yPos + 3.5} 
                    textAnchor="end" 
                    fontSize="9.5" 
                    fill="#94a3b8" 
                    fontFamily="monospace"
                  >
                    {val}
                  </text>
                </g>
              );
            })}

            {/* X-Axis Bottom Baseline & Time Coordinates */}
            <line 
              x1={padding.left} 
              y1={bottomY} 
              x2={width - padding.right} 
              y2={bottomY} 
              stroke="#cbd5e1" 
              strokeWidth="1"
            />
            {timeTicks.map((tick, idx) => (
              <text 
                key={idx}
                x={tick.x} 
                y={bottomY + 14} 
                textAnchor={idx === 0 ? 'start' : idx === timeTicks.length - 1 ? 'end' : 'middle'} 
                fontSize="9" 
                fill="#94a3b8" 
                fontFamily="monospace"
              >
                {tick.label}
              </text>
            ))}

            {/* Warning Envelope Reference Line */}
            {isWarningInView && (
              <g>
                <line 
                  x1={padding.left} 
                  y1={warningY} 
                  x2={width - padding.right} 
                  y2={warningY} 
                  stroke="#ef4444" 
                  strokeDasharray="6 4"
                  strokeWidth="1.5"
                />
                <text 
                  x={width - padding.right - 4} 
                  y={warningY - 5} 
                  textAnchor="end" 
                  fontSize="9" 
                  fill="#ef4444" 
                  fontWeight="700" 
                  fontFamily="monospace"
                >
                  WARNING LIMIT: {warningThreshold} BAR
                </text>
              </g>
            )}

            {/* D3 MonotoneX Smooth Gradient Underlay */}
            {monotoneAreaPath && (
              <path 
                d={monotoneAreaPath} 
                fill={isBreached ? 'url(#monotoneGradientCritical)' : 'url(#monotoneGradientNominal)'} 
              />
            )}

            {/* D3 MonotoneX Curve Spline Path */}
            {monotoneLinePath && (
              <path 
                d={monotoneLinePath} 
                fill="none" 
                stroke={isBreached ? '#ef4444' : '#0284c7'} 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
              />
            )}

            {/* Interactive Hover Crosshair Hairline */}
            {hoverCoord && (
              <g>
                <line
                  x1={hoverCoord.x}
                  y1={padding.top}
                  x2={hoverCoord.x}
                  y2={bottomY}
                  stroke="#94a3b8"
                  strokeDasharray="3 3"
                  strokeWidth="1"
                />
                <circle
                  cx={hoverCoord.x}
                  cy={hoverCoord.y}
                  r="5"
                  fill={isBreached ? '#ef4444' : '#0284c7'}
                  stroke="#ffffff"
                  strokeWidth="2"
                />
              </g>
            )}

            {/* Live Pulsing Beacon on Latest Telemetry Point */}
            {lastCoord && !hoverCoord && (
              <g>
                <circle
                  cx={lastCoord.x}
                  cy={lastCoord.y}
                  r="8"
                  fill="none"
                  stroke={isBreached ? '#ef4444' : '#0284c7'}
                  strokeWidth="1.5"
                  opacity="0.45"
                />
                <circle
                  cx={lastCoord.x}
                  cy={lastCoord.y}
                  r="3.5"
                  fill={isBreached ? '#ef4444' : '#0284c7'}
                  stroke="#ffffff"
                  strokeWidth="1.5"
                />
              </g>
            )}
          </svg>
        </div>

        {/* Footer Metric Legend Bar */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          paddingTop: 8, 
          marginTop: 'auto',
          borderTop: '1px solid #f1f5f9',
          fontSize: '0.74rem',
          color: 'var(--text-dim)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 10, height: 3, background: '#0284c7', borderRadius: 2 }} />
              <span>Pressure Wave (bar)</span>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 10, height: 2, background: '#ef4444', borderTop: '2px dashed #ef4444' }} />
              <span>Warning: {warningThreshold} bar</span>
            </span>
          </div>

          <div className="mono" style={{ fontSize: '0.72rem' }}>
            <span>Sample: </span>
            <strong style={{ color: 'var(--text-main)' }}>
              {currentHoverPoint ? `${currentHoverPoint.pressureBar} bar @ ${new Date(currentHoverPoint.timestamp || Date.now()).toLocaleTimeString()}` : 'Live Wave'}
            </strong>
          </div>
        </div>
      </div>
    </div>
  );
};

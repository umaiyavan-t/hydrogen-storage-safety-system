import React, { useState, useEffect, useRef } from 'react';
import { 
  GripHorizontal, 
  ChevronDown, 
  ChevronUp,
  RotateCcw
} from 'lucide-react';

export const XboxDemoBar = ({ onTriggerScenario, isConnected }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeScenario, setActiveScenario] = useState(null);
  const [feedbackMsg, setFeedbackMsg] = useState('Cockpit ready. Drag to reposition.');
  const [loadingAction, setLoadingAction] = useState(null);

  // Position state (centered near top by default)
  const [position, setPosition] = useState({ x: 0, y: 14 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ mouseX: 0, mouseY: 0, posX: 0, posY: 0 });
  const barRef = useRef(null);

  // Initialize centered X coordinate after mount
  useEffect(() => {
    if (barRef.current && position.x === 0) {
      const barWidth = barRef.current.offsetWidth || 760;
      const initialX = Math.max(16, Math.round((window.innerWidth - barWidth) / 2));
      setPosition({ x: initialX, y: 14 });
    }
  }, []);

  // Drag handlers
  const handleMouseDown = (e) => {
    if (e.target.closest('button')) return;
    setIsDragging(true);
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      posX: position.x,
      posY: position.y
    };
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      const deltaX = e.clientX - dragStartRef.current.mouseX;
      const deltaY = e.clientY - dragStartRef.current.mouseY;

      const barWidth = barRef.current ? barRef.current.offsetWidth : 720;
      const barHeight = barRef.current ? barRef.current.offsetHeight : 44;

      const maxX = Math.max(0, window.innerWidth - barWidth - 10);
      const maxY = Math.max(0, window.innerHeight - barHeight - 10);

      const newX = Math.min(Math.max(10, dragStartRef.current.posX + deltaX), maxX);
      const newY = Math.min(Math.max(10, dragStartRef.current.posY + deltaY), maxY);

      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const handleAction = async (scenarioKey, label) => {
    try {
      setLoadingAction(scenarioKey);
      setActiveScenario(scenarioKey);
      setFeedbackMsg(`${label}...`);
      
      const res = await onTriggerScenario(scenarioKey);
      if (res?.message) {
        setFeedbackMsg(res.message);
      } else {
        setFeedbackMsg(`Applied: ${label}`);
      }
    } catch (err) {
      setFeedbackMsg(`Error: ${err.message}`);
    } finally {
      setLoadingAction(null);
    }
  };

  const scenarios = [
    { key: 'OVERPRESSURE', label: 'Overpressure', dotColor: '#ef4444', desc: 'Overpressure Spike (695 bar)' },
    { key: 'LEAK', label: 'Gas Leak', dotColor: '#f59e0b', desc: 'H2 Gas Leak (18.5% LEL)' },
    { key: 'SENSOR_FAIL', label: 'Sensor Drop', dotColor: '#a855f7', desc: 'Telemetry Signal Loss (34%)' },
    { key: 'ESD_VENT', label: 'Trip ESD', dotColor: '#38bdf8', desc: 'Emergency Flare Relief Vent' },
  ];

  return (
    <aside 
      ref={barRef}
      aria-label="Crisis Simulation Cockpit"
      style={{
        position: 'fixed',
        top: position.y,
        left: position.x,
        zIndex: 9999,
        userSelect: 'none',
        transition: isDragging ? 'none' : 'box-shadow 0.2s ease',
        boxShadow: isDragging 
          ? '0 20px 40px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.15)' 
          : '0 10px 25px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.08)'
      }}
    >
      <div 
        style={{
          background: 'rgba(9, 13, 20, 0.95)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255, 255, 255, 0.09)',
          borderRadius: 24,
          padding: isCollapsed ? '6px 14px' : '6px 14px',
          color: '#f1f5f9',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.05)'
        }}
      >
        {/* Minimal Drag Handle & Label */}
        <div 
          onMouseDown={handleMouseDown}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            cursor: isDragging ? 'grabbing' : 'grab',
            padding: '4px 6px',
            borderRadius: 14,
            background: 'rgba(255, 255, 255, 0.03)'
          }}
          title="Drag to reposition cockpit"
        >
          <GripHorizontal size={14} color="rgba(255, 255, 255, 0.35)" />
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span 
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                backgroundColor: isConnected ? '#10b981' : '#ef4444',
                boxShadow: isConnected ? '0 0 6px rgba(16, 185, 129, 0.6)' : '0 0 6px rgba(239, 68, 68, 0.6)',
                display: 'inline-block'
              }} 
            />
            <span style={{ 
              fontWeight: 700, 
              fontSize: '0.68rem', 
              letterSpacing: '0.1em', 
              color: '#94a3b8',
              fontFamily: "'JetBrains Mono', monospace"
            }}>
              SIMULATION COCKPIT
            </span>
          </div>
        </div>

        {/* Collapsed Mode Notice */}
        {isCollapsed && (
          <span 
            onMouseDown={handleMouseDown}
            style={{ 
              fontSize: '0.74rem', 
              color: 'rgba(255, 255, 255, 0.6)',
              cursor: 'grab',
              fontFamily: "'JetBrains Mono', monospace"
            }}
          >
            {feedbackMsg}
          </span>
        )}

        {/* Expanded Mode: Minimalist Dark Action Buttons */}
        {!isCollapsed && (
          <>
            <div style={{ width: 1, height: 18, background: 'rgba(255, 255, 255, 0.1)' }} />

            {/* Scenario Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {scenarios.map(s => {
                const isActive = activeScenario === s.key;
                return (
                  <button
                    key={s.key}
                    onClick={() => handleAction(s.key, s.desc)}
                    disabled={loadingAction !== null}
                    style={{
                      background: isActive ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.04)',
                      border: `1px solid ${isActive ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.06)'}`,
                      color: isActive ? '#ffffff' : '#cbd5e1',
                      padding: '4px 10px',
                      borderRadius: 16,
                      fontWeight: 600,
                      fontSize: '0.72rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      fontFamily: "'Inter', sans-serif"
                    }}
                    title={s.desc}
                    onMouseEnter={e => {
                      if (!isActive) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                    }}
                    onMouseLeave={e => {
                      if (!isActive) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                    }}
                  >
                    <span 
                      style={{ 
                        width: 5, 
                        height: 5, 
                        borderRadius: '50%', 
                        backgroundColor: s.dotColor,
                        display: 'inline-block'
                      }} 
                    />
                    <span>{s.label}</span>
                  </button>
                );
              })}

              {/* Reset to Nominal Baseline Button */}
              <button
                onClick={() => handleAction('RESET', 'Reset to Nominal Baseline')}
                disabled={loadingAction !== null}
                style={{
                  background: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  color: '#6ee7b7',
                  padding: '4px 10px',
                  borderRadius: 16,
                  fontWeight: 600,
                  fontSize: '0.72rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                title="Restore all 6 vessels to normal operating baseline"
              >
                <RotateCcw size={11} color="#10b981" />
                <span>Reset Baseline</span>
              </button>
            </div>

            {/* Status ticker pill */}
            <div 
              style={{
                background: 'rgba(0, 0, 0, 0.35)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                borderRadius: 12,
                padding: '3px 8px',
                fontSize: '0.7rem',
                color: '#94a3b8',
                maxWidth: 220,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                fontFamily: "'JetBrains Mono', monospace"
              }}
              title={feedbackMsg}
            >
              {loadingAction ? 'Executing...' : feedbackMsg}
            </div>
          </>
        )}

        {/* Minimalist Collapse Toggle */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'rgba(255, 255, 255, 0.45)',
            width: 22,
            height: 22,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            padding: 0,
            borderRadius: '50%',
            transition: 'color 0.15s'
          }}
          onMouseEnter={e => e.currentTarget.style.color = '#ffffff'}
          onMouseLeave={e => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.45)'}
          title={isCollapsed ? "Expand Cockpit" : "Minimize"}
        >
          {isCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </button>
      </div>
    </aside>
  );
};

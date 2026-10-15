import React, { useState } from 'react';
import { Wrench, CheckCircle2, Clock, User, PlusCircle } from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';

export const MaintenanceSchedule = ({ tasks, onUpdateTask, onCreateTask, vessels }) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTask, setNewTask] = useState({
    vesselId: vessels[0]?.vesselId || '',
    title: '',
    category: 'SENSOR_CALIBRATION',
    priority: 'MEDIUM',
    technician: '',
    scheduledDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    notes: ''
  });

  const handleToggleChecklist = (task, index) => {
    const updatedChecklist = [...task.checklist];
    updatedChecklist[index].completed = !updatedChecklist[index].completed;
    
    // If all items completed, suggest completing task
    const allDone = updatedChecklist.every(c => c.completed);
    onUpdateTask(task.taskId, {
      checklist: updatedChecklist,
      status: allDone ? 'COMPLETED' : 'IN_PROGRESS',
      completedDate: allDone ? new Date() : null
    });
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!newTask.title || !newTask.technician) return;
    await onCreateTask(newTask);
    setShowCreateModal(false);
    setNewTask({
      vesselId: vessels[0]?.vesselId || '',
      title: '',
      category: 'SENSOR_CALIBRATION',
      priority: 'MEDIUM',
      technician: '',
      scheduledDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      notes: ''
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="panel" style={{ padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>Preventive Maintenance & Inspection Work Orders</h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Periodic recalibration, valve reseat testing, and embrittlement safety checks.
            </p>
          </div>
          <button 
            className="btn btn-primary btn-sm"
            onClick={() => setShowCreateModal(true)}
          >
            <PlusCircle size={15} />
            <span>Create Work Order</span>
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 18 }}>
        {tasks.map(task => (
          <div 
            key={task.taskId} 
            className="panel"
            style={{ 
              display: 'flex', 
              flexDirection: 'column',
              borderColor: task.status === 'COMPLETED' ? 'var(--color-success-border)' : 'var(--border-color)' 
            }}
          >
            <div className="panel-header" style={{ alignItems: 'flex-start' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span className="mono" style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dim)' }}>
                    {task.taskId}
                  </span>
                  <StatusBadge status={task.priority} />
                  <StatusBadge status={task.status} />
                </div>
                <h3 style={{ fontSize: '0.92rem', fontWeight: 700 }}>{task.title}</h3>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Target: <strong>{task.vesselName}</strong>
                </div>
              </div>
            </div>

            <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 12, flexGrow: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <User size={13} /> {task.technician}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Clock size={13} /> {new Date(task.scheduledDate).toLocaleDateString()}
                </span>
              </div>

              {/* Checklist */}
              <div>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Safety Inspection Checklist
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {task.checklist?.map((item, idx) => (
                    <label 
                      key={idx}
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 8, 
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                        padding: '4px 6px',
                        borderRadius: 'var(--radius-sm)',
                        background: item.completed ? 'var(--color-success-bg)' : '#f8fafc',
                        border: `1px solid ${item.completed ? 'var(--color-success-border)' : 'var(--border-color)'}`
                      }}
                    >
                      <input 
                        type="checkbox" 
                        checked={item.completed}
                        onChange={() => handleToggleChecklist(task, idx)}
                      />
                      <span style={{ textDecoration: item.completed ? 'line-through' : 'none', color: item.completed ? 'var(--color-success)' : 'inherit' }}>
                        {item.title}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {task.notes && (
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontStyle: 'italic', background: '#fafafa', padding: 8, borderRadius: 4 }}>
                  "{task.notes}"
                </div>
              )}
            </div>

            <div style={{ padding: '10px 16px', background: '#fafafa', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              {task.status !== 'COMPLETED' && (
                <button 
                  className="btn btn-secondary btn-sm"
                  onClick={() => onUpdateTask(task.taskId, { status: 'COMPLETED', completedDate: new Date() })}
                >
                  <CheckCircle2 size={13} />
                  <span>Mark Task Complete</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Create Task Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Schedule Preventive Maintenance</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowCreateModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Asset / Vessel</label>
                  <select 
                    className="form-input"
                    value={newTask.vesselId}
                    onChange={e => setNewTask({ ...newTask, vesselId: e.target.value })}
                  >
                    {vessels.map(v => (
                      <option key={v.vesselId} value={v.vesselId}>{v.vesselId} - {v.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Work Order Title</label>
                  <input 
                    type="text"
                    className="form-input"
                    placeholder="e.g. Ultrasonic Wall Thickness Testing"
                    value={newTask.title}
                    onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label>Priority</label>
                    <select 
                      className="form-input"
                      value={newTask.priority}
                      onChange={e => setNewTask({ ...newTask, priority: e.target.value })}
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="URGENT">Urgent</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Scheduled Date</label>
                    <input 
                      type="date"
                      className="form-input"
                      value={newTask.scheduledDate}
                      onChange={e => setNewTask({ ...newTask, scheduledDate: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Lead Certified Technician</label>
                  <input 
                    type="text"
                    className="form-input"
                    placeholder="e.g. M. Chen (ASNT Level II)"
                    value={newTask.technician}
                    onChange={e => setNewTask({ ...newTask, technician: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Inspection Notes</label>
                  <textarea 
                    className="form-input"
                    rows="2"
                    placeholder="Scope, safety clearances, and torque specs..."
                    value={newTask.notes}
                    onChange={e => setNewTask({ ...newTask, notes: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Schedule Workorder</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

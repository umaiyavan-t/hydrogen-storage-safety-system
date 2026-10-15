import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './pages/Dashboard';
import { VesselsView } from './pages/VesselsView';
import { TelemetryAnalytics } from './pages/TelemetryAnalytics';
import { AlertsIncidents } from './pages/AlertsIncidents';
import { MaintenanceSchedule } from './pages/MaintenanceSchedule';
import { ComplianceAudit } from './pages/ComplianceAudit';
import { ThresholdModal } from './components/ThresholdModal';
import { IncidentModal } from './components/IncidentModal';
import { VesselDetailModal } from './components/VesselDetailModal';
import { Login } from './pages/Login';
import { api } from './services/api';
import { socket } from './services/socket';

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('h2_current_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [currentTab, setCurrentTab] = useState('dashboard');
  const [overview, setOverview] = useState(null);
  const [vessels, setVessels] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [maintenanceTasks, setMaintenanceTasks] = useState([]);
  const [complianceAudits, setComplianceAudits] = useState([]);
  const [isConnected, setIsConnected] = useState(socket.connected);

  // Modals state
  const [selectedVesselForThreshold, setSelectedVesselForThreshold] = useState(null);
  const [selectedVesselForDetail, setSelectedVesselForDetail] = useState(null);
  const [showIncidentModal, setShowIncidentModal] = useState(false);

  // Initial Data Fetch
  const refreshAllData = async () => {
    try {
      const [ovRes, vRes, alRes, mRes, cRes] = await Promise.all([
        api.getOverview(),
        api.getVessels(),
        api.getAlerts(),
        api.getMaintenanceTasks(),
        api.getComplianceAudits()
      ]);

      if (ovRes.success) setOverview(ovRes.data);
      if (vRes.success) setVessels(vRes.data);
      if (alRes.success) setAlerts(alRes.data);
      if (mRes.success) setMaintenanceTasks(mRes.data);
      if (cRes.success) setComplianceAudits(cRes.data);
    } catch (err) {
      console.error('Failed to load initial data:', err);
    }
  };

  useEffect(() => {
    refreshAllData();

    // Socket.IO event listeners
    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));

    socket.on('telemetry:stream', ({ vesselId, vessel }) => {
      setVessels(prev => prev.map(v => v.vesselId === vesselId ? { ...v, ...vessel } : v));
      // Also update currently inspected vessel if open
      setSelectedVesselForDetail(prev => prev && prev.vesselId === vesselId ? { ...prev, ...vessel } : prev);
    });

    socket.on('overview:update', (updatedOverview) => {
      setOverview(prev => ({ ...prev, ...updatedOverview }));
    });

    socket.on('vessel:update', (updatedVessel) => {
      setVessels(prev => prev.map(v => v.vesselId === updatedVessel.vesselId ? updatedVessel : v));
      setSelectedVesselForDetail(prev => prev && prev.vesselId === updatedVessel.vesselId ? updatedVessel : prev);
    });

    socket.on('alert:new', (newAlert) => {
      setAlerts(prev => [newAlert, ...prev]);
      api.getOverview().then(res => { if (res.success) setOverview(res.data); });
    });

    socket.on('alert:acknowledged', (ackAlert) => {
      setAlerts(prev => prev.map(a => a.alertId === ackAlert.alertId ? ackAlert : a));
    });

    socket.on('alert:resolved', (resAlert) => {
      setAlerts(prev => prev.map(a => a.alertId === resAlert.alertId ? resAlert : a));
      api.getOverview().then(res => { if (res.success) setOverview(res.data); });
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('telemetry:stream');
      socket.off('vessel:update');
      socket.off('alert:new');
      socket.off('alert:acknowledged');
      socket.off('alert:resolved');
    };
  }, []);

  // Handlers
  const handleTriggerScenario = async (scenarioKey) => {
    const res = await api.triggerScenario(scenarioKey);
    if (res.success && res.data) {
      setVessels(res.data.vessels);
      setAlerts(res.data.alerts);
      const ovRes = await api.getOverview();
      if (ovRes.success) setOverview(ovRes.data);
    }
    return res;
  };

  const handleAcknowledgeAlert = async (alertId) => {
    const res = await api.acknowledgeAlert(alertId, 'Duty Safety Officer');
    if (res.success) {
      setAlerts(prev => prev.map(a => a.alertId === alertId ? res.data : a));
    }
  };

  const handleResolveAlert = async (alertId) => {
    const res = await api.resolveAlert(alertId);
    if (res.success) {
      setAlerts(prev => prev.map(a => a.alertId === alertId ? res.data : a));
      if (res.vessel) {
        setVessels(prev => prev.map(v => v.vesselId === res.vessel.vesselId ? res.vessel : v));
        setSelectedVesselForDetail(prev => prev && prev.vesselId === res.vessel.vesselId ? res.vessel : prev);
      } else {
        const vRes = await api.getVessels();
        if (vRes.success) setVessels(vRes.data);
      }
      const ovRes = await api.getOverview();
      if (ovRes.success) setOverview(ovRes.data);
    }
  };

  const handleLogin = (user) => {
    setCurrentUser(user);
    try {
      localStorage.setItem('h2_current_user', JSON.stringify(user));
    } catch {}
  };

  const handleLogout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem('h2_current_user');
    } catch {}
  };

  const handleSaveThresholds = async (vesselId, thresholds) => {
    if (currentUser?.role && currentUser.role !== 'SAFETY_ENGINEER') {
      alert('Access Denied: Adjusting Maximum Allowable Working Pressure (MAWP) or Safety Thresholds requires Plant Safety Engineer authorization (Dr. Aris Thorne).');
      return;
    }
    const res = await api.updateThresholds(vesselId, {
      ...thresholds,
      operatorRole: currentUser?.role || 'SAFETY_ENGINEER'
    });
    if (res.success) {
      setVessels(prev => prev.map(v => v.vesselId === vesselId ? res.data : v));
      setSelectedVesselForThreshold(null);
      setSelectedVesselForDetail(prev => prev && prev.vesselId === vesselId ? res.data : prev);
    } else {
      alert(res.message || 'Threshold update failed');
    }
  };

  const handleToggleReliefValve = async (vesselId, reliefValveOpen) => {
    if (currentUser?.role === 'COMPLIANCE_AUDITOR') {
      alert('Access Denied: Compliance Auditors hold read-only inspection clearance and cannot command emergency relief valves.');
      return;
    }
    const res = await api.toggleReliefValve(vesselId, { 
      reliefValveOpen, 
      confirmed: true,
      operatorId: currentUser ? `${currentUser.name} (${currentUser.badge})` : 'OP-CONSOLE-01',
      operatorRole: currentUser?.role || 'SAFETY_ENGINEER',
      reason: reliefValveOpen 
        ? `Emergency manual venting initiated by ${currentUser?.name || 'Console Operator'}` 
        : `Manual relief valve closed by ${currentUser?.name || 'Console Operator'}`
    });
    if (res.success) {
      setVessels(prev => prev.map(v => v.vesselId === vesselId ? res.data.vessel : v));
      setSelectedVesselForDetail(prev => prev && prev.vesselId === vesselId ? res.data.vessel : prev);
    } else {
      alert(res.message || 'Relief valve command failed');
    }
  };

  const handleCreateIncident = async (incidentData) => {
    const res = await api.createAlert(incidentData);
    if (res.success) {
      setAlerts(prev => [res.data, ...prev]);
      if (res.vessel) {
        setVessels(prev => prev.map(v => v.vesselId === res.vessel.vesselId ? res.vessel : v));
      }
      const ovRes = await api.getOverview();
      if (ovRes.success) setOverview(ovRes.data);
    }
  };

  const handleCreateTask = async (taskData) => {
    const res = await api.createMaintenanceTask(taskData);
    if (res.success) {
      setMaintenanceTasks(prev => [...prev, res.data]);
    }
  };

  const handleUpdateTask = async (taskId, updateData) => {
    const res = await api.updateMaintenanceTask(taskId, updateData);
    if (res.success) {
      setMaintenanceTasks(prev => prev.map(t => t.taskId === taskId ? res.data : t));
    }
  };

  const handleUpdateAudit = async (auditId, updateData) => {
    const res = await api.updateComplianceAudit(auditId, updateData);
    if (res.success) {
      setComplianceAudits(prev => prev.map(a => a.auditId === auditId ? res.data : a));
    }
  };

  const activeAlertCount = alerts.filter(a => !a.resolved).length;

  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="app-container">
      <Sidebar 
        currentTab={currentTab} 
        setCurrentTab={setCurrentTab} 
        alertCount={activeAlertCount} 
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      <div className="main-wrapper">
        <Header 
          title={
            currentTab === 'dashboard' ? 'Facility Safety & Telemetry Overview' :
            currentTab === 'vessels' ? 'Pressure Vessels & Cryogenic Tanks' :
            currentTab === 'telemetry' ? 'Sensor Telemetry Analytics' :
            currentTab === 'alerts' ? 'Safety Hazards & Incident Logs' :
            currentTab === 'maintenance' ? 'Preventive Maintenance Management' :
            'Regulatory Compliance Register'
          }
          facilityStatus={overview?.facilityStatus}
          isConnected={isConnected}
          onOpenIncidentModal={() => setShowIncidentModal(true)}
          currentUser={currentUser}
          onLogout={handleLogout}
        />

        <main className="content-body">
          {currentTab === 'dashboard' && (
            <Dashboard 
              overview={overview}
              vessels={vessels}
              alerts={alerts}
              onAcknowledgeAlert={handleAcknowledgeAlert}
              onResolveAlert={handleResolveAlert}
              onOpenThresholdModal={v => setSelectedVesselForThreshold(v)}
              onToggleReliefValve={handleToggleReliefValve}
              onInspectVessel={v => setSelectedVesselForDetail(v)}
              onTriggerScenario={handleTriggerScenario}
            />
          )}

          {currentTab === 'vessels' && (
            <VesselsView 
              vessels={vessels}
              onOpenThresholdModal={v => setSelectedVesselForThreshold(v)}
              onToggleReliefValve={handleToggleReliefValve}
              onInspectVessel={v => setSelectedVesselForDetail(v)}
            />
          )}

          {currentTab === 'telemetry' && (
            <TelemetryAnalytics vessels={vessels} />
          )}

          {currentTab === 'alerts' && (
            <AlertsIncidents 
              alerts={alerts}
              onAcknowledgeAlert={handleAcknowledgeAlert}
              onResolveAlert={handleResolveAlert}
            />
          )}

          {currentTab === 'maintenance' && (
            <MaintenanceSchedule 
              tasks={maintenanceTasks}
              onUpdateTask={handleUpdateTask}
              onCreateTask={handleCreateTask}
              vessels={vessels}
            />
          )}

          {currentTab === 'compliance' && (
            <ComplianceAudit 
              audits={complianceAudits}
              onUpdateAudit={handleUpdateAudit}
            />
          )}
        </main>
      </div>

      {/* Deep-Dive Vessel Inspector Modal */}
      {selectedVesselForDetail && (
        <VesselDetailModal 
          vessel={selectedVesselForDetail}
          onClose={() => setSelectedVesselForDetail(null)}
          onToggleReliefValve={handleToggleReliefValve}
          onOpenThresholdModal={v => setSelectedVesselForThreshold(v)}
        />
      )}

      {/* Threshold Calibration Modal */}
      {selectedVesselForThreshold && (
        <ThresholdModal 
          vessel={selectedVesselForThreshold}
          onClose={() => setSelectedVesselForThreshold(null)}
          onSave={handleSaveThresholds}
        />
      )}

      {/* Incident Modal */}
      {showIncidentModal && (
        <IncidentModal 
          vessels={vessels}
          onClose={() => setShowIncidentModal(false)}
          onSubmit={handleCreateIncident}
        />
      )}
    </div>
  );
}

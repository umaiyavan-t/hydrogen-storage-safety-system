const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Vessel = require('../models/Vessel');
const Telemetry = require('../models/Telemetry');
const Alert = require('../models/Alert');
const MaintenanceTask = require('../models/MaintenanceTask');
const ComplianceAudit = require('../models/ComplianceAudit');
const startTelemetrySimulator = require('../services/simulator');
const { sendTelegramAlert, sendTelegramTest } = require('../services/telegramService');

const JWT_SECRET = process.env.JWT_SECRET || 'h2-super-secret-plant-key-2026';

// RVAC: Industrial Hydrogen Storage Facility Personnel
const FACILITY_USERS = [
  {
    userId: 'usr-thorne',
    badge: 'SE-7001',
    name: 'Dr. Aris Thorne',
    email: 'thorne@h2shield.facility',
    role: 'SAFETY_ENGINEER',
    roleTitle: 'Plant Safety Engineer',
    zone: 'All High-Pressure Buffers & Cryo Enclosures',
    permissions: [
      'READ_TELEMETRY',
      'ACK_ALERTS',
      'RESOLVE_ALERTS',
      'ACTUATE_RELIEF_VALVES',
      'OVERRIDE_THRESHOLDS',
      'SCHEDULE_MAINTENANCE',
      'EXECUTE_ESD'
    ],
    pin: '7001'
  },
  {
    userId: 'usr-vance',
    badge: 'OP-4202',
    name: 'Marcus Vance',
    email: 'vance@h2shield.facility',
    role: 'OPERATOR',
    roleTitle: 'Control Room Operator',
    zone: 'Zone Alpha & Beta Monitoring',
    permissions: [
      'READ_TELEMETRY',
      'ACK_ALERTS',
      'ACTUATE_RELIEF_VALVES'
    ],
    pin: '4202'
  },
  {
    userId: 'usr-rostova',
    badge: 'AUD-9103',
    name: 'Elena Rostova',
    email: 'rostova@h2shield.facility',
    role: 'COMPLIANCE_AUDITOR',
    roleTitle: 'Lead Compliance Auditor',
    zone: 'Regulatory, NFPA 2 & ISO 19880-1 Division',
    permissions: [
      'READ_TELEMETRY',
      'READ_AUDITS',
      'EXPORT_COMPLIANCE',
      'SIGN_OFF_AUDIT'
    ],
    pin: '9103'
  }
];

// RVAC Authentication Endpoints
router.get('/auth/roles', (req, res) => {
  const safeUsers = FACILITY_USERS.map(({ pin, ...user }) => user);
  res.json({ success: true, data: safeUsers });
});

router.post('/auth/login', (req, res) => {
  const { userId, role, pin, email, password } = req.body;
  const attemptedPin = pin || password;
  const user = FACILITY_USERS.find(u => 
    (email && u.email.toLowerCase() === email.toLowerCase()) ||
    (userId && u.userId === userId) || 
    (role && u.role === role)
  );

  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid facility personnel identity or email.' });
  }
  if (attemptedPin && user.pin !== attemptedPin) {
    return res.status(401).json({ success: false, message: 'Invalid security access PIN / password.' });
  }

  const { pin: _p, ...safeUser } = user;
  const token = jwt.sign(
    {
      userId: safeUser.userId,
      badge: safeUser.badge,
      name: safeUser.name,
      role: safeUser.role,
      roleTitle: safeUser.roleTitle,
      email: safeUser.email,
      permissions: safeUser.permissions
    },
    JWT_SECRET,
    { expiresIn: '12h' }
  );

  res.json({ success: true, token, data: safeUser });
});

// Middleware: extract JWT claims and populate req.user
router.use((req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      req.headers['x-operator-role'] = decoded.role;
      req.headers['x-operator-id'] = `${decoded.name} (${decoded.badge})`;
    } catch {
      req.user = null;
    }
  }
  next();
});

router.get('/auth/me', (req, res) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthenticated session.' });
  }
  res.json({ success: true, data: req.user });
});

// 1. Overview KPIs
router.get('/overview', async (req, res) => {
  try {
    const vessels = await Vessel.find();
    const openAlerts = await Alert.countDocuments({ resolved: false });
    const criticalAlerts = await Alert.countDocuments({ severity: 'CRITICAL', resolved: false });
    const scheduledMaintenance = await MaintenanceTask.countDocuments({ status: { $ne: 'COMPLETED' } });
    const complianceAudits = await ComplianceAudit.find();

    const totalCapacityKg = vessels.reduce((acc, v) => acc + (v.capacityKg || 0), 0);
    const currentStockKg = vessels.reduce((acc, v) => acc + (v.currentStockKg || 0), 0);
    const avgSensorHealth = vessels.length > 0 
      ? Math.round(vessels.reduce((acc, v) => acc + (v.sensorHealthPercent || 0), 0) / vessels.length) 
      : 100;
    
    // Calculate compliance score
    const passedAudits = complianceAudits.filter(a => a.status === 'PASSED').length;
    const complianceScore = complianceAudits.length > 0 
      ? Math.round((passedAudits / complianceAudits.length) * 100) 
      : 100;

    res.json({
      success: true,
      data: {
        totalVessels: vessels.length,
        totalCapacityKg,
        currentStockKg,
        storageUtilizationPercent: totalCapacityKg > 0 ? ((currentStockKg / totalCapacityKg) * 100).toFixed(1) : 0,
        openAlerts,
        criticalAlerts,
        avgSensorHealth,
        complianceScore,
        scheduledMaintenance,
        facilityStatus: criticalAlerts > 0 ? 'CRITICAL_HAZARD' : openAlerts > 0 ? 'ADVISORY_MONITOR' : 'NOMINAL_OPERATIONS'
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 1b. Crisis & Scenario Simulator (Progressive Dynamic Ramp & Safe Reset)
router.post('/simulator/scenario', async (req, res) => {
  try {
    const { scenario } = req.body;
    const io = req.app.get('io');
    
    // Trigger progressive drill ramp or safe baseline restore
    const drill = await startTelemetrySimulator.triggerDrill(scenario, io);

    const updatedVessels = await Vessel.find().sort({ vesselId: 1 });
    const updatedAlerts = await Alert.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      message: drill?.description || `Scenario ${scenario} initiated`,
      data: {
        drill,
        vessels: updatedVessels,
        alerts: updatedAlerts
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/simulator/drill', (req, res) => {
  res.json({
    success: true,
    data: startTelemetrySimulator.getActiveDrill()
  });
});

// 2. Vessel routes
router.get('/vessels', async (req, res) => {
  try {
    const vessels = await Vessel.find().sort({ vesselId: 1 });
    res.json({ success: true, data: vessels });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/vessels/:id', async (req, res) => {
  try {
    const vessel = await Vessel.findOne({ vesselId: req.params.id });
    if (!vessel) return res.status(404).json({ success: false, message: 'Vessel not found' });
    res.json({ success: true, data: vessel });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/vessels/:id/thresholds', async (req, res) => {
  try {
    const operatorRole = req.headers['x-operator-role'] || req.body.operatorRole;
    if (operatorRole && operatorRole !== 'SAFETY_ENGINEER') {
      return res.status(403).json({
        success: false,
        message: 'Access Denied: Adjusting MAWP/Safety thresholds requires Plant Safety Engineer authorization (Dr. Aris Thorne).'
      });
    }

    const { warningPressureBar, maxPressureBar, warningTempC, maxTempC, maxLelPercentage } = req.body;
    const vessel = await Vessel.findOneAndUpdate(
      { vesselId: req.params.id },
      { 
        $set: { 
          warningPressureBar, 
          maxPressureBar, 
          warningTempC, 
          maxTempC, 
          maxLelPercentage 
        } 
      },
      { new: true }
    );
    if (!vessel) return res.status(404).json({ success: false, message: 'Vessel not found' });

    // Re-evaluate status based on new thresholds
    let newStatus = 'NOMINAL';
    if (vessel.currentPressureBar >= vessel.maxPressureBar || vessel.lelPercentage >= vessel.maxLelPercentage) {
      newStatus = 'CRITICAL';
    } else if (vessel.currentPressureBar >= vessel.warningPressureBar || vessel.currentTempC >= vessel.warningTempC) {
      newStatus = 'WARNING';
    } else if (vessel.lelPercentage > 1.0) {
      newStatus = 'ADVISORY';
    }
    vessel.status = newStatus;
    await vessel.save();

    // Broadcast update
    if (req.app.get('io')) {
      req.app.get('io').emit('vessel:update', vessel);
    }

    res.json({ success: true, data: vessel });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/vessels/:id/relief-valve', async (req, res) => {
  try {
    const { reliefValveOpen, reason, operatorId, confirmed, operatorRole } = req.body;
    const role = req.headers['x-operator-role'] || operatorRole;

    if (role === 'COMPLIANCE_AUDITOR') {
      return res.status(403).json({
        success: false,
        message: 'Access Denied: Compliance Auditors hold read-only inspection clearance and cannot command emergency relief valves.'
      });
    }

    // Industrial safety validation: opening high-pressure relief valve requires explicit operator confirmation
    if (reliefValveOpen && confirmed !== true) {
      return res.status(400).json({ 
        success: false, 
        message: 'Confirmation required: Emergency manual venting must be explicitly confirmed by an operator.' 
      });
    }

    const vessel = await Vessel.findOne({ vesselId: req.params.id });
    if (!vessel) return res.status(404).json({ success: false, message: 'Vessel not found' });

    vessel.reliefValveOpen = Boolean(reliefValveOpen);
    if (!reliefValveOpen) {
      if (startTelemetrySimulator.getActiveDrill()?.type === 'ESD_VENT') {
        startTelemetrySimulator.clearDrill();
      }
    }
    if (reliefValveOpen && vessel.currentPressureBar > 350) {
      vessel.currentPressureBar = Math.max(vessel.currentPressureBar - 40, 280);
    }
    await vessel.save();

    const opId = operatorId || 'OP-CONSOLE-01';
    // Log audit action with operator tracking
    const alert = new Alert({
      alertId: `VLV-${Date.now().toString().slice(-6)}`,
      vesselId: vessel.vesselId,
      vesselName: vessel.name,
      zone: vessel.zone,
      severity: reliefValveOpen ? 'WARNING' : 'INFO',
      metric: 'Pressure Relief Vent Actuation',
      triggerValue: `${vessel.currentPressureBar} bar`,
      thresholdValue: `${vessel.warningPressureBar} bar`,
      message: `[Operator: ${opId}] Emergency manual pressure relief valve ${reliefValveOpen ? 'OPENED' : 'CLOSED'}: ${reason || 'Operator override triggered'}`,
      acknowledged: true,
      acknowledgedBy: opId,
      acknowledgedAt: new Date()
    });
    await alert.save();

    if (req.app.get('io')) {
      req.app.get('io').emit('vessel:update', vessel);
      req.app.get('io').emit('alert:new', alert);
    }

    res.json({ success: true, data: { vessel, alert } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 3. Telemetry routes
router.get('/telemetry/historical/:vesselId', async (req, res) => {
  try {
    const points = await Telemetry.find({ vesselId: req.params.vesselId })
      .sort({ timestamp: -1 })
      .limit(30);
    res.json({ success: true, data: points.reverse() });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 4. Alert routes
router.get('/alerts', async (req, res) => {
  try {
    const { severity, resolved } = req.query;
    const query = {};
    if (severity) query.severity = severity;
    if (resolved !== undefined) query.resolved = resolved === 'true';

    const alerts = await Alert.find(query).sort({ createdAt: -1 });
    res.json({ success: true, data: alerts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.patch('/alerts/:id/acknowledge', async (req, res) => {
  try {
    const { user = 'Lead Safety Operator' } = req.body;
    const alert = await Alert.findOneAndUpdate(
      { alertId: req.params.id },
      { 
        $set: { 
          acknowledged: true, 
          acknowledgedBy: user, 
          acknowledgedAt: new Date() 
        } 
      },
      { new: true }
    );
    if (!alert) return res.status(404).json({ success: false, message: 'Alert not found' });
    
    if (req.app.get('io')) {
      req.app.get('io').emit('alert:acknowledged', alert);
    }
    res.json({ success: true, data: alert });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.patch('/alerts/:id/resolve', async (req, res) => {
  try {
    const alert = await Alert.findOneAndUpdate(
      { alertId: req.params.id },
      { 
        $set: { 
          resolved: true, 
          resolvedAt: new Date() 
        } 
      },
      { new: true }
    );
    if (!alert) return res.status(404).json({ success: false, message: 'Alert not found' });

    let updatedVessel = null;
    const defaultPressures = {
      'H2-TNK-01': 585.0,
      'H2-TNK-02': 18.2,
      'H2-TNK-03': 565.0,
      'H2-TNK-04': 295.0,
      'H2-TNK-05': 185.0,
      'H2-TNK-06': 260.0
    };
    const defaultTemperatures = {
      'H2-TNK-01': 24.2,
      'H2-TNK-02': -251.5,
      'H2-TNK-03': 23.8,
      'H2-TNK-04': 22.4,
      'H2-TNK-05': 16.5,
      'H2-TNK-06': 21.0
    };

    const io = req.app.get('io');

    // When resolving an alert, fix the affected vessel's physical telemetry
    if (alert.vesselId && alert.vesselId !== 'FACILITY-ALL' && alert.vesselId !== 'Site Wide') {
      const vessel = await Vessel.findOne({ vesselId: alert.vesselId });
      if (vessel) {
        const otherUnresolved = await Alert.find({ vesselId: alert.vesselId, resolved: false });
        
        if (otherUnresolved.length === 0) {
          vessel.currentPressureBar = defaultPressures[vessel.vesselId] || 450;
          vessel.currentTempC = defaultTemperatures[vessel.vesselId] || 22.5;
          vessel.currentH2ConcentrationPpm = 45;
          vessel.lelPercentage = 0.11;
          vessel.sensorHealthPercent = 99;
          vessel.reliefValveOpen = false;
          vessel.status = 'NOMINAL';
        } else {
          const hasCritical = otherUnresolved.some(a => a.severity === 'CRITICAL');
          vessel.status = hasCritical ? 'CRITICAL' : 'WARNING';
        }

        vessel.currentStockKg = Math.max(10, Math.round(vessel.capacityKg * Math.min(1, vessel.currentPressureBar / vessel.maxPressureBar)));
        await vessel.save();
        updatedVessel = vessel;

        // Record a clean telemetry point so charts reflect resolution immediately
        const telemetryPoint = new Telemetry({
          timestamp: new Date(),
          vesselId: vessel.vesselId,
          pressureBar: vessel.currentPressureBar,
          tempC: vessel.currentTempC,
          h2ConcentrationPpm: vessel.currentH2ConcentrationPpm,
          lelPercentage: vessel.lelPercentage,
          sensorHealthPercent: vessel.sensorHealthPercent,
          flowRateKgHr: 12.0,
          reliefValveOpen: vessel.reliefValveOpen
        });
        await telemetryPoint.save();

        if (io) {
          io.emit('vessel:update', vessel);
          io.emit('telemetry:stream', {
            vesselId: vessel.vesselId,
            telemetry: telemetryPoint,
            vessel: vessel
          });
        }
      }
    } else if (alert.vesselId === 'FACILITY-ALL') {
      // If facility-wide alert was resolved, reset all vessels
      const vessels = await Vessel.find();
      for (const v of vessels) {
        v.currentPressureBar = defaultPressures[v.vesselId] || 450;
        v.currentTempC = defaultTemperatures[v.vesselId] || 22.5;
        v.currentH2ConcentrationPpm = 45;
        v.lelPercentage = 0.11;
        v.sensorHealthPercent = 99;
        v.reliefValveOpen = false;
        v.status = 'NOMINAL';
        v.currentStockKg = Math.max(10, Math.round(v.capacityKg * Math.min(1, v.currentPressureBar / v.maxPressureBar)));
        await v.save();
        if (io) io.emit('vessel:update', v);
      }
    }

    if (io) {
      io.emit('alert:resolved', alert);

      const allVessels = await Vessel.find();
      const totalCapacityKg = allVessels.reduce((acc, v) => acc + (v.capacityKg || 0), 0);
      const currentStockKg = allVessels.reduce((acc, v) => acc + (v.currentStockKg || 0), 0);
      const openAlerts = await Alert.countDocuments({ resolved: false });
      const criticalAlerts = await Alert.countDocuments({ severity: 'CRITICAL', resolved: false });
      const avgSensorHealth = allVessels.length > 0 
        ? Math.round(allVessels.reduce((acc, v) => acc + (v.sensorHealthPercent || 0), 0) / allVessels.length) 
        : 100;

      io.emit('overview:update', {
        totalVessels: allVessels.length,
        totalCapacityKg,
        currentStockKg,
        storageUtilizationPercent: totalCapacityKg > 0 ? ((currentStockKg / totalCapacityKg) * 100).toFixed(1) : 0,
        activeAlertsCount: openAlerts,
        criticalAlertsCount: criticalAlerts,
        averageSensorHealth: avgSensorHealth,
        systemStatus: criticalAlerts > 0 ? 'CRITICAL' : (openAlerts > 0 ? 'WARNING' : 'HEALTHY')
      });
    }

    res.json({ 
      success: true, 
      data: alert, 
      vessel: updatedVessel,
      message: `Alert ${alert.alertId} resolved. Tank telemetry restored to safe operating baseline.`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/alerts', async (req, res) => {
  try {
    const { vesselId, severity, metric, message, triggerValue, thresholdValue } = req.body;
    const vessel = await Vessel.findOne({ vesselId });
    const alert = new Alert({
      alertId: `INC-${Date.now().toString().slice(-6)}`,
      vesselId,
      vesselName: vessel ? vessel.name : 'Facility Global',
      zone: vessel ? vessel.zone : 'Site Wide',
      severity: severity || 'WARNING',
      metric: metric || 'Safety Incident',
      triggerValue: triggerValue || 'N/A',
      thresholdValue: thresholdValue || 'N/A',
      message
    });
    await alert.save();

    if (vessel) {
      if (severity === 'CRITICAL') {
        vessel.status = 'CRITICAL';
      } else if (severity === 'WARNING' && vessel.status !== 'CRITICAL') {
        vessel.status = 'WARNING';
      }
      await vessel.save();
      if (req.app.get('io')) {
        req.app.get('io').emit('vessel:update', vessel);
      }
    }

    if (req.app.get('io')) {
      req.app.get('io').emit('alert:new', alert);
    }
    sendTelegramAlert(alert);
    res.status(201).json({ success: true, data: alert, vessel });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Telegram Notification Test Endpoint
router.post('/notifications/test-telegram', async (req, res) => {
  try {
    const result = await sendTelegramTest(req.body);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 5. Maintenance routes
router.get('/maintenance', async (req, res) => {
  try {
    const tasks = await MaintenanceTask.find().sort({ scheduledDate: 1 });
    res.json({ success: true, data: tasks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/maintenance', async (req, res) => {
  try {
    const { vesselId, title, category, priority, scheduledDate, technician, checklist, notes } = req.body;
    const vessel = await Vessel.findOne({ vesselId });
    const task = new MaintenanceTask({
      taskId: `MNT-${Date.now().toString().slice(-6)}`,
      vesselId,
      vesselName: vessel ? vessel.name : 'General Storage',
      title,
      category,
      priority,
      scheduledDate,
      technician,
      checklist: checklist || [
        { title: 'Visual inspection for hydrogen embrittlement microcracks', completed: false },
        { title: 'Electrochemical sensor 0-point calibration', completed: false },
        { title: 'Thermal relief burst disc integrity validation', completed: false }
      ],
      notes
    });
    await task.save();
    res.status(201).json({ success: true, data: task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.patch('/maintenance/:id', async (req, res) => {
  try {
    const task = await MaintenanceTask.findOneAndUpdate(
      { taskId: req.params.id },
      { $set: req.body },
      { new: true }
    );
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    res.json({ success: true, data: task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 6. Compliance routes
router.get('/compliance', async (req, res) => {
  try {
    const audits = await ComplianceAudit.find().sort({ standard: 1 });
    res.json({ success: true, data: audits });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.patch('/compliance/:id', async (req, res) => {
  try {
    const audit = await ComplianceAudit.findOneAndUpdate(
      { auditId: req.params.id },
      { $set: req.body },
      { new: true }
    );
    if (!audit) return res.status(404).json({ success: false, message: 'Audit item not found' });
    res.json({ success: true, data: audit });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

const mongoose = require('mongoose');
const Vessel = require('../models/Vessel');
const Telemetry = require('../models/Telemetry');
const Alert = require('../models/Alert');
const MaintenanceTask = require('../models/MaintenanceTask');
const ComplianceAudit = require('../models/ComplianceAudit');

const seedDatabase = async (force = false) => {
  try {
    const vesselCount = await Vessel.countDocuments();
    if (vesselCount > 0 && !force) {
      console.log('Database already has data. Skipping automatic seed. (Use --force to reseed)');
      return;
    }

    if (force) {
      console.log('Force reseed requested: purging existing records...');
      await Promise.all([
        Vessel.deleteMany({}),
        Telemetry.deleteMany({}),
        Alert.deleteMany({}),
        MaintenanceTask.deleteMany({}),
        ComplianceAudit.deleteMany({})
      ]);
      console.log('Purge completed. Seeding fresh industrial hydrogen storage dataset...');
    } else {
      console.log('Seeding initial industrial hydrogen storage data...');
    }

    // 1. Vessels
    const vessels = [
      {
        vesselId: 'H2-TNK-01',
        name: 'Alpha Primary Buffer (Type IV)',
        type: 'Type IV Composite (700 bar)',
        zone: 'Zone Alpha - High Pressure Pad',
        capacityKg: 1200,
        currentStockKg: 1040,
        currentPressureBar: 672,
        warningPressureBar: 650,
        maxPressureBar: 700,
        currentTempC: 38.5,
        warningTempC: 45.0,
        maxTempC: 65.0,
        currentH2ConcentrationPpm: 240,
        lelPercentage: 0.6,
        maxLelPercentage: 25.0,
        sensorHealthPercent: 99,
        reliefValveOpen: false,
        status: 'WARNING'
      },
      {
        vesselId: 'H2-TNK-02',
        name: 'Cryo-Liquid Vessel Cryo-101',
        type: 'Cryogenic Liquid (-253°C)',
        zone: 'Zone Beta - Cryogenic Storage Enclosure',
        capacityKg: 5000,
        currentStockKg: 4200,
        currentPressureBar: 18.2,
        warningPressureBar: 22.0,
        maxPressureBar: 25.0,
        currentTempC: -251.2,
        warningTempC: -248.0,
        maxTempC: -240.0,
        currentH2ConcentrationPpm: 1240,
        lelPercentage: 3.1,
        maxLelPercentage: 25.0,
        sensorHealthPercent: 96,
        reliefValveOpen: false,
        status: 'ADVISORY'
      },
      {
        vesselId: 'H2-TNK-03',
        name: 'Alpha Secondary Buffer (Type IV)',
        type: 'Type IV Composite (700 bar)',
        zone: 'Zone Alpha - High Pressure Pad',
        capacityKg: 1200,
        currentStockKg: 850,
        currentPressureBar: 520,
        warningPressureBar: 650,
        maxPressureBar: 700,
        currentTempC: 24.1,
        warningTempC: 45.0,
        maxTempC: 65.0,
        currentH2ConcentrationPpm: 80,
        lelPercentage: 0.2,
        maxLelPercentage: 25.0,
        sensorHealthPercent: 100,
        reliefValveOpen: false,
        status: 'NOMINAL'
      },
      {
        vesselId: 'H2-TNK-04',
        name: 'Dispenser Loop Header 350',
        type: 'High-Pressure Gaseous (350 bar)',
        zone: 'Zone Gamma - Dispenser Manifold',
        capacityKg: 650,
        currentStockKg: 480,
        currentPressureBar: 330,
        warningPressureBar: 340,
        maxPressureBar: 360,
        currentTempC: 22.4,
        warningTempC: 40.0,
        maxTempC: 60.0,
        currentH2ConcentrationPpm: 110,
        lelPercentage: 0.28,
        maxLelPercentage: 25.0,
        sensorHealthPercent: 97,
        reliefValveOpen: false,
        status: 'NOMINAL'
      },
      {
        vesselId: 'H2-TNK-05',
        name: 'Underground Cavern Buffer C-1',
        type: 'Underground Cavern Buffer',
        zone: 'Zone Delta - Cavern Wellhead',
        capacityKg: 15000,
        currentStockKg: 13200,
        currentPressureBar: 185,
        warningPressureBar: 210,
        maxPressureBar: 230,
        currentTempC: 16.8,
        warningTempC: 30.0,
        maxTempC: 50.0,
        currentH2ConcentrationPpm: 60,
        lelPercentage: 0.15,
        maxLelPercentage: 25.0,
        sensorHealthPercent: 98,
        reliefValveOpen: false,
        status: 'NOMINAL'
      },
      {
        vesselId: 'H2-TNK-06',
        name: 'Emergency Vent Recovery Bank',
        type: 'High-Pressure Gaseous (350 bar)',
        zone: 'Zone Epsilon - Flare & Relief System',
        capacityKg: 800,
        currentStockKg: 120,
        currentPressureBar: 42,
        warningPressureBar: 300,
        maxPressureBar: 350,
        currentTempC: 21.0,
        warningTempC: 45.0,
        maxTempC: 65.0,
        currentH2ConcentrationPpm: 140,
        lelPercentage: 0.35,
        maxLelPercentage: 25.0,
        sensorHealthPercent: 94,
        reliefValveOpen: false,
        status: 'NOMINAL'
      }
    ];
    await Vessel.insertMany(vessels);

    // 2. Telemetry History (generate 30 history points for each vessel)
    const now = Date.now();
    const telemetryEntries = [];
    vessels.forEach(v => {
      for (let i = 30; i >= 0; i--) {
        const timeOffset = i * 60 * 1000;
        const jitter = (Math.random() - 0.5) * 4;
        telemetryEntries.push({
          timestamp: new Date(now - timeOffset),
          vesselId: v.vesselId,
          pressureBar: +(v.currentPressureBar + jitter).toFixed(1),
          tempC: +(v.currentTempC + (Math.random() - 0.5) * 1.5).toFixed(1),
          h2ConcentrationPpm: Math.max(20, Math.round(v.currentH2ConcentrationPpm + (Math.random() - 0.5) * 30)),
          lelPercentage: +(v.lelPercentage + (Math.random() - 0.5) * 0.1).toFixed(2),
          sensorHealthPercent: v.sensorHealthPercent,
          flowRateKgHr: +(Math.random() * 25).toFixed(1),
          reliefValveOpen: v.reliefValveOpen
        });
      }
    });
    await Telemetry.insertMany(telemetryEntries);

    // 3. Alerts
    const alerts = [
      {
        alertId: 'ALT-10824',
        vesselId: 'H2-TNK-01',
        vesselName: 'Alpha Primary Buffer (Type IV)',
        zone: 'Zone Alpha - High Pressure Pad',
        severity: 'WARNING',
        metric: 'Head Pressure',
        triggerValue: '672.0 bar',
        thresholdValue: '650.0 bar warning threshold',
        message: 'Head pressure exceeded 650 bar warning ceiling during rapid compression cycle.',
        acknowledged: false
      },
      {
        alertId: 'ALT-10822',
        vesselId: 'H2-TNK-02',
        vesselName: 'Cryo-Liquid Vessel Cryo-101',
        zone: 'Zone Beta - Cryogenic Storage Enclosure',
        severity: 'ADVISORY',
        metric: 'LEL % Lower Explosive Limit',
        triggerValue: '3.1% LEL (1240 ppm)',
        thresholdValue: '1.0% LEL advisory ceiling',
        message: 'Minor hydrogen sensor drift or seal weeping detected near transfer flange B-2.',
        acknowledged: true,
        acknowledgedBy: 'J. Reynolds (Safety Tech #41)',
        acknowledgedAt: new Date(now - 45 * 60 * 1000)
      },
      {
        alertId: 'ALT-10815',
        vesselId: 'H2-TNK-04',
        vesselName: 'Dispenser Loop Header 350',
        zone: 'Zone Gamma - Dispenser Manifold',
        severity: 'ADVISORY',
        metric: 'Dispenser Line Delta P',
        triggerValue: '342.0 bar',
        thresholdValue: '340.0 bar advisory limit',
        message: 'Transient pressure surge stabilized via secondary bypass modulation.',
        acknowledged: true,
        acknowledgedBy: 'M. Vance (Operator #4202)',
        acknowledgedAt: new Date(now - 3 * 60 * 60 * 1000),
        resolved: true,
        resolvedAt: new Date(now - 2 * 60 * 60 * 1000)
      }
    ];
    await Alert.insertMany(alerts);

    // 4. Maintenance Tasks
    const maintenanceTasks = [
      {
        taskId: 'MNT-4029',
        vesselId: 'H2-TNK-01',
        vesselName: 'Alpha Primary Buffer (Type IV)',
        title: 'Electrochemical H2 Sensor Recalibration & Span Test',
        category: 'SENSOR_CALIBRATION',
        priority: 'HIGH',
        status: 'SCHEDULED',
        technician: 'K. Patel (Certified Level III)',
        scheduledDate: new Date(now + 24 * 60 * 60 * 1000),
        checklist: [
          { title: 'Zero gas zero-point verification (99.999% N2)', completed: false },
          { title: '50% LEL span calibration gas challenge', completed: false },
          { title: 'Response time verification (T90 < 10 sec)', completed: false }
        ],
        notes: 'Priority service following threshold alert ALT-10824.'
      },
      {
        taskId: 'MNT-4025',
        vesselId: 'H2-TNK-02',
        vesselName: 'Cryo-Liquid Vessel Cryo-101',
        title: 'Transfer Flange B-2 Sniffer & O-Ring Vacuum Inspection',
        category: 'FLANGE_SEAL_TEST',
        priority: 'MEDIUM',
        status: 'IN_PROGRESS',
        technician: 'D. Vance (Cryo Lead)',
        scheduledDate: new Date(now - 2 * 60 * 60 * 1000),
        checklist: [
          { title: 'Helium mass spectrometer leak detector test', completed: true },
          { title: 'Cryogenic valve cold torque verification', completed: false },
          { title: 'Purge line nitrogen flush', completed: false }
        ],
        notes: 'Investigating advisory sniff reading.'
      },
      {
        taskId: 'MNT-4031',
        vesselId: 'H2-TNK-05',
        vesselName: 'Underground Cavern Buffer C-1',
        title: 'NFPA 2 Cavern Wellhead ESD & Emergency Isolation Proof Test',
        category: 'NFPA_SHUTDOWN_TEST',
        priority: 'MEDIUM',
        status: 'SCHEDULED',
        technician: 'Dr. M. Chen (ASNT Level III)',
        scheduledDate: new Date(now + 48 * 60 * 60 * 1000),
        checklist: [
          { title: 'Emergency shutdown (ESD) dual solenoid trip circuit', completed: false },
          { title: 'Wellhead casing annular pressure verification', completed: false },
          { title: 'Downhole safety valve (DHSV) pneumatic closure timing test', completed: false }
        ],
        notes: 'Statutory bi-annual cavern wellhead emergency isolation proof test.'
      },
      {
        taskId: 'MNT-3990',
        vesselId: 'H2-TNK-04',
        vesselName: 'Dispenser Loop Header 350',
        title: 'Quarterly Dual Relief Valve Seat Integrity Test',
        category: 'PRESSURE_RELIEF_INSPECTION',
        priority: 'LOW',
        status: 'COMPLETED',
        technician: 'A. Kowalski',
        scheduledDate: new Date(now - 7 * 24 * 60 * 60 * 1000),
        completedDate: new Date(now - 6 * 24 * 60 * 60 * 1000),
        checklist: [
          { title: 'Pneumatic lift set pressure check at 360 bar', completed: true },
          { title: 'Reseat bubble leakage count test', completed: true },
          { title: 'Security wire seal re-tagging', completed: true }
        ],
        notes: 'Passed ASME Section VIII inspection.'
      }
    ];
    await MaintenanceTask.insertMany(maintenanceTasks);

    // 5. Compliance Audits
    const complianceAudits = [
      {
        auditId: 'AUD-ISO-19880',
        standard: 'ISO 19880-1:2020',
        sectionTitle: 'Gaseous Hydrogen Station & Facility Safety Measures',
        scope: 'Overpressure safety, emergency shutdown (ESD) circuits, and vent stack dispersion',
        status: 'PASSED',
        auditor: 'TUV Rheinland Global Inspection',
        lastAuditDate: new Date(now - 60 * 24 * 60 * 60 * 1000),
        nextAuditDate: new Date(now + 120 * 24 * 60 * 60 * 1000),
        findingsCount: 0,
        criticalNotes: 'Automated fast-closing ESD valves closed within 1.2s (spec < 2.0s).'
      },
      {
        auditId: 'AUD-NFPA-2',
        standard: 'NFPA 2: Hydrogen Tech',
        sectionTitle: 'Hazard Isolation & Gas Detection Distances (Ch. 6 & 7)',
        scope: 'Sensor density around vaporizers, compressor enclosures, and setback boundaries',
        status: 'ATTENTION_REQUIRED',
        auditor: 'Internal Health & Safety Bureau',
        lastAuditDate: new Date(now - 14 * 24 * 60 * 60 * 1000),
        nextAuditDate: new Date(now + 16 * 24 * 60 * 60 * 1000),
        findingsCount: 1,
        criticalNotes: 'Zone Beta flange B-2 micro-leakage observation needs corrective closeout ticket.',
        remedialAction: 'Execute MNT-4025 cryogenic gasket replacement before 14-day re-inspection.'
      },
      {
        auditId: 'AUD-OSHA-1910',
        standard: 'OSHA 1910.103',
        sectionTitle: 'Hydrogen System Piping, Tubing & Fitting Certification',
        scope: 'Welded joints, mechanical joints, vent discharge height > 15ft above grade',
        status: 'PASSED',
        auditor: 'OSHA Field Inspectorate',
        lastAuditDate: new Date(now - 180 * 24 * 60 * 60 * 1000),
        nextAuditDate: new Date(now + 185 * 24 * 60 * 60 * 1000),
        findingsCount: 0,
        criticalNotes: 'Full compliance with ASME B31.3 Process Piping standards.'
      },
      {
        auditId: 'AUD-ASME-VIII',
        standard: 'ASME Section VIII Div 3',
        sectionTitle: 'High-Pressure Composite Vessel Integrity & Life Cycle Limits',
        scope: 'Type IV liner fatigue cycles, strain gauge records, and acoustic emission logs',
        status: 'PASSED',
        auditor: 'National Board Inspector',
        lastAuditDate: new Date(now - 90 * 24 * 60 * 60 * 1000),
        nextAuditDate: new Date(now + 275 * 24 * 60 * 60 * 1000),
        findingsCount: 0,
        criticalNotes: 'Pressure cycles at 1,420 of 15,000 rated design life.'
      }
    ];
    await ComplianceAudit.insertMany(complianceAudits);

    console.log('Database seeded successfully with rich realistic enterprise records!');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
};

module.exports = seedDatabase;

if (require.main === module) {
  require('dotenv').config();
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hydrogen_safety';
  const force = process.argv.includes('--force') || process.argv.includes('-f');
  console.log(`Connecting to MongoDB Atlas at: ${uri.replace(/:([^@]+)@/, ':****@')}`);
  mongoose.connect(uri)
    .then(async () => {
      console.log('Successfully connected to MongoDB Atlas!');
      await seedDatabase(force);
      await mongoose.disconnect();
      console.log('Seed completed and disconnected cleanly.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('MongoDB Atlas Connection Error:', err.message);
      process.exit(1);
    });
}

const Vessel = require('../models/Vessel');
const Telemetry = require('../models/Telemetry');
const Alert = require('../models/Alert');

let simTick = 0;
let activeDrill = null;

const NOMINAL_BASELINES = {
  'H2-TNK-01': { pressure: 585.0, temp: 24.2, ppm: 45, lel: 0.11, health: 99 },
  'H2-TNK-02': { pressure: 18.2, temp: -251.5, ppm: 45, lel: 0.11, health: 99 },
  'H2-TNK-03': { pressure: 565.0, temp: 23.8, ppm: 45, lel: 0.11, health: 99 },
  'H2-TNK-04': { pressure: 295.0, temp: 22.4, ppm: 45, lel: 0.11, health: 99 },
  'H2-TNK-05': { pressure: 185.0, temp: 16.5, ppm: 45, lel: 0.11, health: 99 },
  'H2-TNK-06': { pressure: 260.0, temp: 21.0, ppm: 45, lel: 0.11, health: 99 }
};

const triggerDrill = async (scenario, io) => {
  if (scenario === 'OVERPRESSURE') {
    activeDrill = {
      type: 'OVERPRESSURE',
      targetVesselId: 'H2-TNK-01',
      phase: 'RAMPING_UP',
      step: 0,
      totalSteps: 5,
      targetPressure: 694.5,
      warnAlertCreated: false,
      critAlertCreated: false,
      description: 'Progressive Overpressure Escalation Ramp (NFPA 2 §6.3)'
    };
  } else if (scenario === 'LEAK') {
    activeDrill = {
      type: 'LEAK',
      targetVesselId: 'H2-TNK-02',
      phase: 'RAMPING_UP',
      step: 0,
      totalSteps: 5,
      targetPpm: 7400,
      warnAlertCreated: false,
      critAlertCreated: false,
      description: 'Progressive Flammable Gas Dispersion Ramp (ISO 19880 §9.2)'
    };
  } else if (scenario === 'SENSOR_FAIL') {
    activeDrill = {
      type: 'SENSOR_FAIL',
      targetVesselId: 'H2-TNK-04',
      phase: 'RAMPING_UP',
      step: 0,
      totalSteps: 4,
      targetHealth: 34,
      alertCreated: false,
      description: 'Progressive Sensor Heartbeat Degradation (ISA-18.2)'
    };
  } else if (scenario === 'ESD_VENT') {
    activeDrill = {
      type: 'ESD_VENT',
      phase: 'RAMPING_DOWN',
      step: 0,
      totalSteps: 4,
      alertCreated: false,
      description: 'Emergency Facility Depressurization to Flare Stack'
    };
  } else if (scenario === 'RESET') {
    activeDrill = {
      type: 'RESET',
      phase: 'RESTORING',
      step: 0,
      totalSteps: 5,
      description: 'Controlled Plant Restoration: Smoothly Returning to Nominal Baseline'
    };
  }

  if (io && activeDrill) {
    io.emit('simulator:drill_status', activeDrill);
  }

  return activeDrill;
};

const getActiveDrill = () => activeDrill;

const startTelemetrySimulator = (io) => {
  console.log('Hydrogen Telemetry Simulator initiated (interval: 3s, dynamic MonotoneX ramp & safe restore active)');

  setInterval(async () => {
    try {
      const vessels = await Vessel.find();
      if (!vessels || vessels.length === 0) return;

      simTick += 0.25;
      const updatedVessels = [];

      // Advance drill progress if active
      if (activeDrill) {
        activeDrill.step += 1;
        if (activeDrill.step >= activeDrill.totalSteps && activeDrill.phase === 'RAMPING_UP') {
          activeDrill.phase = 'HOLDING';
        }
      }

      for (const targetVessel of vessels) {
        const vesselSeed = targetVessel.vesselId.charCodeAt(targetVessel.vesselId.length - 1);
        const baseline = NOMINAL_BASELINES[targetVessel.vesselId] || {
          pressure: targetVessel.maxPressureBar * 0.8,
          temp: targetVessel.warningTempC < 0 ? -251.5 : 23.2,
          ppm: 45,
          lel: 0.11,
          health: 99
        };

        let newPressure = targetVessel.currentPressureBar;
        let newTemp = targetVessel.currentTempC;
        let newH2 = targetVessel.currentH2ConcentrationPpm;
        let newLel = targetVessel.lelPercentage;
        let newHealth = targetVessel.sensorHealthPercent;

        // Apply Drill Ramp Dynamics
        if (activeDrill) {
          const progress = Math.min(1, activeDrill.step / activeDrill.totalSteps);

          if (activeDrill.type === 'OVERPRESSURE' && targetVessel.vesselId === activeDrill.targetVesselId) {
            // Smoothly ramp pressure upward toward 694.5 bar
            const pStart = baseline.pressure;
            const pTarget = activeDrill.targetPressure;
            newPressure = +(pStart + (pTarget - pStart) * progress + (Math.random() - 0.5) * 0.6).toFixed(1);

            // Progressive ISA-18.2 Warning & Critical Alert generation
            if (newPressure >= targetVessel.warningPressureBar && !activeDrill.warnAlertCreated) {
              activeDrill.warnAlertCreated = true;
              const alert = new Alert({
                alertId: `ALT-${Date.now().toString().slice(-6)}`,
                vesselId: targetVessel.vesselId,
                vesselName: targetVessel.name,
                zone: targetVessel.zone,
                severity: 'WARNING',
                metric: 'Overpressure Warning Threshold Crossed',
                triggerValue: `${newPressure} bar`,
                thresholdValue: `Warning: ${targetVessel.warningPressureBar} bar (MAWP: ${targetVessel.maxPressureBar} bar)`,
                message: `VESSEL PRESSURE ESCALATING: H2-TNK-01 exceeded warning threshold (${targetVessel.warningPressureBar} bar) during compression cycle.`
              });
              await alert.save();
              if (io) io.emit('alert:new', alert);
            }

            if (newPressure >= (targetVessel.maxPressureBar - 6) && !activeDrill.critAlertCreated) {
              activeDrill.critAlertCreated = true;
              const alert = new Alert({
                alertId: `ALT-${Date.now().toString().slice(-6)}`,
                vesselId: targetVessel.vesselId,
                vesselName: targetVessel.name,
                zone: targetVessel.zone,
                severity: 'CRITICAL',
                metric: 'Critical MAWP Proximity Spike',
                triggerValue: `${newPressure} bar`,
                thresholdValue: `MAWP: ${targetVessel.maxPressureBar} bar`,
                message: 'CRITICAL OVERPRESSURE IMMINENT: Vessel approaching Maximum Allowable Working Pressure. Automated venting required.'
              });
              await alert.save();
              if (io) io.emit('alert:new', alert);
            }
          } else if (activeDrill.type === 'LEAK' && targetVessel.vesselId === activeDrill.targetVesselId) {
            // Smoothly ramp gas dispersion upward
            const ppmTarget = activeDrill.targetPpm;
            newH2 = Math.round(baseline.ppm + (ppmTarget - baseline.ppm) * progress);
            newLel = +(newH2 / 400).toFixed(2);

            if (newLel >= 5.0 && !activeDrill.warnAlertCreated) {
              activeDrill.warnAlertCreated = true;
              const alert = new Alert({
                alertId: `ALT-${Date.now().toString().slice(-6)}`,
                vesselId: targetVessel.vesselId,
                vesselName: targetVessel.name,
                zone: targetVessel.zone,
                severity: 'WARNING',
                metric: 'Flammable Vapor Warning',
                triggerValue: `${newLel}% LEL (${newH2} ppm)`,
                thresholdValue: 'Threshold: 5.0% LEL',
                message: 'Trace hydrogen dispersion detected around flange seal. Zone ventilation commanded.'
              });
              await alert.save();
              if (io) io.emit('alert:new', alert);
            }

            if (newLel >= targetVessel.maxLelPercentage && !activeDrill.critAlertCreated) {
              activeDrill.critAlertCreated = true;
              const alert = new Alert({
                alertId: `ALT-${Date.now().toString().slice(-6)}`,
                vesselId: targetVessel.vesselId,
                vesselName: targetVessel.name,
                zone: targetVessel.zone,
                severity: 'CRITICAL',
                metric: 'Uncontrolled Gas Leak Dispersion',
                triggerValue: `${newLel}% LEL (${newH2} ppm)`,
                thresholdValue: `Ceiling: ${targetVessel.maxLelPercentage}% LEL`,
                message: 'UNCONTROLLED FLAMMABLE DISPERSION: Perimeter optical barrier breached in Zone Alpha. Fire suppression armed.'
              });
              await alert.save();
              if (io) io.emit('alert:new', alert);
            }
          } else if (activeDrill.type === 'SENSOR_FAIL' && targetVessel.vesselId === activeDrill.targetVesselId) {
            // Smoothly degrade sensor health
            newHealth = Math.round(baseline.health - (baseline.health - activeDrill.targetHealth) * progress);
            if (newHealth <= 60 && !activeDrill.alertCreated) {
              activeDrill.alertCreated = true;
              const alert = new Alert({
                alertId: `ALT-${Date.now().toString().slice(-6)}`,
                vesselId: targetVessel.vesselId,
                vesselName: targetVessel.name,
                zone: targetVessel.zone,
                severity: 'WARNING',
                metric: 'Sensor Telemetry Degradation',
                triggerValue: `${newHealth}% Signal Integrity`,
                thresholdValue: 'Threshold: 80%',
                message: 'Electrochemical sensor channel drift and heartbeat loss on manifold PT-401.'
              });
              await alert.save();
              if (io) io.emit('alert:new', alert);
            }
          } else if (activeDrill.type === 'ESD_VENT' && targetVessel.maxPressureBar > 100) {
            targetVessel.reliefValveOpen = true;
            newPressure = Math.max(200, +(newPressure - 35 * progress).toFixed(1));
            if (!activeDrill.alertCreated) {
              activeDrill.alertCreated = true;
              const alert = new Alert({
                alertId: `ESD-${Date.now().toString().slice(-6)}`,
                vesselId: 'FACILITY-ALL',
                vesselName: 'All Storage Vessels',
                zone: 'Site Wide',
                severity: 'INFO',
                metric: 'Emergency Shutdown (ESD) Vent Actuated',
                triggerValue: 'Operator ESD Command',
                thresholdValue: 'Manual Safety Interlock',
                message: 'Emergency depressurization active. Venting high-pressure buffers toward flare header.'
              });
              await alert.save();
              if (io) io.emit('alert:new', alert);
            }
          } else if (activeDrill.type === 'RESET') {
            // Resetting slowly brings plant back to normal over totalSteps
            targetVessel.reliefValveOpen = false;
            
            // Progressive smooth restoration toward baseline
            const rem = Math.max(1, activeDrill.totalSteps - activeDrill.step + 1);
            newPressure = +(newPressure + (baseline.pressure - newPressure) / rem).toFixed(1);
            newTemp = +(newTemp + (baseline.temp - newTemp) / rem).toFixed(1);
            newH2 = Math.max(15, Math.round(newH2 + (baseline.ppm - newH2) / rem));
            newLel = +(newH2 / 400).toFixed(2);
            newHealth = Math.min(100, Math.round(newHealth + (baseline.health - newHealth) / rem));

            // On final step, clamp securely to nominal baseline
            if (activeDrill.step >= activeDrill.totalSteps) {
              newPressure = baseline.pressure;
              newTemp = baseline.temp;
              newH2 = baseline.ppm;
              newLel = baseline.lel;
              newHealth = baseline.health;
            }
          }
        } else {
          // Standard Natural Wave Oscillation when no drill is ramping
          const waveOscillation = Math.sin(simTick + vesselSeed) * (targetVessel.maxPressureBar > 100 ? 2.5 : 0.3);
          const randomNoise = (Math.random() - 0.5) * (targetVessel.maxPressureBar > 100 ? 1.0 : 0.12);
          
          newPressure = +(newPressure + waveOscillation * 0.25 + randomNoise).toFixed(1);
          if (newPressure < 1) newPressure = 1;

          // Gentle baseline stabilization
          if (targetVessel.maxPressureBar > 100 && targetVessel.status === 'NOMINAL') {
            if (newPressure > targetVessel.warningPressureBar - 20) newPressure -= 1.2;
            if (newPressure < targetVessel.maxPressureBar * 0.72) newPressure += 1.2;
          }

          newH2 = Math.max(15, newH2 + Math.round((Math.random() - 0.5) * 4));
          newLel = +(newH2 / 400).toFixed(2);

          if (targetVessel.warningTempC < 0) {
            const cryoJitter = Math.sin(simTick * 0.5) * 0.15 + (Math.random() - 0.5) * 0.08;
            newTemp = +(-251.5 + cryoJitter).toFixed(1);
          } else {
            const ambientWave = Math.sin(simTick * 0.2) * 0.35 + (Math.random() - 0.5) * 0.12;
            newTemp = +(23.2 + ambientWave).toFixed(1);
          }

          if (targetVessel.reliefValveOpen) {
            newPressure = Math.max(newPressure - (targetVessel.maxPressureBar > 100 ? 8.0 : 1.2), 5.0);
          }
        }

        // ISA-18.2 Alarm Hysteresis / Deadband Check
        const wasCrit = targetVessel.status === 'CRITICAL';
        const wasWarn = targetVessel.status === 'WARNING';
        const pDeadband = targetVessel.maxPressureBar > 100 ? 5.0 : 0.5;
        const lelDeadband = 0.5;
        const tDeadband = 1.5;

        const pressureCrit = wasCrit ? newPressure >= (targetVessel.maxPressureBar - pDeadband) : newPressure >= targetVessel.maxPressureBar;
        const pressureWarn = wasWarn ? newPressure >= (targetVessel.warningPressureBar - pDeadband) : newPressure >= targetVessel.warningPressureBar;
        const lelCrit = wasCrit ? newLel >= (targetVessel.maxLelPercentage - lelDeadband) : newLel >= targetVessel.maxLelPercentage;
        const lelWarn = wasWarn ? newLel >= (5.0 - lelDeadband) : newLel >= 5.0;
        const tempCrit = wasCrit ? newTemp >= (targetVessel.maxTempC - tDeadband) : newTemp >= targetVessel.maxTempC;
        const tempWarn = wasWarn ? newTemp >= (targetVessel.warningTempC - tDeadband) : newTemp >= targetVessel.warningTempC;
        const healthWarn = newHealth <= 70;

        let status = 'NOMINAL';
        if (pressureCrit || lelCrit || tempCrit) {
          status = 'CRITICAL';
        } else if (pressureWarn || lelWarn || tempWarn || healthWarn) {
          status = 'WARNING';
        } else if (newLel > 1.0) {
          status = 'ADVISORY';
        }

        const newStockKg = Math.max(10, Math.round(targetVessel.capacityKg * Math.min(1, newPressure / targetVessel.maxPressureBar)));

        targetVessel.currentPressureBar = newPressure;
        targetVessel.currentTempC = newTemp;
        targetVessel.currentH2ConcentrationPpm = newH2;
        targetVessel.lelPercentage = newLel;
        targetVessel.sensorHealthPercent = newHealth;
        targetVessel.currentStockKg = newStockKg;
        targetVessel.status = status;
        await targetVessel.save();

        // Save historical telemetry point
        const telemetryPoint = new Telemetry({
          timestamp: new Date(),
          vesselId: targetVessel.vesselId,
          pressureBar: newPressure,
          tempC: newTemp,
          h2ConcentrationPpm: newH2,
          lelPercentage: newLel,
          sensorHealthPercent: newHealth,
          flowRateKgHr: +(Math.random() * 20).toFixed(1),
          reliefValveOpen: targetVessel.reliefValveOpen
        });
        await telemetryPoint.save();

        io.emit('telemetry:stream', {
          vesselId: targetVessel.vesselId,
          telemetry: telemetryPoint,
          vessel: targetVessel
        });

        updatedVessels.push(targetVessel);
      }

      // Check if restoration complete
      if (activeDrill && activeDrill.type === 'RESET' && activeDrill.step >= activeDrill.totalSteps) {
        await Alert.updateMany({ resolved: false }, { $set: { resolved: true, resolvedAt: new Date() } });
        io.emit('alert:resolved', { all: true });
        activeDrill = null;
        io.emit('simulator:drill_status', null);
      } else if (activeDrill) {
        io.emit('simulator:drill_status', activeDrill);
      }

      // Recalculate facility overview
      const totalCapacityKg = updatedVessels.reduce((acc, v) => acc + (v.capacityKg || 0), 0);
      const currentStockKg = updatedVessels.reduce((acc, v) => acc + (v.currentStockKg || 0), 0);
      const openAlerts = await Alert.countDocuments({ resolved: false });
      const criticalAlerts = await Alert.countDocuments({ severity: 'CRITICAL', resolved: false });
      const avgSensorHealth = updatedVessels.length > 0 
        ? Math.round(updatedVessels.reduce((acc, v) => acc + (v.sensorHealthPercent || 0), 0) / updatedVessels.length) 
        : 100;

      io.emit('overview:update', {
        totalVessels: updatedVessels.length,
        totalCapacityKg,
        currentStockKg,
        storageUtilizationPercent: totalCapacityKg > 0 ? ((currentStockKg / totalCapacityKg) * 100).toFixed(1) : 0,
        openAlerts,
        criticalAlerts,
        avgSensorHealth,
        facilityStatus: criticalAlerts > 0 ? 'CRITICAL_HAZARD' : openAlerts > 0 ? 'ADVISORY_MONITOR' : 'NOMINAL_OPERATIONS'
      });

    } catch (err) {
      console.error('Simulator loop tick error:', err.message);
    }
  }, 3000);
};

startTelemetrySimulator.triggerDrill = triggerDrill;
startTelemetrySimulator.getActiveDrill = getActiveDrill;

module.exports = startTelemetrySimulator;

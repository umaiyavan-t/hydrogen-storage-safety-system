const Vessel = require('../models/Vessel');
const Telemetry = require('../models/Telemetry');
const Alert = require('../models/Alert');

let simTick = 0;

const startTelemetrySimulator = (io) => {
  console.log('Hydrogen Telemetry Simulator initiated (streaming interval: 3s, natural wave oscillation active)');

  setInterval(async () => {
    try {
      const vessels = await Vessel.find();
      if (!vessels || vessels.length === 0) return;

      simTick += 0.25;
      const updatedVessels = [];

      // Update ALL vessels on every heartbeat so no tank appears static
      for (const targetVessel of vessels) {
        // Natural compressor/dispenser breathing cycle wave
        const vesselSeed = targetVessel.vesselId.charCodeAt(targetVessel.vesselId.length - 1);
        const waveOscillation = Math.sin(simTick + vesselSeed) * (targetVessel.maxPressureBar > 100 ? 2.8 : 0.35);
        const randomNoise = (Math.random() - 0.5) * (targetVessel.maxPressureBar > 100 ? 1.2 : 0.15);
        
        let newPressure = +(targetVessel.currentPressureBar + waveOscillation * 0.3 + randomNoise).toFixed(1);
        if (newPressure < 1) newPressure = 1;

        // Keep ambient tanks in realistic bounds around their nominal baseline
        if (targetVessel.maxPressureBar > 100 && targetVessel.status === 'NOMINAL') {
          // If drifting too far from 580 bar, gently nudge back
          if (newPressure > targetVessel.warningPressureBar - 20) newPressure -= 1.5;
          if (newPressure < targetVessel.maxPressureBar * 0.7) newPressure += 1.5;
        }
        
        let newH2 = Math.max(15, targetVessel.currentH2ConcentrationPpm + Math.round((Math.random() - 0.5) * 6));
        let newLel = +(newH2 / 400).toFixed(2); // 40,000 ppm = 100% LEL

        // Handle temperature correctly for Cryogenic vs Ambient tanks
        let newTemp;
        if (targetVessel.warningTempC < 0) {
          // Cryogenic liquid hydrogen (-253°C nominal, normal between -252°C and -250.8°C)
          const cryoJitter = Math.sin(simTick * 0.5) * 0.2 + (Math.random() - 0.5) * 0.1;
          newTemp = +(-251.5 + cryoJitter).toFixed(1);
        } else {
          // Ambient pressurized gas tanks (20-25°C)
          const ambientWave = Math.sin(simTick * 0.2) * 0.4 + (Math.random() - 0.5) * 0.15;
          newTemp = +(23.2 + ambientWave).toFixed(1);
        }

        // If relief valve is open, rapidly drop pressure
        if (targetVessel.reliefValveOpen) {
          newPressure = Math.max(newPressure - (targetVessel.maxPressureBar > 100 ? 8.0 : 1.2), 5.0);
        }

        // ISA-18.2 Alarm Hysteresis / Deadband to prevent alarm chattering
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

        let status = 'NOMINAL';
        if (pressureCrit || lelCrit || tempCrit) {
          status = 'CRITICAL';
        } else if (pressureWarn || lelWarn || tempWarn) {
          status = 'WARNING';
        } else if (newLel > 1.0) {
          status = 'ADVISORY';
        }

        // Dynamically compute stored hydrogen mass based on current pressure ratio
        const newStockKg = Math.max(10, Math.round(targetVessel.capacityKg * Math.min(1, newPressure / targetVessel.maxPressureBar)));

        targetVessel.currentPressureBar = newPressure;
        targetVessel.currentTempC = newTemp;
        targetVessel.currentH2ConcentrationPpm = newH2;
        targetVessel.lelPercentage = newLel;
        targetVessel.currentStockKg = newStockKg;
        targetVessel.status = status;
        await targetVessel.save();

        // Store telemetry history point
        const telemetryPoint = new Telemetry({
          timestamp: new Date(),
          vesselId: targetVessel.vesselId,
          pressureBar: newPressure,
          tempC: newTemp,
          h2ConcentrationPpm: newH2,
          lelPercentage: newLel,
          sensorHealthPercent: targetVessel.sensorHealthPercent,
          flowRateKgHr: +(Math.random() * 20).toFixed(1),
          reliefValveOpen: targetVessel.reliefValveOpen
        });
        await telemetryPoint.save();

        // Emit live individual stream update
        io.emit('telemetry:stream', {
          vesselId: targetVessel.vesselId,
          telemetry: telemetryPoint,
          vessel: targetVessel
        });

        updatedVessels.push(targetVessel);
      }

      // Recalculate and emit overview metrics
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

module.exports = startTelemetrySimulator;

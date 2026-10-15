const mongoose = require('mongoose');

const telemetrySchema = new mongoose.Schema({
  // 30-day TTL retention for raw continuous sensor data
  timestamp: { type: Date, default: Date.now, expires: 2592000 },
  vesselId: { type: String, required: true },
  pressureBar: { type: Number, required: true },
  tempC: { type: Number, required: true },
  h2ConcentrationPpm: { type: Number, required: true },
  lelPercentage: { type: Number, required: true },
  sensorHealthPercent: { type: Number, required: true },
  flowRateKgHr: { type: Number, default: 0 },
  reliefValveOpen: { type: Boolean, default: false }
}, { timestamps: true });

telemetrySchema.index({ vesselId: 1, timestamp: -1 });

module.exports = mongoose.model('Telemetry', telemetrySchema);

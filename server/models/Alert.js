const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  alertId: { type: String, required: true, unique: true },
  vesselId: { type: String, required: true },
  vesselName: { type: String, required: true },
  zone: { type: String, required: true },
  severity: { 
    type: String, 
    enum: ['INFO', 'ADVISORY', 'WARNING', 'CRITICAL'], 
    default: 'ADVISORY' 
  },
  metric: { type: String, required: true }, // e.g. "Pressure", "LEL % Concentration", "Cryo Temperature", "Sensor Calibration"
  triggerValue: { type: String, required: true },
  thresholdValue: { type: String, required: true },
  message: { type: String, required: true },
  acknowledged: { type: Boolean, default: false },
  acknowledgedBy: { type: String, default: null },
  acknowledgedAt: { type: Date, default: null },
  resolved: { type: Boolean, default: false },
  resolvedAt: { type: Date, default: null }
}, { timestamps: true });

alertSchema.index({ severity: 1, acknowledged: 1 });

module.exports = mongoose.model('Alert', alertSchema);

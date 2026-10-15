const mongoose = require('mongoose');

const vesselSchema = new mongoose.Schema({
  vesselId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['Type IV Composite (700 bar)', 'Cryogenic Liquid (-253°C)', 'High-Pressure Gaseous (350 bar)', 'Underground Cavern Buffer'], 
    default: 'Type IV Composite (700 bar)' 
  },
  zone: { type: String, required: true },
  capacityKg: { type: Number, required: true },
  currentStockKg: { type: Number, required: true },
  currentPressureBar: { type: Number, required: true },
  maxPressureBar: { type: Number, required: true, default: 700 },
  warningPressureBar: { type: Number, default: 650 },
  currentTempC: { type: Number, required: true },
  maxTempC: { type: Number, default: 65 },
  warningTempC: { type: Number, default: 45 },
  currentH2ConcentrationPpm: { type: Number, default: 120 },
  lelPercentage: { type: Number, default: 0.3 }, // Lower Explosive Limit % (H2 is flammable >4% vol in air, ~40,000 ppm)
  maxLelPercentage: { type: Number, default: 25.0 }, // OSHA warning threshold is 25% LEL
  sensorHealthPercent: { type: Number, default: 98 },
  reliefValveOpen: { type: Boolean, default: false },
  status: { 
    type: String, 
    enum: ['NOMINAL', 'ADVISORY', 'WARNING', 'CRITICAL'], 
    default: 'NOMINAL' 
  },
  lastInspectionDate: { type: Date, default: Date.now },
  nextInspectionDate: { type: Date, default: () => new Date(Date.now() + 30*24*60*60*1000) }
}, { timestamps: true });

module.exports = mongoose.model('Vessel', vesselSchema);

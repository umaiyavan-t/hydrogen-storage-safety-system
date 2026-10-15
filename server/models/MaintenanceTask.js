const mongoose = require('mongoose');

const checklistItemSchema = new mongoose.Schema({
  title: { type: String, required: true },
  completed: { type: Boolean, default: false }
});

const maintenanceTaskSchema = new mongoose.Schema({
  taskId: { type: String, required: true, unique: true },
  vesselId: { type: String, required: true },
  vesselName: { type: String, required: true },
  title: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['SENSOR_CALIBRATION', 'PRESSURE_RELIEF_INSPECTION', 'FLANGE_SEAL_TEST', 'CRYOGENIC_INSULATION_CHECK', 'NFPA_SHUTDOWN_TEST'], 
    default: 'SENSOR_CALIBRATION' 
  },
  priority: { 
    type: String, 
    enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'], 
    default: 'MEDIUM' 
  },
  status: { 
    type: String, 
    enum: ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED'], 
    default: 'SCHEDULED' 
  },
  technician: { type: String, required: true },
  scheduledDate: { type: Date, required: true },
  completedDate: { type: Date, default: null },
  checklist: [checklistItemSchema],
  notes: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('MaintenanceTask', maintenanceTaskSchema);

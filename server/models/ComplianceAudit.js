const mongoose = require('mongoose');

const complianceAuditSchema = new mongoose.Schema({
  auditId: { type: String, required: true, unique: true },
  standard: { 
    type: String, 
    enum: ['ISO 19880-1:2020', 'NFPA 2: Hydrogen Tech', 'OSHA 1910.103', 'ASME Section VIII Div 3', 'CGA G-5.5'], 
    required: true 
  },
  sectionTitle: { type: String, required: true },
  scope: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['PASSED', 'ATTENTION_REQUIRED', 'NON_COMPLIANT', 'SCHEDULED'], 
    default: 'PASSED' 
  },
  auditor: { type: String, required: true },
  lastAuditDate: { type: Date, required: true },
  nextAuditDate: { type: Date, required: true },
  findingsCount: { type: Number, default: 0 },
  criticalNotes: { type: String, default: '' },
  remedialAction: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('ComplianceAudit', complianceAuditSchema);

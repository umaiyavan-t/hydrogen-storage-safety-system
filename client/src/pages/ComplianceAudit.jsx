import React, { useState } from 'react';
import { ShieldCheck, FileCheck, Printer, X, CheckCircle2 } from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';

export const ComplianceAudit = ({ audits, onUpdateAudit }) => {
  const [showCertModal, setShowCertModal] = useState(false);
  const passedCount = audits.filter(a => a.status === 'PASSED').length;
  const complianceRate = audits.length > 0 ? Math.round((passedCount / audits.length) * 100) : 100;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="panel" style={{ padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>Regulatory Safety &amp; Compliance Register</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Statutory tracking of NFPA 2 Hydrogen Technology Code, ISO 19880-1, and OSHA 1910.103 mandates.
          </p>
        </div>

        <button 
          id="btn-generate-cert"
          className="btn btn-primary btn-sm"
          onClick={() => setShowCertModal(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}
        >
          <FileCheck size={15} />
          <span>Generate Signed Audit Certificate</span>
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 18 }}>
        {audits.map(audit => (
          <div key={audit.auditId} className="panel">
            <div className="panel-header" style={{ alignItems: 'flex-start' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span className="mono" style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                    {audit.standard}
                  </span>
                  <StatusBadge status={audit.status} />
                </div>
                <h3 style={{ fontSize: '0.94rem', fontWeight: 700 }}>{audit.sectionTitle}</h3>
              </div>
            </div>

            <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Scope &amp; Mandate</div>
                <div style={{ fontSize: '0.84rem', color: 'var(--text-main)', marginTop: 2 }}>{audit.scope}</div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, background: '#f8fafc', padding: 10, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', fontSize: '0.78rem' }}>
                <div>
                  <span style={{ color: 'var(--text-dim)' }}>Auditing Body:</span>
                  <div style={{ fontWeight: 600 }}>{audit.auditor}</div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-dim)' }}>Next Cycle Due:</span>
                  <div className="mono" style={{ fontWeight: 600 }}>{new Date(audit.nextAuditDate).toLocaleDateString()}</div>
                </div>
              </div>

              {audit.criticalNotes && (
                <div style={{ fontSize: '0.8rem', color: '#475569' }}>
                  <strong>Inspector Observation:</strong> {audit.criticalNotes}
                </div>
              )}

              {audit.remedialAction && (
                <div style={{ 
                  background: 'var(--color-advisory-bg)', 
                  border: '1px solid var(--color-advisory-border)', 
                  padding: 8, 
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.78rem',
                  color: '#92400e'
                }}>
                  <strong>Required Remedial Action:</strong> {audit.remedialAction}
                </div>
              )}
            </div>

            <div style={{ padding: '10px 16px', background: '#fafafa', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>ID: {audit.auditId}</span>
              <button 
                className="btn btn-secondary btn-sm"
                onClick={() => onUpdateAudit(audit.auditId, { 
                  status: audit.status === 'PASSED' ? 'ATTENTION_REQUIRED' : 'PASSED',
                  remedialAction: audit.status === 'PASSED' ? 'Quarterly pressure verification pending' : ''
                })}
              >
                Toggle Audit State
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Official Signed Audit Certificate Modal */}
      {showCertModal && (
        <div className="modal-overlay" onClick={() => setShowCertModal(false)}>
          <div className="modal-content" style={{ maxWidth: 580 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ShieldCheck size={20} color="var(--color-success)" />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>
                  Statutory Safety &amp; Compliance Certificate
                </h3>
              </div>
              <button 
                onClick={() => setShowCertModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ fontSize: '0.85rem', lineHeight: 1.6 }}>
              <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: 12, marginBottom: 12 }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>
                  Certified Facility
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  H2Shield Hydrogen Storage Pad &bull; Storage Zone Alpha
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Cryogenic Dewars &amp; 700-Bar Gaseous Buffer Manifolds
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div style={{ background: '#f8fafc', padding: 10, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: 600 }}>Overall Compliance Rating</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: complianceRate >= 80 ? 'var(--color-success)' : 'var(--color-warning)' }}>
                    {complianceRate}% Passed
                  </div>
                </div>

                <div style={{ background: '#f8fafc', padding: 10, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: 600 }}>Statutory Standards</div>
                  <div style={{ fontWeight: 700, fontSize: '0.84rem' }}>
                    NFPA 2 &bull; ISO 19880-1 &bull; OSHA 1910
                  </div>
                </div>
              </div>

              <div style={{ background: 'var(--color-success-bg)', border: '1px solid var(--color-success-border)', borderRadius: 'var(--radius-sm)', padding: 10, marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, color: 'var(--color-success)', marginBottom: 2 }}>
                  <CheckCircle2 size={16} />
                  <span>Statutory Inspection Attestation</span>
                </div>
                <div style={{ fontSize: '0.78rem', color: '#065f46' }}>
                  All high-pressure hydrogen safety relief systems, flame pilot monitoring, and gas dispersion alarms have been certified according to international standard protocol.
                </div>
              </div>

              <div style={{ borderTop: '1px dashed var(--border-color)', paddingTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                <div>
                  <strong>Certified Auditor:</strong> Elena Rostova (AUD-9103)
                </div>
                <div className="mono">
                  Issued: {new Date().toLocaleDateString()}
                </div>
              </div>
            </div>

            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                Doc Ref: CERT-H2-2026-A1
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button 
                  className="btn btn-secondary btn-sm"
                  onClick={() => setShowCertModal(false)}
                >
                  Close
                </button>
                <button 
                  className="btn btn-primary btn-sm"
                  onClick={() => window.print()}
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <Printer size={14} />
                  <span>Print Certificate</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

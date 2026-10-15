import React from 'react';
import { ShieldCheck, FileCheck, AlertCircle, Building2 } from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';

export const ComplianceAudit = ({ audits, onUpdateAudit }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="panel" style={{ padding: 16 }}>
        <div>
          <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>Regulatory Safety & Compliance Register</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Statutory tracking of NFPA 2 Hydrogen Technology Code, ISO 19880-1, and OSHA 1910.103 mandates.
          </p>
        </div>
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
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Scope & Mandate</div>
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
    </div>
  );
};

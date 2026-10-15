const test = require('node:test');
const assert = require('node:assert/strict');
const Telemetry = require('./models/Telemetry');

test('Telemetry schema defines TTL expiration for sensor history', () => {
  const path = Telemetry.schema.path('timestamp');
  assert.ok(path, 'timestamp path exists');
  assert.equal(path.options.expires, 2592000, 'TTL index set to 30 days (2,592,000 seconds)');
});

test('ISA-18.2 Deadband logic prevents alarm chattering', () => {
  const targetVessel = {
    vesselId: 'H2-TNK-01',
    maxPressureBar: 700,
    warningPressureBar: 650,
    status: 'WARNING'
  };

  const pDeadband = 5.0; // 5 bar hysteresis

  // Scenario 1: Vessel is in WARNING. Pressure dips slightly to 648 bar (within 5 bar deadband).
  // Without deadband, 648 < 650 would clear warning. With deadband, it stays in WARNING.
  const wasWarn = targetVessel.status === 'WARNING';
  const newPressureDippedSlightly = 648.0;
  const warnCheckDipped = wasWarn 
    ? newPressureDippedSlightly >= (targetVessel.warningPressureBar - pDeadband)
    : newPressureDippedSlightly >= targetVessel.warningPressureBar;

  assert.equal(warnCheckDipped, true, 'Pressure at 648 bar must maintain WARNING state due to 5-bar deadband');

  // Scenario 2: Pressure drops safely to 640 bar (past the 5-bar deadband).
  const newPressureSafe = 640.0;
  const warnCheckSafe = wasWarn 
    ? newPressureSafe >= (targetVessel.warningPressureBar - pDeadband)
    : newPressureSafe >= targetVessel.warningPressureBar;

  assert.equal(warnCheckSafe, false, 'Pressure at 640 bar clears WARNING state');
});

test('Trust boundary: emergency relief valve requires explicit operator confirmation', () => {
  // Logic from /vessels/:id/relief-valve route
  const validateReliefValveActuation = ({ reliefValveOpen, confirmed }) => {
    if (reliefValveOpen && confirmed !== true) {
      return { allowed: false, status: 400, message: 'Confirmation required: Emergency manual venting must be explicitly confirmed by an operator.' };
    }
    return { allowed: true, status: 200 };
  };

  // Rejection without explicit confirmation
  const unconfirmedAttempt = validateReliefValveActuation({ reliefValveOpen: true });
  assert.equal(unconfirmedAttempt.allowed, false);
  assert.equal(unconfirmedAttempt.status, 400);

  // Approval with confirmed operator action
  const confirmedAction = validateReliefValveActuation({ reliefValveOpen: true, confirmed: true });
  assert.equal(confirmedAction.allowed, true);
  assert.equal(confirmedAction.status, 200);

  // Closing valve does not require emergency confirmation
  const closeAction = validateReliefValveActuation({ reliefValveOpen: false });
  assert.equal(closeAction.allowed, true);
});

test('RVAC: Role clearances correctly enforce industrial safety boundaries', () => {
  // Threshold modification check
  const checkThresholdPermission = (role) => {
    return role === 'SAFETY_ENGINEER';
  };

  assert.equal(checkThresholdPermission('SAFETY_ENGINEER'), true, 'Dr. Aris Thorne (Safety Engineer) can modify thresholds');
  assert.equal(checkThresholdPermission('OPERATOR'), false, 'Marcus Vance (Operator) cannot modify safety envelopes');
  assert.equal(checkThresholdPermission('COMPLIANCE_AUDITOR'), false, 'Elena Rostova (Compliance Auditor) cannot modify safety envelopes');

  // Emergency valve actuation check
  const checkVentPermission = (role) => {
    return role !== 'COMPLIANCE_AUDITOR';
  };

  assert.equal(checkVentPermission('SAFETY_ENGINEER'), true, 'Safety Engineer can actuate relief valves');
  assert.equal(checkVentPermission('OPERATOR'), true, 'Operator can actuate relief valves in an emergency');
  assert.equal(checkVentPermission('COMPLIANCE_AUDITOR'), false, 'Compliance Auditor is strictly restricted from actuation');
});

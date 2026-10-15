const API_HOST = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
const BASE_URL = API_HOST ? (API_HOST.endsWith('/api') ? API_HOST : `${API_HOST}/api`) : '/api';

export const api = {
  getOverview: async () => {
    const res = await fetch(`${BASE_URL}/overview`);
    return res.json();
  },
  triggerScenario: async (scenario) => {
    const res = await fetch(`${BASE_URL}/simulator/scenario`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario })
    });
    return res.json();
  },
  getVessels: async () => {
    const res = await fetch(`${BASE_URL}/vessels`);
    return res.json();
  },
  getVessel: async (id) => {
    const res = await fetch(`${BASE_URL}/vessels/${id}`);
    return res.json();
  },
  updateThresholds: async (id, thresholds) => {
    const res = await fetch(`${BASE_URL}/vessels/${id}/thresholds`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(thresholds)
    });
    return res.json();
  },
  toggleReliefValve: async (id, payload) => {
    const res = await fetch(`${BASE_URL}/vessels/${id}/relief-valve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.json();
  },
  getTelemetryHistory: async (vesselId) => {
    const res = await fetch(`${BASE_URL}/telemetry/historical/${vesselId}`);
    return res.json();
  },
  getAlerts: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${BASE_URL}/alerts${query ? '?' + query : ''}`);
    return res.json();
  },
  acknowledgeAlert: async (id, user) => {
    const res = await fetch(`${BASE_URL}/alerts/${id}/acknowledge`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user })
    });
    return res.json();
  },
  resolveAlert: async (id) => {
    const res = await fetch(`${BASE_URL}/alerts/${id}/resolve`, {
      method: 'PATCH'
    });
    return res.json();
  },
  createAlert: async (data) => {
    const res = await fetch(`${BASE_URL}/alerts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },
  getMaintenanceTasks: async () => {
    const res = await fetch(`${BASE_URL}/maintenance`);
    return res.json();
  },
  createMaintenanceTask: async (task) => {
    const res = await fetch(`${BASE_URL}/maintenance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(task)
    });
    return res.json();
  },
  updateMaintenanceTask: async (id, update) => {
    const res = await fetch(`${BASE_URL}/maintenance/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(update)
    });
    return res.json();
  },
  getComplianceAudits: async () => {
    const res = await fetch(`${BASE_URL}/compliance`);
    return res.json();
  },
  updateComplianceAudit: async (id, update) => {
    const res = await fetch(`${BASE_URL}/compliance/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(update)
    });
    return res.json();
  },
  getRoles: async () => {
    const res = await fetch(`${BASE_URL}/auth/roles`);
    return res.json();
  },
  login: async (credentials) => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    return res.json();
  }
};

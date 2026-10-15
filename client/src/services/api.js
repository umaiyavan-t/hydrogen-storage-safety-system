const normalizeUrl = (raw) => {
  if (!raw) return '';
  let url = raw.trim();
  if (url === 'hydrogen-safety-server' || url === 'hydrogen-safety-server/') {
    return 'https://hydrogen-safety-server.onrender.com';
  }
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    if (url.includes('localhost') || url.includes('127.0.0.1')) {
      url = `http://${url}`;
    } else {
      url = `https://${url}`;
    }
  }
  return url.replace(/\/+$/, '');
};

const getBaseUrl = () => {
  const envUrl = normalizeUrl(import.meta.env.VITE_API_URL);
  if (envUrl) {
    return envUrl.endsWith('/api') ? envUrl : `${envUrl}/api`;
  }
  if (typeof window !== 'undefined') {
    if (window.location.hostname.includes('onrender.com')) {
      return 'https://hydrogen-safety-server.onrender.com/api';
    }
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return `${window.location.protocol}//${window.location.hostname}:5000/api`;
    }
  }
  return '/api';
};

const BASE_URL = getBaseUrl();

const getAuthHeaders = () => {
  try {
    const token = localStorage.getItem('h2_auth_token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  } catch {
    return {};
  }
};

const fetchWithAuth = async (url, options = {}) => {
  const headers = { ...options.headers };
  const auth = getAuthHeaders();
  if (auth.Authorization && !headers.Authorization) {
    headers.Authorization = auth.Authorization;
  }
  try {
    const res = await fetch(url, { ...options, headers });
    const data = await res.json();
    if (res.status === 401 || (data && data.success === false && data.message?.includes('token'))) {
      try { localStorage.removeItem('h2_auth_token'); } catch {}
    }
    return data;
  } catch (err) {
    console.error(`Fetch error for ${url}:`, err);
    return { success: false, message: err.message };
  }
};

export const api = {
  getOverview: async () => {
    return fetchWithAuth(`${BASE_URL}/overview`);
  },
  triggerScenario: async (scenario) => {
    return fetchWithAuth(`${BASE_URL}/simulator/scenario`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario })
    });
  },
  getVessels: async () => {
    return fetchWithAuth(`${BASE_URL}/vessels`);
  },
  getVessel: async (id) => {
    return fetchWithAuth(`${BASE_URL}/vessels/${id}`);
  },
  updateThresholds: async (id, thresholds) => {
    return fetchWithAuth(`${BASE_URL}/vessels/${id}/thresholds`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(thresholds)
    });
  },
  toggleReliefValve: async (id, payload) => {
    return fetchWithAuth(`${BASE_URL}/vessels/${id}/relief-valve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  },
  getTelemetryHistory: async (vesselId) => {
    return fetchWithAuth(`${BASE_URL}/telemetry/historical/${vesselId}`);
  },
  getAlerts: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchWithAuth(`${BASE_URL}/alerts${query ? '?' + query : ''}`);
  },
  acknowledgeAlert: async (id, user) => {
    return fetchWithAuth(`${BASE_URL}/alerts/${id}/acknowledge`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user })
    });
  },
  resolveAlert: async (id) => {
    return fetchWithAuth(`${BASE_URL}/alerts/${id}/resolve`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' }
    });
  },
  createAlert: async (alertData) => {
    return fetchWithAuth(`${BASE_URL}/alerts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(alertData)
    });
  },
  getMaintenanceTasks: async () => {
    return fetchWithAuth(`${BASE_URL}/maintenance`);
  },
  createMaintenanceTask: async (task) => {
    return fetchWithAuth(`${BASE_URL}/maintenance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(task)
    });
  },
  updateMaintenanceTask: async (id, update) => {
    return fetchWithAuth(`${BASE_URL}/maintenance/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(update)
    });
  },
  getComplianceAudits: async () => {
    return fetchWithAuth(`${BASE_URL}/compliance`);
  },
  updateComplianceAudit: async (id, update) => {
    return fetchWithAuth(`${BASE_URL}/compliance/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(update)
    });
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
    const data = await res.json();
    if (data.success && data.token) {
      try {
        localStorage.setItem('h2_auth_token', data.token);
      } catch {}
    }
    return data;
  },
  logout: () => {
    try {
      localStorage.removeItem('h2_auth_token');
      localStorage.removeItem('h2_current_user');
    } catch {}
  }
};

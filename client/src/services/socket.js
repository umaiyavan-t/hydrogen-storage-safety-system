import { io } from 'socket.io-client';

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

const getSocketUrl = () => {
  const envSocket = normalizeUrl(import.meta.env.VITE_SOCKET_URL);
  if (envSocket) return envSocket;
  const envApi = normalizeUrl(import.meta.env.VITE_API_URL);
  if (envApi) return envApi.replace(/\/api\/?$/, '');

  if (typeof window !== 'undefined') {
    if (window.location.hostname.includes('onrender.com')) {
      return 'https://hydrogen-safety-server.onrender.com';
    }
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return `${window.location.protocol}//${window.location.hostname}:5000`;
    }
    return window.location.origin;
  }
  return 'http://localhost:5000';
};

export const socket = io(getSocketUrl(), {
  transports: ['websocket', 'polling'],
  autoConnect: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000
});

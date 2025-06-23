// services/apiCall.js

const getToken = () => {
  const sessionInfo = localStorage.getItem('session-info');
  if (!sessionInfo) return null;

  try {
    const { token } = JSON.parse(sessionInfo);
    return token;
  } catch {
    console.warn('Invalid session-info format');
    return null;
  }
};

const apiCall = async (endpoint, options = {}) => {
  const token = getToken();

  const defaultHeaders = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
  };

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...(options.headers || {}),
    },
  };

  const response = await fetch(`http://localhost:5001/api${endpoint}`, config);

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('session-info');
      window.location.href = '/login';
      return;
    }
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData?.error || `API error: ${response.status}`);
  }

  return response;
};

export default apiCall;

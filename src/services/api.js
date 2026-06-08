const BASE_URL = 'https://api.centinela-system.com';

const api = {
  async request(endpoint, options = {}) {
    const config = {
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options,
    };
    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, config);
      if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);
      return await response.json();
    } catch (error) {
      throw error;
    }
  },
  get(endpoint, headers) { return this.request(endpoint, { method: 'GET', headers }); },
  post(endpoint, body, headers) { return this.request(endpoint, { method: 'POST', body: JSON.stringify(body), headers }); },
  put(endpoint, body, headers) { return this.request(endpoint, { method: 'PUT', body: JSON.stringify(body), headers }); },
  delete(endpoint, headers) { return this.request(endpoint, { method: 'DELETE', headers }); },
};

export default api;

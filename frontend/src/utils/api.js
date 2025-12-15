import axios from 'axios';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const api = {
  // Parties
  getParties: () => axios.get(`${API_URL}/parties`, { headers: getAuthHeader() }),
  getParty: (id) => axios.get(`${API_URL}/parties/${id}`, { headers: getAuthHeader() }),
  createParty: (data) => axios.post(`${API_URL}/parties`, data, { headers: getAuthHeader() }),
  updateParty: (id, data) => axios.put(`${API_URL}/parties/${id}`, data, { headers: getAuthHeader() }),
  deleteParty: (id) => axios.delete(`${API_URL}/parties/${id}`, { headers: getAuthHeader() }),
  exportPartiesCSV: () => axios.get(`${API_URL}/parties/export/csv`, { headers: getAuthHeader(), responseType: 'blob' }),
  uploadPartiesCSV: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return axios.post(`${API_URL}/parties/upload/csv`, formData, { headers: { ...getAuthHeader(), 'Content-Type': 'multipart/form-data' } });
  },

  // Items
  getItems: (params) => axios.get(`${API_URL}/items`, { params, headers: getAuthHeader() }),
  getItem: (id) => axios.get(`${API_URL}/items/${id}`, { headers: getAuthHeader() }),
  createItem: (data) => axios.post(`${API_URL}/items`, data, { headers: getAuthHeader() }),
  updateItem: (id, data) => axios.put(`${API_URL}/items/${id}`, data, { headers: getAuthHeader() }),
  deleteItem: (id) => axios.delete(`${API_URL}/items/${id}`, { headers: getAuthHeader() }),
  exportItemsCSV: () => axios.get(`${API_URL}/items/export/csv`, { headers: getAuthHeader(), responseType: 'blob' }),
  uploadItemsCSV: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return axios.post(`${API_URL}/items/upload/csv`, formData, { headers: { ...getAuthHeader(), 'Content-Type': 'multipart/form-data' } });
  },

  // Leads
  getLeads: (params) => axios.get(`${API_URL}/leads`, { params, headers: getAuthHeader() }),
  getLead: (id) => axios.get(`${API_URL}/leads/${id}`, { headers: getAuthHeader() }),
  createLead: (data) => axios.post(`${API_URL}/leads`, data, { headers: getAuthHeader() }),
  updateLead: (id, data) => axios.put(`${API_URL}/leads/${id}`, data, { headers: getAuthHeader() }),
  deleteLead: (id) => axios.delete(`${API_URL}/leads/${id}`, { headers: getAuthHeader() }),
  convertLead: (id) => axios.post(`${API_URL}/leads/${id}/convert`, {}, { headers: getAuthHeader() }),
  downloadLeadPDF: (id) => axios.get(`${API_URL}/leads/${id}/pdf`, { headers: getAuthHeader(), responseType: 'blob' }),

  // Quotations
  getQuotations: (params) => axios.get(`${API_URL}/quotations`, { params, headers: getAuthHeader() }),
  getQuotation: (id) => axios.get(`${API_URL}/quotations/${id}`, { headers: getAuthHeader() }),
  createQuotation: (data) => axios.post(`${API_URL}/quotations`, data, { headers: getAuthHeader() }),
  updateQuotation: (id, data) => axios.put(`${API_URL}/quotations/${id}`, data, { headers: getAuthHeader() }),
  duplicateQuotation: (id) => axios.post(`${API_URL}/quotations/${id}/duplicate`, {}, { headers: getAuthHeader() }),
  convertQuotationToPI: (id) => axios.post(`${API_URL}/quotations/${id}/convert-to-pi`, {}, { headers: getAuthHeader() }),
  downloadQuotationPDF: (id) => axios.get(`${API_URL}/quotations/${id}/pdf`, { headers: getAuthHeader(), responseType: 'blob' }),

  // Proforma Invoices
  getProformaInvoices: (params) => axios.get(`${API_URL}/proforma-invoices`, { params, headers: getAuthHeader() }),
  getProformaInvoice: (id) => axios.get(`${API_URL}/proforma-invoices/${id}`, { headers: getAuthHeader() }),
  createProformaInvoice: (data) => axios.post(`${API_URL}/proforma-invoices`, data, { headers: getAuthHeader() }),
  updateProformaInvoice: (id, data) => axios.put(`${API_URL}/proforma-invoices/${id}`, data, { headers: getAuthHeader() }),
  convertPIToSOA: (id) => axios.post(`${API_URL}/proforma-invoices/${id}/convert-to-soa`, {}, { headers: getAuthHeader() }),
  downloadPIPDF: (id) => axios.get(`${API_URL}/proforma-invoices/${id}/pdf`, { headers: getAuthHeader(), responseType: 'blob' }),

  // SOA
  getSOAs: (params) => axios.get(`${API_URL}/soa`, { params, headers: getAuthHeader() }),
  getSOA: (id) => axios.get(`${API_URL}/soa/${id}`, { headers: getAuthHeader() }),
  createSOA: (data) => axios.post(`${API_URL}/soa`, data, { headers: getAuthHeader() }),
  updateSOA: (id, data) => axios.put(`${API_URL}/soa/${id}`, data, { headers: getAuthHeader() }),
  deleteSOA: (id) => axios.delete(`${API_URL}/soa/${id}`, { headers: getAuthHeader() }),
  downloadSOAPDF: (id) => axios.get(`${API_URL}/soa/${id}/pdf`, { headers: getAuthHeader(), responseType: 'blob' }),

  // Dashboard
  getDashboardStats: (params) => axios.get(`${API_URL}/dashboard/stats`, { params, headers: getAuthHeader() }),
  getRecentActivity: (params) => axios.get(`${API_URL}/dashboard/activity`, { params, headers: getAuthHeader() }),

  // Settings
  getSettings: () => axios.get(`${API_URL}/settings`, { headers: getAuthHeader() }),
  updateSettings: (data) => axios.put(`${API_URL}/settings`, data, { headers: getAuthHeader() }),

  // Reports
  getItemWiseSales: () => axios.get(`${API_URL}/reports/item-wise-sales`, { headers: getAuthHeader() }),
  getPartyWiseSales: () => axios.get(`${API_URL}/reports/party-wise-sales`, { headers: getAuthHeader() }),
  getUserWiseSales: () => axios.get(`${API_URL}/reports/user-wise-sales`, { headers: getAuthHeader() }),
  getLeadConversion: () => axios.get(`${API_URL}/reports/lead-conversion`, { headers: getAuthHeader() }),
  getPendingLeads: () => axios.get(`${API_URL}/reports/pending-leads`, { headers: getAuthHeader() }),
  getQuotationAging: () => axios.get(`${API_URL}/reports/quotation-aging`, { headers: getAuthHeader() }),
  getGSTSummary: () => axios.get(`${API_URL}/reports/gst-summary`, { headers: getAuthHeader() }),
  getDocumentLogs: () => axios.get(`${API_URL}/logs`, { headers: getAuthHeader() }),

  // Users
  getUsers: () => axios.get(`${API_URL}/users`, { headers: getAuthHeader() }),
  updateUserStatus: (userId, status) => axios.put(`${API_URL}/users/${userId}/status`, null, { params: { status }, headers: getAuthHeader() }),
};

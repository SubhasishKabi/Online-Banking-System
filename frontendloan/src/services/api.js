import axios from "axios"

const API_BASE_URL = "http://localhost:8080/api"

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const publicEndpoints = ["/auth/register", "/auth/login", "/auth/refresh"]
    const isPublicEndpoint = publicEndpoints.some((endpoint) => config.url.includes(endpoint))

    if (!isPublicEndpoint) {
      const token = localStorage.getItem("accessToken")
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// Response interceptor to handle token refresh and enhanced error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // Handle 401 errors with token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = localStorage.getItem("refreshToken")
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken: refreshToken,
          })

          const { accessToken } = response.data
          localStorage.setItem("accessToken", accessToken)

          originalRequest.headers.Authorization = `Bearer ${accessToken}`
          return api(originalRequest)
        }
      } catch (refreshError) {
        localStorage.removeItem("accessToken")
        localStorage.removeItem("refreshToken")
        localStorage.removeItem("user")
        window.location.href = "/login"
        return Promise.reject(refreshError)
      }
    }

    // Enhanced error handling with proper error structure
    const errorMessage =
      error.response?.data?.message || error.response?.data?.error || error.message || "An error occurred"
    const enhancedError = {
      ...error,
      message: errorMessage,
      status: error.response?.status,
      data: error.response?.data,
    }

    return Promise.reject(enhancedError)
  },
)

// Auth API
export const authAPI = {
  register: (data) => api.post("/auth/register", data),
  login: (data) => api.post("/auth/login", data),
  logout: () => api.post("/auth/logout"),
  me: () => api.get("/auth/me"),
  refresh: (refreshToken) => api.post("/auth/refresh", { refreshToken }),
  registerAdmin: (data) => api.post("/auth/register-admin", data),
  registerLoanOfficer: (data) => api.post("/auth/register-loan-officer", data),
}

// Account API
export const accountAPI = {
  create: (data) => api.post("/account/create", data),
  deposit: (data) => api.post("/account/deposit", data),
  withdraw: (data) => api.post("/account/withdraw", data),
  transfer: (data) => api.post("/account/transfer", data),
  getBalance: (accountNumber) => api.get(`/account/balance?accountNumber=${accountNumber}`),
  getMiniStatement: (accountNumber) => api.get(`/account/mini-statement?accountNumber=${accountNumber}`),
  getStatement: (data) => api.post("/account/statement", data),
  getAccounts: () => api.get("/account/list"),
}

// Loan API
export const loanAPI = {
  //general
  apply: (data) => api.post("/loan/apply", data),
  getMyLoans: () => api.get("/loan/my-loans"),
  getVehicleLoanDetails: (loanId) => api.get(`/vehicle-loans/${loanId}`),
  getVehicleInstallments: (loanId) => api.get(`/vehicle-loans/${loanId}/installments`),

  // Student loan APIs
  getStudentLoanDetails: (loanId) => api.get(`/student-loans/${loanId}`),
  getStudentInstallments: (loanId) => api.get(`/student-loan/${loanId}/installments`),

  // General loan APIs
  getGeneralLoanDetails: (loanId) => api.get(`/loan/${loanId}`),
  getGeneralInstallments: (loanId) => api.get(`/loan/${loanId}/installments`),
  payInstallment: (loanId, data) => api.post(`/loan/${loanId}/pay-installment`, data),
  closeLoan: (loanId) => api.post(`/loan/${loanId}/close`),
  renewLoan: (loanId, data) => api.post(`/loan/${loanId}/renew`, data),

  // Loan Officer/Admin endpoints
  getPendingLoans: (page = 0, size = 20) => api.get(`/loan/pending?page=${page}&size=${size}`),
  getAllLoans: (page = 0, size = 20, status = "") =>
    api.get(`/loan/all?page=${page}&size=${size}${status ? `&status=${status}` : ""}`),
  approveLoan: (loanId) => api.post(`/loan/${loanId}/approve`),
  rejectLoan: (loanId, data) => api.post(`/loan/${loanId}/reject`, data),
  disburseLoan: (loanId) => api.post(`/loan/${loanId}/disburse`),

  applyStudentLoan: (data) => api.post("/student-loans/apply", data),
  getMyStudentLoans: () => api.get("/student-loans/my-loans"),
  getStudentLoanDetails: (loanId) => api.get(`/student-loans/${loanId}`),
  getStudentLoanInstallments: (loanId) => api.get(`/student-loans/${loanId}/installments`),
  payStudentLoanInstallment: (loanId, data) => api.post(`/student-loans/${loanId}/pay-installment`, data),
  closeStudentLoan: (loanId) => api.post(`/student-loans/${loanId}/close`),
  renewStudentLoan: (loanId, data) => api.post(`/student-loans/${loanId}/renew`, data),

  // Student Loan Officer/Admin endpoints
  getPendingStudentLoans: (page = 0, size = 20) => api.get(`/student-loans/pending?page=${page}&size=${size}`),
  getAllStudentLoans: (page = 0, size = 20, status = "") =>
    api.get(`/student-loans/all?page=${page}&size=${size}${status ? `&status=${status}` : ""}`),
  approveStudentLoan: (loanId) => api.post(`/student-loans/${loanId}/approve`),
  rejectStudentLoan: (loanId, data) => api.post(`/student-loans/${loanId}/reject`, data),
  disburseStudentLoan: (loanId) => api.post(`/student-loans/${loanId}/disburse`),

  //vehicle loan endpoints
  applyVehicleLoan: (data) => api.post("/vehicle-loans/apply", data),
  getMyVehicleLoans: () => api.get("/vehicle-loans/my-loans"),
  // Vehicle Loan Officer/Admin endpoints
  getAllVehicleLoans: (page = 0, size = 20, status = "") =>
    api.get(`/vehicle-loans/all?page=${page}&size=${size}${status ? `&status=${status}` : ""}`),
  getVehicleLoanDetails: (loanId) => api.get(`/vehicle-loans/${loanId}`),
  getVehicleLoanInstallments: (loanId) => api.get(`/vehicle-loans/${loanId}/installments`),
  payVehicleLoanInstallment: (loanId, data) => api.post(`/vehicle-loans/${loanId}/pay-installment`, data),
  closeVehicleLoan: (loanId) => api.post(`/vehicle-loans/${loanId}/close`),
  renewVehicleLoan: (loanId, data) => api.post(`/vehicle-loans/${loanId}/renew`, data),

  getLoanStats: async () => {
    try {
      const [pendingResponse, approvedResponse, disbursedResponse, rejectedResponse] = await Promise.all([
        api.get("/loan/pending?page=0&size=1"),
        api.get("/loan/all?page=0&size=1&status=APPROVED"),
        api.get("/loan/all?page=0&size=1&status=DISBURSED"),
        api.get("/loan/all?page=0&size=1&status=REJECTED"),
      ])

      return {
        pendingLoans: pendingResponse.data?.totalElements || 0,
        approvedLoans: approvedResponse.data?.totalElements || 0,
        disbursedLoans: disbursedResponse.data?.totalElements || 0,
        rejectedLoans: rejectedResponse.data?.totalElements || 0,
        totalLoans:
          (pendingResponse.data?.totalElements || 0) +
          (approvedResponse.data?.totalElements || 0) +
          (disbursedResponse.data?.totalElements || 0) +
          (rejectedResponse.data?.totalElements || 0),
      }
    } catch (error) {
      console.error("Failed to fetch loan statistics:", error)
      return {
        pendingLoans: 0,
        approvedLoans: 0,
        disbursedLoans: 0,
        rejectedLoans: 0,
        totalLoans: 0,
      }
    }
  },
}

// Transaction API
export const transactionAPI = {
  getHistory: (page = 0, size = 20) => api.get(`/transactions/history?page=${page}&size=${size}`),
  getMiniStatement: () => api.get("/transactions/mini-statement"),
  search: (params) => api.get("/transactions/search", { params }),
  updateDescription: (id, data) => api.put(`/transactions/${id}/description`, data),
  updateCategory: (id, data) => api.put(`/transactions/${id}/category`, data),

  getTransactionById: (id) => api.get(`/transactions/${id}`),
  exportTransactions: (params) => api.get("/transactions/export", { params, responseType: "blob" }),
  getTransactionStats: () => api.get("/transactions/stats"),
}

// Dashboard API
export const dashboardAPI = {
  getCustomerSummary: () => api.get("/dashboard/customer-summary"),
  getLoanOfficerSummary: () => api.get("/dashboard/loan-officer-summary"),
  getAdminSummary: () => api.get("/dashboard/admin-summary"),
  getLoanAnalytics: () => api.get("/dashboard/loan-analytics"),
  getPortfolioSummary: () => api.get("/dashboard/portfolio-summary"),

  getSystemHealth: () => api.get("/dashboard/system-health"),
  getRecentActivity: () => api.get("/dashboard/recent-activity"),
  getMonthlyStats: () => api.get("/dashboard/monthly-stats"),
  getYearlyStats: () => api.get("/dashboard/yearly-stats"),
}

// Profile API
export const profileAPI = {
  getProfile: () => api.get("/profile"),
  updateProfile: (data) => api.put("/profile", data),
  changePassword: (data) => api.post("/profile/change-password", data),

  uploadProfilePicture: (formData) =>
    api.post("/profile/upload-picture", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  deleteAccount: () => api.delete("/profile/delete-account"),
  getSecuritySettings: () => api.get("/profile/security-settings"),
  updateSecuritySettings: (data) => api.put("/profile/security-settings", data),
}

export const reportsAPI = {
  getLoanReport: (params) => api.get("/reports/loans", { params }),
  getTransactionReport: (params) => api.get("/reports/transactions", { params }),
  getCustomerReport: (params) => api.get("/reports/customers", { params }),
  getPortfolioReport: (params) => api.get("/reports/portfolio", { params }),
  exportLoanReport: (params) => api.get("/reports/loans/export", { params, responseType: "blob" }),
  exportTransactionReport: (params) => api.get("/reports/transactions/export", { params, responseType: "blob" }),
  getComplianceReport: () => api.get("/reports/compliance"),
  getRiskAssessmentReport: () => api.get("/reports/risk-assessment"),
}

export const notificationsAPI = {
  getNotifications: (page = 0, size = 20) => api.get(`/notifications?page=${page}&size=${size}`),
  markAsRead: (notificationId) => api.put(`/notifications/${notificationId}/read`),
  markAllAsRead: () => api.put("/notifications/mark-all-read"),
  deleteNotification: (notificationId) => api.delete(`/notifications/${notificationId}`),
  getUnreadCount: () => api.get("/notifications/unread-count"),
  updatePreferences: (data) => api.put("/notifications/preferences", data),
}

export const settingsAPI = {
  getSystemSettings: () => api.get("/settings/system"),
  updateSystemSettings: (data) => api.put("/settings/system", data),
  getLoanSettings: () => api.get("/settings/loans"),
  updateLoanSettings: (data) => api.put("/settings/loans", data),
  getInterestRates: () => api.get("/settings/interest-rates"),
  updateInterestRates: (data) => api.put("/settings/interest-rates", data),
  getFeesAndCharges: () => api.get("/settings/fees-charges"),
  updateFeesAndCharges: (data) => api.put("/settings/fees-charges", data),
}

export const auditAPI = {
  getAuditLogs: (page = 0, size = 20, filters = {}) =>
    api.get(`/audit/logs?page=${page}&size=${size}`, { params: filters }),
  getUserActivity: (userId, page = 0, size = 20) => api.get(`/audit/user/${userId}?page=${page}&size=${size}`),
  getLoanActivity: (loanId) => api.get(`/audit/loan/${loanId}`),
  getSystemActivity: (hours = 24) => api.get(`/audit/system?hours=${hours}`),
  exportAuditLogs: (filters = {}) => api.get("/audit/logs/export", { params: filters, responseType: "blob" }),
}

export const customerAPI = {
  getAllCustomers: (page = 0, size = 20, search = "") =>
    api.get(`/customers?page=${page}&size=${size}&search=${search}`),
  getCustomerById: (customerId) => api.get(`/customers/${customerId}`),
  updateCustomer: (customerId, data) => api.put(`/customers/${customerId}`, data),
  deactivateCustomer: (customerId) => api.put(`/customers/${customerId}/deactivate`),
  activateCustomer: (customerId) => api.put(`/customers/${customerId}/activate`),
  getCustomerLoans: (customerId) => api.get(`/customers/${customerId}/loans`),
  getCustomerTransactions: (customerId, page = 0, size = 20) =>
    api.get(`/customers/${customerId}/transactions?page=${page}&size=${size}`),
  getCustomerAccounts: (customerId) => api.get(`/customers/${customerId}/accounts`),
  resetCustomerPassword: (customerId) => api.post(`/customers/${customerId}/reset-password`),
}

export const backupAPI = {
  createBackup: () => api.post("/backup/create"),
  getBackupHistory: () => api.get("/backup/history"),
  downloadBackup: (backupId) => api.get(`/backup/${backupId}/download`, { responseType: "blob" }),
  restoreBackup: (backupId) => api.post(`/backup/${backupId}/restore`),
  deleteBackup: (backupId) => api.delete(`/backup/${backupId}`),
  getBackupSettings: () => api.get("/backup/settings"),
  updateBackupSettings: (data) => api.put("/backup/settings", data),
}

export default api

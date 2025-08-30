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
  apply: (data) => api.post("/loan/apply", data),
  getMyLoans: () => api.get("/loan/my-loans"),
  getLoanDetails: (loanId) => api.get(`/loan/${loanId}`),
  getInstallments: (loanId) => api.get(`/loan/${loanId}/installments`),
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
}

// Dashboard API
export const dashboardAPI = {
  getCustomerSummary: () => api.get("/dashboard/customer-summary"),
  getLoanOfficerSummary: () => api.get("/dashboard/loan-officer-summary"),
  getAdminSummary: () => api.get("/dashboard/admin-summary"),
  getLoanAnalytics: () => api.get("/dashboard/loan-analytics"),
  getPortfolioSummary: () => api.get("/dashboard/portfolio-summary"),
}

// Profile API
export const profileAPI = {
  getProfile: () => api.get("/profile"),
  updateProfile: (data) => api.put("/profile", data),
  changePassword: (data) => api.post("/profile/change-password", data),
}

export default api

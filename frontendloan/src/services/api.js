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

  // Student loan APIs
  getStudentLoanDetails: (loanId) => api.get(`/student-loans/${loanId}`),
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
  getVehicleLoanDetails: (loanId) => api.get(`/vehicle-loans/${loanId}`),
  getVehicleLoanInstallments: (loanId) => api.get(`/vehicle-loans/${loanId}/installments`),

  // Vehicle Loan Officer/Admin endpoints
  getAllVehicleLoans: (page = 0, size = 20, status = "") =>
    api.get(`/vehicle-loans/all?page=${page}&size=${size}${status ? `&status=${status}` : ""}`),
  getVehicleLoanDetails: (loanId) => api.get(`/vehicle-loans/${loanId}`),
  payVehicleLoanInstallment: (loanId, data) => api.post(`/vehicle-loans/${loanId}/pay-installment`, data),
  closeVehicleLoan: (loanId) => api.post(`/vehicle-loans/${loanId}/close`),
  renewVehicleLoan: (loanId, data) => api.post(`/vehicle-loans/${loanId}/renew`, data),
  disburseVehicleLoan: (loanId) => api.post(`/vehicle-loans/${loanId}/disburse`),
  getPendingVehicleLoans: (page = 0, size = 20) =>
    api.get(`/vehicle-loans/pending?page=${page}&size=${size}`),
  approveVehicleLoan: (loanId) => api.post(`/vehicle-loans/${loanId}/approve`),
  rejectVehicleLoan: (loanId, data) => api.post(`/vehicle-loans/${loanId}/reject`, data),

  getLoanStats: async () => {
    try {
      // --- General Loans ---
      const [generalPending, generalApproved, generalActive, generalDisbursed, generalRejected] = await Promise.all([
        api.get("/loan/pending?page=0&size=1"),
        api.get("/loan/all?page=0&size=1&status=APPROVED"),
        api.get("/loan/all?page=0&size=1&status=ACTIVE"),
        api.get("/loan/all?page=0&size=1&status=DISBURSED"),
        api.get("/loan/all?page=0&size=1&status=REJECTED"),
      ]);

      // --- Student Loans ---
      const [studentPending, studentApproved, studentActive, studentDisbursed, studentRejected] = await Promise.all([
        api.get("/student-loans/pending?page=0&size=1"),
        api.get("/student-loans/all?page=0&size=1&status=APPROVED"),
        api.get("/student-loans/all?page=0&size=1&status=ACTIVE"),
        api.get("/student-loans/all?page=0&size=1&status=DISBURSED"),
        api.get("/student-loans/all?page=0&size=1&status=REJECTED"),
      ]);

      // --- Vehicle Loans ---
      const [vehiclePending, vehicleApproved, vehicleActive, vehicleDisbursed, vehicleRejected] = await Promise.all([
        api.get("/vehicle-loans/pending?page=0&size=1"),
        api.get("/vehicle-loans/all?page=0&size=1&status=APPROVED"),
        api.get("/vehicle-loans/all?page=0&size=1&status=ACTIVE"),
        api.get("/vehicle-loans/all?page=0&size=1&status=DISBURSED"),
        api.get("/vehicle-loans/all?page=0&size=1&status=REJECTED"),
      ]);

      // --- Sum totals ---
      const pendingLoans =
        (generalPending.data?.totalElements || 0) +
        (studentPending.data?.totalElements || 0) +
        (vehiclePending.data?.totalElements || 0);

      const approvedLoans =
        (generalApproved.data?.totalElements || 0) +
        (studentApproved.data?.totalElements || 0) +
        (vehicleApproved.data?.totalElements || 0);

      const activeLoans =
        (generalActive.data?.totalElements || 0) +
        (studentActive.data?.totalElements || 0) +
        (vehicleActive.data?.totalElements || 0);

      const disbursedLoans =
        (generalDisbursed.data?.totalElements || 0) +
        (studentDisbursed.data?.totalElements || 0) +
        (vehicleDisbursed.data?.totalElements || 0);

      const rejectedLoans =
        (generalRejected.data?.totalElements || 0) +
        (studentRejected.data?.totalElements || 0) +
        (vehicleRejected.data?.totalElements || 0);

      const totalLoans = pendingLoans + approvedLoans + activeLoans + disbursedLoans + rejectedLoans;

      return { pendingLoans, approvedLoans, activeLoans, disbursedLoans, rejectedLoans, totalLoans };
    } catch (error) {
      console.error("Failed to fetch loan statistics:", error);
      return { pendingLoans: 0, approvedLoans: 0, activeLoans: 0, disbursedLoans: 0, rejectedLoans: 0, totalLoans: 0 };
    }
  }

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
  // getCustomerSummary: () => api.get("/dashboard/customer-summary"),
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

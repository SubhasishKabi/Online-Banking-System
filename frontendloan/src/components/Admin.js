"use client"

import { useState, useEffect } from "react"
import { authAPI, loanAPI, dashboardAPI } from "../services/api"
import { useAuth } from "../context/AuthContext"

function Admin() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState("overview")
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [userType, setUserType] = useState("admin")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const [dashboardData, setDashboardData] = useState(null)
  const [pendingLoans, setPendingLoans] = useState([])
  const [allLoans, setAllLoans] = useState([])
  const [loanStats, setLoanStats] = useState(null)
  const [selectedLoan, setSelectedLoan] = useState(null)
  const [rejectionReason, setRejectionReason] = useState("")

  useEffect(() => {
    if (activeTab === "overview") {
      loadDashboardData()
    } else if (activeTab === "loans") {
      loadPendingLoans()
      loadLoanStats()
    }
  }, [activeTab])

  const loadDashboardData = async () => {
    try {
      const response = await dashboardAPI.getAdminSummary()
      setDashboardData(response.data)
    } catch (err) {
      console.error("Failed to load dashboard data:", err)
    }
  }

  const loadPendingLoans = async () => {
    try {
      const response = await loanAPI.getPendingLoans(0, 10)
      setPendingLoans(response.data.content || [])
    } catch (err) {
      console.error("Failed to load pending loans:", err)
    }
  }

  const loadLoanStats = async () => {
    try {
      const stats = await loanAPI.getLoanStats()
      setLoanStats(stats)
    } catch (err) {
      console.error("Failed to load loan stats:", err)
    }
  }

  const loadAllLoans = async (status = "") => {
    try {
      const response = await loanAPI.getAllLoans(0, 20, status)
      setAllLoans(response.data.content || [])
    } catch (err) {
      console.error("Failed to load loans:", err)
    }
  }

  const handleApproveLoan = async (loanId) => {
    try {
      await loanAPI.approveLoan(loanId)
      setSuccess("Loan approved successfully!")
      loadPendingLoans()
      loadLoanStats()
    } catch (err) {
      setError(err.response?.data?.message || "Failed to approve loan")
    }
  }

  const handleRejectLoan = async (loanId) => {
    if (!rejectionReason.trim()) {
      setError("Please provide a rejection reason")
      return
    }
    try {
      await loanAPI.rejectLoan(loanId, { reason: rejectionReason })
      setSuccess("Loan rejected successfully!")
      setSelectedLoan(null)
      setRejectionReason("")
      loadPendingLoans()
      loadLoanStats()
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reject loan")
    }
  }

  const handleDisburseLoan = async (loanId) => {
    try {
      await loanAPI.disburseLoan(loanId)
      setSuccess("Loan disbursed successfully!")
      loadPendingLoans()
      loadLoanStats()
    } catch (err) {
      setError(err.response?.data?.message || "Failed to disburse loan")
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    if (error) setError("")
    if (success) setSuccess("")
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      return
    }

    setLoading(true)
    try {
      setError("")

      const userData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
      }

      if (userType === "admin") {
        await authAPI.registerAdmin(userData)
        setSuccess("Admin user created successfully!")
      } else {
        await authAPI.registerLoanOfficer(userData)
        setSuccess("Loan Officer created successfully!")
      }

      setFormData({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
      })
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create user")
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "APPROVED":
      case "DISBURSED":
      case "ACTIVE":
        return "status-active"
      case "PENDING":
        return "status-pending"
      case "REJECTED":
      case "CLOSED":
        return "status-inactive"
      default:
        return "status-pending"
    }
  }

  if (user?.role !== "ADMIN") {
    return (
      <div className="container">
        <div className="card">
          <h2>Access Denied</h2>
          <p>You don't have permission to access the admin panel.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <h1>Admin Panel</h1>

      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      <div className="admin-tabs">
        <button
          className={`tab-btn ${activeTab === "overview" ? "active" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          Overview
        </button>
        <button className={`tab-btn ${activeTab === "loans" ? "active" : ""}`} onClick={() => setActiveTab("loans")}>
          Loan Management
        </button>
        <button className={`tab-btn ${activeTab === "users" ? "active" : ""}`} onClick={() => setActiveTab("users")}>
          User Management
        </button>
        <button className={`tab-btn ${activeTab === "system" ? "active" : ""}`} onClick={() => setActiveTab("system")}>
          System Info
        </button>
      </div>

      {activeTab === "overview" && (
        <div className="admin-overview">
          <h2>System Overview</h2>
          {dashboardData && (
            <div className="grid grid-3">
              <div className="card">
                <h3>Total Customers</h3>
                <p className="stat-number">{dashboardData.totalCustomers || 0}</p>
              </div>
              <div className="card">
                <h3>Total Accounts</h3>
                <p className="stat-number">{dashboardData.totalAccounts || 0}</p>
              </div>
              <div className="card">
                <h3>Total Transactions</h3>
                <p className="stat-number">{dashboardData.totalTransactions || 0}</p>
              </div>
            </div>
          )}

          {loanStats && (
            <div className="card">
              <h3>Loan Statistics</h3>
              <div className="grid grid-4">
                <div className="stat-item">
                  <span className="stat-label">Pending Loans</span>
                  <span className="stat-value status-pending">{loanStats.pendingLoans}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Approved Loans</span>
                  <span className="stat-value status-active">{loanStats.approvedLoans}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Disbursed Loans</span>
                  <span className="stat-value status-active">{loanStats.disbursedLoans}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Total Loans</span>
                  <span className="stat-value">{loanStats.totalLoans}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "loans" && (
        <div className="admin-loans">
          <h2>Loan Management</h2>

          <div className="loan-actions">
            <button onClick={() => loadAllLoans("")} className="btn btn-secondary">
              All Loans
            </button>
            <button onClick={() => loadAllLoans("PENDING")} className="btn btn-secondary">
              Pending
            </button>
            <button onClick={() => loadAllLoans("APPROVED")} className="btn btn-secondary">
              Approved
            </button>
            <button onClick={() => loadAllLoans("DISBURSED")} className="btn btn-secondary">
              Disbursed
            </button>
          </div>

          {pendingLoans.length > 0 && (
            <div className="card">
              <h3>Pending Loan Applications</h3>
              <table className="table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Interest Rate</th>
                    <th>Tenure</th>
                    <th>Applied Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingLoans.map((loan) => (
                    <tr key={loan.id}>
                      <td>{loan.customerName}</td>
                      <td>{loan.type}</td>
                      <td>${loan.principal?.toFixed(2)}</td>
                      <td>{loan.interestRate}%</td>
                      <td>{loan.tenureMonths} months</td>
                      <td>{new Date(loan.applicationDate).toLocaleDateString()}</td>
                      <td>
                        <button onClick={() => handleApproveLoan(loan.id)} className="btn btn-sm btn-primary">
                          Approve
                        </button>
                        <button onClick={() => setSelectedLoan(loan)} className="btn btn-sm btn-danger">
                          Reject
                        </button>
                        {loan.status === "APPROVED" && (
                          <button onClick={() => handleDisburseLoan(loan.id)} className="btn btn-sm btn-success">
                            Disburse
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {allLoans.length > 0 && (
            <div className="card">
              <h3>All Loans</h3>
              <table className="table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Customer</th>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Outstanding</th>
                    <th>Status</th>
                    <th>Applied Date</th>
                  </tr>
                </thead>
                <tbody>
                  {allLoans.map((loan) => (
                    <tr key={loan.id}>
                      <td>{loan.id}</td>
                      <td>{loan.customerName}</td>
                      <td>{loan.type}</td>
                      <td>${loan.principal?.toFixed(2)}</td>
                      <td>${loan.outstandingAmount?.toFixed(2)}</td>
                      <td>
                        <span className={`status ${getStatusColor(loan.status)}`}>{loan.status}</span>
                      </td>
                      <td>{new Date(loan.applicationDate).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Rejection Modal */}
          {selectedLoan && (
            <div className="modal-overlay">
              <div className="modal">
                <h3>Reject Loan Application</h3>
                <p>Customer: {selectedLoan.customerName}</p>
                <p>Loan Type: {selectedLoan.type}</p>
                <p>Amount: ${selectedLoan.principal?.toFixed(2)}</p>

                <div className="form-group">
                  <label htmlFor="rejectionReason">Rejection Reason *</label>
                  <textarea
                    id="rejectionReason"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Please provide a reason for rejection..."
                    required
                  />
                </div>

                <div className="modal-actions">
                  <button onClick={() => handleRejectLoan(selectedLoan.id)} className="btn btn-danger">
                    Reject Loan
                  </button>
                  <button
                    onClick={() => {
                      setSelectedLoan(null)
                      setRejectionReason("")
                    }}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "users" && (
        <div className="card">
          <h3>Create New User</h3>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="userType">User Type</label>
              <select id="userType" value={userType} onChange={(e) => setUserType(e.target.value)}>
                <option value="admin">Admin</option>
                <option value="loanOfficer">Loan Officer</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
              />
              <small style={{ color: "#666", fontSize: "12px" }}>
                Must contain at least 8 characters with uppercase, lowercase, digit, and special character
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Creating..." : `Create ${userType === "admin" ? "Admin" : "Loan Officer"}`}
            </button>
          </form>
        </div>
      )}

      {/* System Information Tab */}
      {activeTab === "system" && (
        <div className="card">
          <h3>System Information</h3>
          <p>
            <strong>Current User:</strong> {user?.name}
          </p>
          <p>
            <strong>Role:</strong> <span className="status status-active">{user?.role}</span>
          </p>
          <p>
            <strong>Email:</strong> {user?.email}
          </p>
        </div>
      )}
    </div>
  )
}

export default Admin

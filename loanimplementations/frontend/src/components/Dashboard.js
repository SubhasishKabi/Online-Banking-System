"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../context/AuthContext"
import { dashboardAPI, accountAPI, loanAPI } from "../services/api"

function Dashboard() {
  const { user } = useAuth()
  const [dashboardData, setDashboardData] = useState(null)
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    loadDashboardData()
    loadAccounts()
  }, [user])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      console.log("[v0] Loading dashboard data for user role:", user?.role)

      let response
      let loanStats = {}

      if (user?.role === "ADMIN") {
        console.log("[v0] Calling admin summary API")
        response = await dashboardAPI.getAdminSummary()
        console.log("[v0] Fetching loan statistics for admin")
        loanStats = await loanAPI.getLoanStats()
        console.log("[v0] Loan statistics:", loanStats)
      } else if (user?.role === "LOAN_OFFICER") {
        console.log("[v0] Calling loan officer summary API")
        response = await dashboardAPI.getLoanOfficerSummary()
        console.log("[v0] Fetching loan statistics for loan officer")
        loanStats = await loanAPI.getLoanStats()
        console.log("[v0] Loan statistics:", loanStats)
      } else {
        console.log("[v0] Calling customer summary API")
        response = await dashboardAPI.getCustomerSummary()
      }

      console.log("[v0] Dashboard API response:", response)

      const data = response?.data || response
      console.log("[v0] Extracted data:", data)

      const mappedData = {
        totalLoans: loanStats.totalLoans || (data?.totalVehicleLoans || 0) + (data?.totalStudentLoans || 0),
        totalAmount: data?.totalLoanPortfolio || data?.totalOutstandingAmount || 0,
        pendingLoans: loanStats.pendingLoans || data?.overdueLoans || 0,
        approvedLoans: loanStats.approvedLoans || 0,
        disbursedLoans: loanStats.disbursedLoans || 0,
        rejectedLoans: loanStats.rejectedLoans || 0,
        totalCustomers: data?.totalCustomers || data?.totalCustomerCount || 0,
        totalAccounts: data?.totalAccounts || 0,
        collectionEfficiency: data?.collectionEfficiency || 0,
        // Include original data for debugging
        ...data,
      }

      setDashboardData(mappedData)

      console.log("[v0] Final dashboard data set:", mappedData)
    } catch (err) {
      console.error("[v0] Failed to load dashboard data:", err)
      console.error("[v0] Error details:", {
        message: err.message,
        status: err.status,
        data: err.data,
      })
      setError(`Failed to load dashboard data: ${err.message}`)
      setDashboardData({
        pendingLoans: 0,
        totalLoans: 0,
        approvedLoans: 0,
        disbursedLoans: 0,
        rejectedLoans: 0,
        totalCustomers: 0,
        totalAmount: 0,
        error: err.message,
      })
    } finally {
      setLoading(false)
    }
  }

  const loadAccounts = async () => {
    try {
      if (user?.role === "USER" || user?.role === "ADMIN") {
        console.log("[v0] Loading accounts for user")
        const response = await accountAPI.getAccounts()
        console.log("[v0] Accounts response:", response)
        setAccounts(response.data || response || [])
      }
    } catch (err) {
      console.error("[v0] Failed to load accounts:", err)
    }
  }

  if (loading) {
    return <div className="loading">Loading dashboard...</div>
  }

  return (
    <div className="container">
      <h1>Dashboard</h1>

      {error && <div className="error">{error}</div>}

      {process.env.NODE_ENV === "development" && dashboardData?.error && (
        <div style={{ background: "#f8f9fa", padding: "10px", margin: "10px 0", border: "1px solid #dee2e6" }}>
          <strong>Debug Info:</strong> {dashboardData.error}
        </div>
      )}

      <div className="grid grid-3">
        {/* User Info Card */}
        <div className="card">
          <h3>Welcome Back!</h3>
          <p>
            <strong>Name:</strong> {user?.name}
          </p>
          <p>
            <strong>Email:</strong> {user?.email}
          </p>
          <p>
            <strong>Role:</strong> <span className="status status-active">{user?.role}</span>
          </p>
        </div>

        {/* Quick Stats */}
        {user?.role === "USER" && (
          <>
            <div className="card">
              <h3>Total Accounts</h3>
              <p style={{ fontSize: "24px", fontWeight: "bold", color: "#007bff" }}>{accounts.length}</p>
            </div>
            <div className="card">
              <h3>Total Balance</h3>
              <p style={{ fontSize: "24px", fontWeight: "bold", color: "#28a745" }}>
                ${accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0).toFixed(2)}
              </p>
            </div>
          </>
        )}

        {(user?.role === "LOAN_OFFICER" || user?.role === "ADMIN") && dashboardData && (
          <>
            <div className="card">
              <h3>Pending Loans</h3>
              <p style={{ fontSize: "24px", fontWeight: "bold", color: "#ffc107" }}>
                {dashboardData.pendingLoans || 0}
              </p>
            </div>
            <div className="card">
              <h3>Total Loans</h3>
              <p style={{ fontSize: "24px", fontWeight: "bold", color: "#007bff" }}>{dashboardData.totalLoans || 0}</p>
            </div>
            {user?.role === "ADMIN" && (
              <>
                <div className="card">
                  <h3>Approved Loans</h3>
                  <p style={{ fontSize: "24px", fontWeight: "bold", color: "#28a745" }}>
                    {dashboardData.approvedLoans || 0}
                  </p>
                </div>
                <div className="card">
                  <h3>Disbursed Loans</h3>
                  <p style={{ fontSize: "24px", fontWeight: "bold", color: "#17a2b8" }}>
                    {dashboardData.disbursedLoans || 0}
                  </p>
                </div>
                <div className="card">
                  <h3>Total Customers</h3>
                  <p style={{ fontSize: "24px", fontWeight: "bold", color: "#6f42c1" }}>
                    {dashboardData.totalCustomers || 0}
                  </p>
                </div>
                <div className="card">
                  <h3>Total Amount</h3>
                  <p style={{ fontSize: "24px", fontWeight: "bold", color: "#fd7e14" }}>
                    ₹{(dashboardData.totalAmount || 0).toLocaleString()}
                  </p>
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* Recent Accounts */}
      {accounts.length > 0 && (
        <div className="card">
          <h3>Your Accounts</h3>
          <table className="table">
            <thead>
              <tr>
                <th>Account Number</th>
                <th>Balance</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((account) => (
                <tr key={account.id}>
                  <td>{account.accountNumber}</td>
                  <td>${account.balance?.toFixed(2) || "0.00"}</td>
                  <td>
                    <span className={`status ${account.status === "ACTIVE" ? "status-active" : "status-pending"}`}>
                      {account.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Quick Actions */}
      <div className="card">
        <h3>Quick Actions</h3>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <a href="/accounts" className="btn btn-primary">
            Manage Accounts
          </a>
          <a href="/transaction-history" className="btn btn-secondary">
            View Transaction History
          </a>
          <a href="/loans" className="btn btn-success">
            Apply for Loan
          </a>
          <a href="/my-loans" className="btn btn-info">
            My Loans
          </a>
          {(user?.role === "ADMIN" || user?.role === "LOAN_OFFICER") && (
            <a href="/admin-loans" className="btn btn-primary">
              Manage Loans
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard

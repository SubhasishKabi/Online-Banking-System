"use client"

import { useState, useEffect } from "react"
import { loanAPI } from "../services/api"
import { useAuth } from "../context/AuthContext"

function LoanManagement() {
  const { user } = useAuth()
  const [pendingLoans, setPendingLoans] = useState([])
  const [allLoans, setAllLoans] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [activeTab, setActiveTab] = useState("pending")
  const [selectedLoan, setSelectedLoan] = useState(null)
  const [rejectReason, setRejectReason] = useState("")

  useEffect(() => {
    if (user?.role === "ADMIN" || user?.role === "LOAN_OFFICER") {
      loadPendingLoans()
      loadAllLoans()
    }
  }, [user])

  const loadPendingLoans = async () => {
    try {
      const response = await loanAPI.getPendingLoans()
      setPendingLoans(response.data.content || [])
    } catch (err) {
      setError("Failed to load pending loans")
    }
  }

  const loadAllLoans = async () => {
    try {
      const response = await loanAPI.getAllLoans()
      setAllLoans(response.data.content || [])
    } catch (err) {
      setError("Failed to load all loans")
    } finally {
      setLoading(false)
    }
  }

  const handleApproveLoan = async (loanId) => {
    if (window.confirm("Are you sure you want to approve this loan?")) {
      try {
        setError("")
        await loanAPI.approveLoan(loanId)
        setSuccess("Loan approved successfully!")
        loadPendingLoans()
        loadAllLoans()
      } catch (err) {
        setError(err.response?.data?.message || "Failed to approve loan")
      }
    }
  }

  const handleRejectLoan = async (loanId) => {
    if (!rejectReason.trim()) {
      setError("Please provide a reason for rejection")
      return
    }

    try {
      setError("")
      await loanAPI.rejectLoan(loanId, { reason: rejectReason })
      setSuccess("Loan rejected successfully!")
      setRejectReason("")
      setSelectedLoan(null)
      loadPendingLoans()
      loadAllLoans()
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reject loan")
    }
  }

  const handleDisburseLoan = async (loanId) => {
    if (window.confirm("Are you sure you want to disburse this loan?")) {
      try {
        setError("")
        await loanAPI.disburseLoan(loanId)
        setSuccess("Loan disbursed successfully!")
        loadPendingLoans()
        loadAllLoans()
      } catch (err) {
        setError(err.response?.data?.message || "Failed to disburse loan")
      }
    }
  }

  const openRejectModal = (loan) => {
    setSelectedLoan(loan)
    setRejectReason("")
    setError("")
  }

  if (loading) {
    return <div className="loading">Loading loan management...</div>
  }

  if (user?.role !== "ADMIN" && user?.role !== "LOAN_OFFICER") {
    return (
      <div className="container">
        <div className="card">
          <h2>Access Denied</h2>
          <p>You don't have permission to access loan management.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <h1>Loan Management</h1>

      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      {/* Tab Navigation */}
      <div style={{ marginBottom: "20px" }}>
        <button
          onClick={() => setActiveTab("pending")}
          className={`btn ${activeTab === "pending" ? "btn-primary" : "btn-secondary"}`}
          style={{ marginRight: "10px" }}
        >
          Pending Loans ({pendingLoans.length})
        </button>
        <button
          onClick={() => setActiveTab("all")}
          className={`btn ${activeTab === "all" ? "btn-primary" : "btn-secondary"}`}
        >
          All Loans ({allLoans.length})
        </button>
      </div>

      {/* Reject Modal */}
      {selectedLoan && (
        <div className="card" style={{ marginBottom: "20px", border: "2px solid #dc3545" }}>
          <h3>Reject Loan #{selectedLoan.id}</h3>
          <p>
            <strong>Customer:</strong> {selectedLoan.customerName}
          </p>
          <p>
            <strong>Type:</strong> {selectedLoan.type}
          </p>
          <p>
            <strong>Amount:</strong> ${selectedLoan.principal?.toFixed(2)}
          </p>

          <div className="form-group">
            <label htmlFor="rejectReason">Reason for Rejection</label>
            <textarea
              id="rejectReason"
              rows="3"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Please provide a detailed reason for rejection..."
              required
            />
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={() => handleRejectLoan(selectedLoan.id)}
              className="btn btn-danger"
              disabled={!rejectReason.trim()}
            >
              Confirm Rejection
            </button>
            <button onClick={() => setSelectedLoan(null)} className="btn btn-secondary">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Pending Loans Tab */}
      {activeTab === "pending" && (
        <div>
          <h2>Pending Loan Applications</h2>
          {pendingLoans.length === 0 ? (
            <div className="card">
              <p>No pending loan applications.</p>
            </div>
          ) : (
            <div className="grid grid-2">
              {pendingLoans.map((loan) => (
                <div key={loan.id} className="card">
                  <h3>
                    {loan.type} Loan #{loan.id}
                  </h3>
                  <p>
                    <strong>Customer:</strong> {loan.customerName || "N/A"}
                  </p>
                  <p>
                    <strong>Amount:</strong> ${loan.principal?.toFixed(2)}
                  </p>
                  <p>
                    <strong>Interest Rate:</strong> {loan.interestRate}%
                  </p>
                  <p>
                    <strong>Tenure:</strong> {loan.tenureMonths} months
                  </p>
                  <p>
                    <strong>Purpose:</strong> {loan.purpose || "N/A"}
                  </p>
                  <p>
                    <strong>Applied Date:</strong>{" "}
                    {loan.createdAt ? new Date(loan.createdAt).toLocaleDateString() : "N/A"}
                  </p>

                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "16px" }}>
                    <button
                      onClick={() => handleApproveLoan(loan.id)}
                      className="btn btn-success"
                      style={{ fontSize: "12px", padding: "6px 12px" }}
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => openRejectModal(loan)}
                      className="btn btn-danger"
                      style={{ fontSize: "12px", padding: "6px 12px" }}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* All Loans Tab */}
      {activeTab === "all" && (
        <div>
          <h2>All Loans</h2>
          {allLoans.length === 0 ? (
            <div className="card">
              <p>No loans found.</p>
            </div>
          ) : (
            <div className="card">
              <table className="table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Customer</th>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Interest Rate</th>
                    <th>Tenure</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {allLoans.map((loan) => (
                    <tr key={loan.id}>
                      <td>#{loan.id}</td>
                      <td>{loan.customerName || "N/A"}</td>
                      <td>{loan.type}</td>
                      <td>${loan.principal?.toFixed(2)}</td>
                      <td>{loan.interestRate}%</td>
                      <td>{loan.tenureMonths}m</td>
                      <td>
                        <span className={`status status-${loan.status?.toLowerCase()}`}>{loan.status}</span>
                      </td>
                      <td>
                        {loan.status === "APPROVED" && (
                          <button
                            onClick={() => handleDisburseLoan(loan.id)}
                            className="btn btn-primary"
                            style={{ fontSize: "11px", padding: "4px 8px" }}
                          >
                            Disburse
                          </button>
                        )}
                        {loan.status === "PENDING" && (
                          <div style={{ display: "flex", gap: "4px" }}>
                            <button
                              onClick={() => handleApproveLoan(loan.id)}
                              className="btn btn-success"
                              style={{ fontSize: "11px", padding: "4px 8px" }}
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => openRejectModal(loan)}
                              className="btn btn-danger"
                              style={{ fontSize: "11px", padding: "4px 8px" }}
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default LoanManagement

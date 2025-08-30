"use client"

import { useState, useEffect } from "react"
import { loanAPI } from "../../services/api"

const AdminLoanManagement = () => {
  const [pendingLoans, setPendingLoans] = useState([])
  const [allLoans, setAllLoans] = useState([])
  const [selectedTab, setSelectedTab] = useState("pending")
  const [selectedLoan, setSelectedLoan] = useState(null)
  const [rejectionReason, setRejectionReason] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  useEffect(() => {
    if (selectedTab === "pending") {
      fetchPendingLoans()
    } else {
      fetchAllLoans()
    }
  }, [selectedTab, currentPage])

  const fetchPendingLoans = async () => {
    try {
      setLoading(true)
      const response = await loanAPI.getPendingLoans(currentPage, 10)
      const data = response?.data || response
      setPendingLoans(Array.isArray(data?.content) ? data.content : Array.isArray(data) ? data : [])
      setTotalPages(data?.totalPages || 1)
    } catch (error) {
      console.error("Error fetching pending loans:", error)
      setMessage(`Error fetching pending loans: ${error.message}`)
      setPendingLoans([])
    } finally {
      setLoading(false)
    }
  }

  const fetchAllLoans = async () => {
    try {
      setLoading(true)
      const response = await loanAPI.getAllLoans(currentPage, 10)
      const data = response?.data || response
      setAllLoans(Array.isArray(data?.content) ? data.content : Array.isArray(data) ? data : [])
      setTotalPages(data?.totalPages || 1)
    } catch (error) {
      console.error("Error fetching all loans:", error)
      setMessage(`Error fetching all loans: ${error.message}`)
      setAllLoans([])
    } finally {
      setLoading(false)
    }
  }

  const handleApproveLoan = async (loanId) => {
    if (!window.confirm("Are you sure you want to approve this loan?")) return

    setLoading(true)
    setMessage("")

    try {
      await loanAPI.approveLoan(loanId)
      setMessage("Loan approved successfully!")
      fetchPendingLoans()
      fetchAllLoans()
    } catch (error) {
      console.error("Approve error:", error)
      setMessage(error.message || "Error approving loan")
    } finally {
      setLoading(false)
    }
  }

  const handleRejectLoan = async (loanId) => {
    if (!rejectionReason.trim()) {
      setMessage("Please provide a rejection reason")
      return
    }

    setLoading(true)
    setMessage("")

    try {
      await loanAPI.rejectLoan(loanId, {
        reason: rejectionReason.trim(),
        rejectedBy: "ADMIN", // or get from user context
      })
      setMessage("Loan rejected successfully!")
      setRejectionReason("")
      setSelectedLoan(null)
      fetchPendingLoans()
      fetchAllLoans()
    } catch (error) {
      console.error("Reject error:", error)
      setMessage(error.message || "Error rejecting loan")
    } finally {
      setLoading(false)
    }
  }

  const handleDisburseLoan = async (loanId) => {
    if (!window.confirm("Are you sure you want to disburse this loan?")) return

    setLoading(true)
    setMessage("")

    try {
      const response = await loanAPI.disburseLoan(loanId)
      setMessage("Loan disbursed successfully!")
      fetchPendingLoans()
      fetchAllLoans()
    } catch (error) {
      console.error("Disburse error:", error)
      setMessage(error.message || "Error disbursing loan")
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "approved":
        return "status-approved"
      case "pending":
        return "status-pending"
      case "rejected":
        return "status-rejected"
      case "disbursed":
        return "status-disbursed"
      case "closed":
        return "status-closed"
      default:
        return "status-default"
    }
  }

  const currentLoans = selectedTab === "pending" ? pendingLoans : allLoans

  return (
    <div className="admin-loan-management">
      <h2>Loan Management</h2>

      {loading && <div className="loading">Loading loans...</div>}

      <div className="tab-navigation">
        <button
          className={selectedTab === "pending" ? "active" : ""}
          onClick={() => setSelectedTab("pending")}
          disabled={loading}
        >
          Pending Loans ({pendingLoans.length})
        </button>
        <button
          className={selectedTab === "all" ? "active" : ""}
          onClick={() => setSelectedTab("all")}
          disabled={loading}
        >
          All Loans ({allLoans.length})
        </button>
      </div>

      {currentLoans.length === 0 && !loading ? (
        <div className="empty-state">
          <p>No loans found.</p>
        </div>
      ) : (
        <div className="loans-table-container">
          <table className="loans-table">
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
              {currentLoans.map((loan) => (
                <tr key={loan.id}>
                  <td>{loan.id}</td>
                  <td>
                    <div>
                      <div>{loan.customerName || "N/A"}</div>
                      <small>{loan.customerEmail || "N/A"}</small>
                    </div>
                  </td>
                  <td>{loan.type || "N/A"}</td>
                  <td>₹{(loan.principal || 0).toLocaleString()}</td>
                  <td>{loan.interestRate || 0}%</td>
                  <td>{loan.tenureMonths || 0} months</td>
                  <td>
                    <span className={`status ${getStatusColor(loan.status)}`}>{loan.status || "UNKNOWN"}</span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      {loan.status === "PENDING" && (
                        <>
                          <button onClick={() => handleApproveLoan(loan.id)} className="approve-btn" disabled={loading}>
                            {loading ? "Processing..." : "Approve"}
                          </button>
                          <button onClick={() => setSelectedLoan(loan)} className="reject-btn" disabled={loading}>
                            Reject
                          </button>
                        </>
                      )}
                      {loan.status === "APPROVED" && (
                        <button onClick={() => handleDisburseLoan(loan.id)} className="disburse-btn" disabled={loading}>
                          {loading ? "Processing..." : "Disburse"}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className="pagination">
              <button onClick={() => setCurrentPage((prev) => Math.max(0, prev - 1))} disabled={currentPage === 0}>
                Previous
              </button>
              <span>
                Page {currentPage + 1} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1))}
                disabled={currentPage === totalPages - 1}
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {selectedLoan && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Reject Loan Application</h3>
            <p>Loan ID: {selectedLoan.id}</p>
            <p>Customer: {selectedLoan.customerName}</p>
            <p>Amount: ₹{selectedLoan.principal}</p>

            <div className="form-group">
              <label>Rejection Reason *</label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Please provide a reason for rejection"
                rows="4"
                required
              />
            </div>

            <div className="modal-actions">
              <button
                onClick={() => handleRejectLoan(selectedLoan.id)}
                className="reject-btn"
                disabled={loading || !rejectionReason.trim()}
              >
                {loading ? "Rejecting..." : "Reject Loan"}
              </button>
              <button
                onClick={() => {
                  setSelectedLoan(null)
                  setRejectionReason("")
                }}
                className="cancel-btn"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {message && <div className={`message ${message.includes("Error") ? "error" : "success"}`}>{message}</div>}
    </div>
  )
}

export default AdminLoanManagement

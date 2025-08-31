"use client"

import { useState, useEffect } from "react"
import { loanAPI, dashboardAPI } from "../services/api"
import { useAuth } from "../context/AuthContext"

function LoanManagement() {
  const { user } = useAuth()
  const [pendingLoans, setPendingLoans] = useState([])
  const [allLoans, setAllLoans] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [activeTab, setActiveTab] = useState("dashboard")
  const [selectedLoan, setSelectedLoan] = useState(null)
  const [rejectReason, setRejectReason] = useState("")

  const [loanStats, setLoanStats] = useState(null)
  const [dashboardData, setDashboardData] = useState(null)
  const [filterStatus, setFilterStatus] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(0)
  const [pageSize] = useState(10)
  const [totalPages, setTotalPages] = useState(0)
  const [selectedLoanDetails, setSelectedLoanDetails] = useState(null)
  const [installments, setInstallments] = useState([])
  const [renewalForm, setRenewalForm] = useState({
    additionalAmount: "",
    newTenure: "",
  })

  useEffect(() => {
    if (user?.role === "ADMIN" || user?.role === "LOAN_OFFICER") {
      loadDashboardData()
      loadLoanStats()
      if (activeTab === "pending") {
        loadPendingLoans()
      } else if (activeTab === "all") {
        loadAllLoans()
      }
    }
  }, [user, activeTab, currentPage, filterStatus])

  useEffect(() => {
    if (!success && !error) return
    const timer = setTimeout(() => {
      setSuccess("")
      setError("")
    }, 3000) // 3s auto-dismiss
    return () => clearTimeout(timer)
  }, [success, error])


  const loadDashboardData = async () => {
    try {
      const response = await dashboardAPI.getLoanOfficerSummary()
      setDashboardData(response.data)
    } catch (err) {
      console.error("Failed to load dashboard data:", err)
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

  const loadPendingLoans = async () => {
    try {
      const [general, student, vehicle] = await Promise.all([
        loanAPI.getPendingLoans(currentPage, pageSize),
        loanAPI.getPendingStudentLoans(currentPage, pageSize),
        loanAPI.getPendingVehicleLoans(currentPage, pageSize),
      ])

      // Pending loans
      const mergedPendingLoans = [
        ...(general.data.content || []).map(l => ({
          ...l,
          type: "General",
          principal: l.principal ?? l.loanAmount ?? l.loan_amount, // normalize
        })),
        ...(student.data.content || []).map(l => ({
          ...l,
          type: "Student",
          principal: l.principal ?? l.loanAmount ?? l.loan_amount, // normalize
        })),
        ...(vehicle.data.content || []).map(l => ({
          ...l,
          type: "Vehicle",
          principal: l.principal ?? l.loanAmount ?? l.loan_amount, // normalize
        })),
      ]
      setPendingLoans(mergedPendingLoans)

      console.log("Pending loans loaded:", mergedPendingLoans)

      const maxPages = Math.max(
        general.data.totalPages || 0,
        student.data.totalPages || 0,
        vehicle.data.totalPages || 0
      )
      setTotalPages(maxPages)
    } catch (err) {
      console.error(err)
      setError("Failed to load pending loans")
    }
  }

  const loadAllLoans = async () => {
    setLoading(true)
    try {
      const [general, student, vehicle] = await Promise.all([
        loanAPI.getAllLoans(currentPage, pageSize, filterStatus),
        loanAPI.getAllStudentLoans(currentPage, pageSize, filterStatus),
        loanAPI.getAllVehicleLoans(currentPage, pageSize, filterStatus),
      ])

      const mergedLoans = [
        ...(general.data.content || []).map(l => ({
          ...l,
          type: "General",
          principal: l.principal ?? l.loanAmount ?? l.loan_amount, // normalize
        })),
        ...(student.data.content || []).map(l => ({
          ...l,
          type: "Student",
          principal: l.principal ?? l.loanAmount ?? l.loan_amount, // normalize
        })),
        ...(vehicle.data.content || []).map(l => ({
          ...l,
          type: "Vehicle",
          principal: l.principal ?? l.loanAmount ?? l.loan_amount, // normalize
        })),
      ]
      setAllLoans(mergedLoans)


      const maxPages = Math.max(
        general.data.totalPages || 0,
        student.data.totalPages || 0,
        vehicle.data.totalPages || 0
      )
      setTotalPages(maxPages)
    } catch (err) {
      console.error(err)
      setError("Failed to load all loans")
    } finally {
      setLoading(false)
    }
  }

  const loadLoanDetails = async (loanId, loanType) => {
    try {
      let loanResponse, installmentsResponse;

      if (loanType === "General") {
        [loanResponse, installmentsResponse] = await Promise.all([
          loanAPI.getGeneralLoanDetails(loanId),
          loanAPI.getGeneralInstallments(loanId),
        ])
      } else if (loanType === "Student") {
        [loanResponse, installmentsResponse] = await Promise.all([
          loanAPI.getStudentLoanDetails(loanId),
          loanAPI.getStudentLoanInstallments(loanId), // ✅ FIXED
        ])
      } else if (loanType === "Vehicle") {
        [loanResponse, installmentsResponse] = await Promise.all([
          loanAPI.getVehicleLoanDetails(loanId),
          loanAPI.getVehicleLoanInstallments(loanId), // ✅ FIXED
        ])
      }

      setSelectedLoanDetails({ ...loanResponse.data, type: loanType })
      setInstallments(installmentsResponse.data || [])
    } catch (err) {
      setError("Failed to load loan details")
      console.error(err)
    }
  }


  const handleApproveLoan = async (loan) => {
    if (window.confirm("Are you sure you want to approve this loan?")) {
      try {
        setError("")
        if (loan.type === "General") {
          await loanAPI.approveLoan(loan.id)
        } else if (loan.type === "Student") {
          await loanAPI.approveStudentLoan(loan.id)
        } else if (loan.type === "Vehicle") {
          await loanAPI.approveVehicleLoan(loan.id)
        }
        setSuccess("Loan approved successfully!")
        // OPTIONAL: wait for all reloads to complete before UI shows buttons
        await Promise.all([loadPendingLoans(), loadAllLoans(), loadLoanStats()])
      } catch (err) {
        console.error("Approve error:", err)
        setError(err.message || "Failed to approve loan")
      }
    }
  }

  const handleRejectLoan = async (loan) => {
    if (!rejectReason.trim()) {
      setError("Please provide a reason for rejection")
      return
    }
    try {
      setError("")
      if (loan.type === "General") {
        await loanAPI.rejectLoan(loan.id, { reason: rejectReason })
      } else if (loan.type === "Student") {
        await loanAPI.rejectStudentLoan(loan.id, { reason: rejectReason })
      } else if (loan.type === "Vehicle") {
        await loanAPI.rejectVehicleLoan(loan.id, { reason: rejectReason })
      }

      setSuccess("Loan rejected successfully!")
      setRejectReason("")
      setSelectedLoan(null)
      await Promise.all([loadPendingLoans(), loadAllLoans(), loadLoanStats()])
    } catch (err) {
      console.error("Reject error:", err)
      setError(err.message || "Failed to reject loan")
    }
  }

  const handleDisburseLoan = async (loan) => {
    if (window.confirm("Are you sure you want to disburse this loan?")) {
      try {
        setError("")
        if (loan.type === "General") {
          await loanAPI.disburseLoan(loan.id)
        } else if (loan.type === "Student") {
          await loanAPI.disburseStudentLoan(loan.id)
        } else if (loan.type === "Vehicle") {
          await loanAPI.disburseVehicleLoan(loan.id)
        }

        setSuccess("Loan disbursed successfully!")
        await Promise.all([loadPendingLoans(), loadAllLoans(), loadLoanStats()])
      } catch (err) {
        console.error("Disburse error:", err)
        setError(err.message || "Failed to disburse loan")
      }
    }
  }

  const handleRenewLoan = async (loanId) => {
    if (!renewalForm.additionalAmount || !renewalForm.newTenure) {
      setError("Please provide additional amount and new tenure")
      return
    }

    try {
      setError("")
      await loanAPI.renewLoan(loanId, {
        additionalAmount: Number.parseFloat(renewalForm.additionalAmount),
        newTenure: Number.parseInt(renewalForm.newTenure),
      })
      setSuccess("Loan renewed successfully!")
      setRenewalForm({ additionalAmount: "", newTenure: "" })
      setSelectedLoanDetails(null)
      await loadAllLoans()
    } catch (err) {
      setError(err.response?.data?.message || "Failed to renew loan")
    }
  }

  const openRejectModal = (loan) => {
    setSelectedLoan(loan)
    setRejectReason("")
    setError("")
  }

  const filteredLoans = allLoans.filter(
    (loan) =>
      !searchTerm ||
      loan.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loan.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loan.id?.toString().includes(searchTerm),
  )

  const getStatusColor = (status) => {
    switch (status) {
      case "APPROVED":
      case "ACTIVE":
        return "status-active"
      case "PENDING":
        return "status-pending"
      case "DISBURSED":

        return "status-disbursed"
      case "REJECTED":
        return "status-rejected"
      case "CLOSED":
        return "status-inactive"
      default:
        return "status-pending"
    }
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
      <div className="loan-management-tabs" style={{ marginBottom: "20px" }}>
        <button
          onClick={() => setActiveTab("dashboard")}
          className={`btn ${activeTab === "dashboard" ? "btn-primary" : "btn-secondary"}`}
          style={{ marginRight: "10px" }}
        >
          Dashboard
        </button>
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

      {activeTab === "dashboard" && (
        <div className="loan-dashboard">
          <h2>Loan Officer Dashboard</h2>

          {loanStats && (
            <div className="grid grid-4">
              <div className="card">
                <h3>Active Loans/Money Credited</h3>
                <p className="stat-number status-active">{loanStats.activeLoans}</p>
              </div>
              <div className="card">
                <h3>Approved Loans/Money not Credited</h3>
                <p className="stat-number status-approved">{loanStats.approvedLoans}</p>
              </div>
              <div className="card">
                <h3>Pending Applications</h3>
                <p className="stat-number status-pending">{loanStats.pendingLoans}</p>
              </div>

              <div className="card">
                <h3>Disbursed Loans/Partially Credited</h3>
                <p className="stat-number status-disbursed">{loanStats.disbursedLoans}</p>
              </div>
              <div className="card">
                <h3>Rejected Loans</h3>
                <p className="stat-number status-rejected">{loanStats.rejectedLoans}</p>
              </div>
              <div className="card">
                <h3>Total Loans</h3>
                <p className="stat-number">{loanStats.totalLoans}</p>
              </div>
            </div>
          )}

          {/* {dashboardData && (
            <div className="card">
              <h3>Portfolio Summary</h3>
              <div className="grid grid-3">
                <div className="stat-item">
                  <span className="stat-label">Total Portfolio Value</span>
                  <span className="stat-value">${dashboardData.totalPortfolioValue?.toFixed(2) || "0.00"}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Active Customers</span>
                  <span className="stat-value">{dashboardData.activeCustomers || 0}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Average Loan Size</span>
                  <span className="stat-value">${dashboardData.averageLoanSize?.toFixed(2) || "0.00"}</span>
                </div>
              </div>
            </div>
          )} */}
        </div>
      )}

      {/* Reject Modal */}
      {selectedLoan && (
        <div className="modal-overlay">
          <div className="modal">
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

            <div className="modal-actions">
              <button
                // FIX: pass the full loan object
                onClick={() => handleRejectLoan(selectedLoan)}
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
        </div>
      )}

      {selectedLoanDetails && (
        <div className="modal-overlay">
          <div className="modal large-modal">
            <div className="modal-header">
              <h3>Loan Details - #{selectedLoanDetails.id}</h3>
              <button onClick={() => setSelectedLoanDetails(null)} className="btn btn-secondary">
                Close
              </button>
            </div>

            <div className="grid grid-2">
              <div>
                <h4>Loan Information</h4>
                <p>
                  <strong>Customer:</strong> {selectedLoanDetails.customerName}
                </p>
                <p>
                  <strong>Type:</strong> {selectedLoanDetails.type}
                </p>
                <p>
                  <strong>Principal:</strong> ${selectedLoanDetails.principal?.toFixed(2)}
                </p>
                <p>
                  <strong>Interest Rate:</strong> {selectedLoanDetails.interestRate}%
                </p>
                <p>
                  <strong>Tenure:</strong> {selectedLoanDetails.tenureMonths} months
                </p>
                <p>
                  <strong>Monthly EMI:</strong> ${selectedLoanDetails.monthlyEmi?.toFixed(2)}
                </p>
                <p>
                  <strong>Outstanding:</strong> ${selectedLoanDetails.outstandingAmount?.toFixed(2)}
                </p>
                <p>
                  <strong>Status:</strong>
                  <span className={`status ${getStatusColor(selectedLoanDetails.status)}`}>
                    {selectedLoanDetails.status}
                  </span>
                </p>
              </div>

              {selectedLoanDetails.status === "ACTIVE" && (
                <div>
                  <h4>Loan Renewal</h4>
                  <div className="form-group">
                    <label>Additional Amount ($)</label>
                    <input
                      type="number"
                      value={renewalForm.additionalAmount}
                      onChange={(e) => setRenewalForm({ ...renewalForm, additionalAmount: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="form-group">
                    <label>New Tenure (months)</label>
                    <input
                      type="number"
                      value={renewalForm.newTenure}
                      onChange={(e) => setRenewalForm({ ...renewalForm, newTenure: e.target.value })}
                      placeholder="12"
                    />
                  </div>
                  <button onClick={() => handleRenewLoan(selectedLoanDetails.id)} className="btn btn-primary">
                    Renew Loan
                  </button>
                </div>
              )}
            </div>

            {installments.length > 0 && (
              <div className="installments-section">
                <h4>Installment History</h4>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Due Date</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Paid Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {installments.map((installment, index) => (
                      <tr key={index}>
                        <td>{new Date(installment.dueDate).toLocaleDateString()}</td>
                        <td>${installment.amount?.toFixed(2)}</td>
                        <td>
                          <span
                            className={`status ${installment.status === "PAID" ? "status-active" : "status-pending"}`}
                          >
                            {installment.status}
                          </span>
                        </td>
                        <td>{installment.paidDate ? new Date(installment.paidDate).toLocaleDateString() : "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
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
                      // FIX: pass full object
                      onClick={() => handleApproveLoan(loan)}
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
                    <button
                      onClick={() => loadLoanDetails(loan.id, loan.type)}
                      className="btn btn-primary"
                      style={{ fontSize: "12px", padding: "6px 12px" }}
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                disabled={currentPage === 0}
                className="btn btn-secondary"
              >
                Previous
              </button>
              <span>
                Page {currentPage + 1} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                disabled={currentPage >= totalPages - 1}
                className="btn btn-secondary"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {/* All Loans Tab */}
      {activeTab === "all" && (
        <div>
          <div className="loan-filters">
            <h2>All Loans</h2>

            <div className="filter-controls" style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
              <input
                type="text"
                placeholder="Search by customer name, loan type, or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ flex: 1, padding: "8px" }}
              />
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ padding: "8px" }}>
                <option value="">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="DISBURSED">Disbursed</option>
                <option value="ACTIVE">Active</option>
                <option value="CLOSED">Closed</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
          </div>

          {filteredLoans.length === 0 ? (
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
                    <th>Outstanding</th>
                    <th>Interest Rate</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLoans.map((loan) => (
                    <tr key={loan.id}>
                      <td>#{loan.id}</td>
                      <td>{loan.customerName || "N/A"}</td>
                      <td>{loan.type}</td>
                      <td>${loan.principal?.toFixed(2)}</td>
                      <td>${loan.outstandingAmount?.toFixed(2)}</td>
                      <td>{loan.interestRate}%</td>
                      <td>
                        <span className={`status ${getStatusColor(loan.status)}`}>{loan.status}</span>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                          {/* <button
                            onClick={() => loadLoanDetails(loan.id, loan.type)}
                            className="btn btn-primary"
                            style={{ fontSize: "11px", padding: "4px 8px" }}
                          >
                            Details
                          </button> */}
                          {loan.status === "APPROVED" && (
                            <button
                              // FIX: pass full object
                              onClick={() => handleDisburseLoan(loan)}
                              className="btn btn-success"
                              style={{ fontSize: "11px", padding: "4px 8px" }}
                            >
                              Disburse
                            </button>
                          )}
                          {loan.status === "PENDING" && (
                            <>
                              <button
                                // FIX: pass full object
                                onClick={() => handleApproveLoan(loan)}
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
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                disabled={currentPage === 0}
                className="btn btn-secondary"
              >
                Previous
              </button>
              <span>
                Page {currentPage + 1} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                disabled={currentPage >= totalPages - 1}
                className="btn btn-secondary"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default LoanManagement

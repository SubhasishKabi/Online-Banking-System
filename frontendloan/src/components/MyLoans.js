"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../context/AuthContext"
import { loanAPI } from "../services/api"

function MyLoans() {
  const { user } = useAuth()
  const [loans, setLoans] = useState([])
  const [selectedLoan, setSelectedLoan] = useState(null)
  const [installments, setInstallments] = useState([])
  const [paymentAmount, setPaymentAmount] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [loanFilter, setLoanFilter] = useState(null) // "General", "Student", "Vehicle"

  useEffect(() => {
    loadAllMyLoans()
  }, [])

  // Fetch general, student, and vehicle loans
  const loadAllMyLoans = async () => {
    setLoading(true)
    try {
      const [generalRes, studentRes, vehicleRes] = await Promise.all([
        loanAPI.getMyLoans(),
        loanAPI.getMyStudentLoans(),
        loanAPI.getMyVehicleLoans(),
      ])

      // Normalize and tag loan type
      const generalLoans = generalRes.data.map((loan) => ({ ...loan, loanCategory: "General" }))
      const studentLoans = studentRes.data.map((loan) => ({ ...loan, loanCategory: "Student" }))
      const vehicleLoans = vehicleRes.data.map((loan) => ({ ...loan, loanCategory: "Vehicle" }))

      // Merge into single list
      const allLoans = [...generalLoans, ...studentLoans, ...vehicleLoans]

      // Sort by creation date (most recent first if available)
      allLoans.sort((a, b) => new Date(b.createdAt || b.applicationDate) - new Date(a.createdAt || a.applicationDate))

      setLoans(allLoans)
    } catch (err) {
      console.error("Failed to load loans:", err)
      setError("Failed to load loans")
    } finally {
      setLoading(false)
    }
  }

  const loadLoanInstallments = async (loan) => {
    try {
      let response
      if (loan.loanCategory === "Student") {
        response = await loanAPI.getStudentLoanInstallments(loan.id)
      } else if (loan.loanCategory === "Vehicle") {
        response = await loanAPI.getVehicleLoanInstallments(loan.id)
      } else {
        response = await loanAPI.getInstallments(loan.id)
      }
      setInstallments(response.data)
    } catch (err) {
      console.error("Failed to load installments:", err)
      setError("Failed to load installments")
    }
  }

  const handleLoanSelect = async (loan) => {
    setSelectedLoan(loan)
    setInstallments([])
    await loadLoanInstallments(loan)
  }

  const handlePayInstallment = async (e) => {
    e.preventDefault()
    if (!selectedLoan || !paymentAmount) return

    setLoading(true)
    try {
      if (selectedLoan.loanCategory === "Student") {
        await loanAPI.payStudentLoanInstallment(selectedLoan.id, { amount: Number.parseFloat(paymentAmount) })
      } else if (selectedLoan.loanCategory === "Vehicle") {
        await loanAPI.payVehicleLoanInstallment(selectedLoan.id, { amount: Number.parseFloat(paymentAmount) })
      } else {
        await loanAPI.payInstallment(selectedLoan.id, { amount: Number.parseFloat(paymentAmount) })
      }

      setSuccess("Installment paid successfully!")
      setPaymentAmount("")
      await loadLoanInstallments(selectedLoan)
      await loadAllMyLoans()
    } catch (err) {
      console.error("Payment failed:", err)
      setError(err.response?.data?.message || "Payment failed")
    } finally {
      setLoading(false)
    }
  }

  const handleCloseLoan = async (loan) => {
    if (!window.confirm("Are you sure you want to close this loan?")) return

    setLoading(true)
    try {
      if (loan.loanCategory === "Student") {
        await loanAPI.closeStudentLoan(loan.id)
      } else if (loan.loanCategory === "Vehicle") {
        await loanAPI.closeVehicleLoan(loan.id)
      } else {
        await loanAPI.closeLoan(loan.id)
      }

      setSuccess("Loan closed successfully!")
      await loadAllMyLoans()
      setSelectedLoan(null)
      setInstallments([])
    } catch (err) {
      console.error("Failed to close loan:", err)
      setError(err.response?.data?.message || "Failed to close loan")
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "APPROVED":
      case "DISBURSED":
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

  return (
    <div className="container">
      <h1>My Loans</h1>

      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      {/* Filter Buttons */}
      <div style={{ display: "flex", justifyContent: "center", gap: "20px", marginBottom: "20px" }}>
        <button onClick={() => { setLoanFilter("General"); setSelectedLoan(null); }} className="btn btn-primary">Personal/General Loan</button>
        <button onClick={() => { setLoanFilter("Vehicle"); setSelectedLoan(null); }} className="btn btn-primary"> Vehicle Loan</button>
        <button onClick={() => { setLoanFilter("Student"); setSelectedLoan(null); }} className="btn btn-primary">Student Loan</button>
        <button onClick={() => { setLoanFilter(null); setSelectedLoan(null); }} className="btn btn-secondary"> All Loans</button>
      </div>


      <div className="grid grid-2">
        {/* Loans List */}
        <div className="card">
          <h3>Your Loans</h3>
          {loading && <p>Loading loans...</p>}
          {loans.length === 0 ? (
            <div>
              <p>No loans found.</p>
              <a href="/loan-application" className="btn btn-primary">
                Apply for Loan
              </a>
            </div>
          ) : (
            <div className="loans-list">
              {loans
                .filter((loan) => !loanFilter || loan.loanCategory === loanFilter)
                .map((loan) => (
                  <div
                    key={loan.id}
                    className={`loan-item ${selectedLoan?.id === loan.id ? "selected" : ""}`}
                    onClick={() => handleLoanSelect(loan)}
                  >
                    <div className="loan-header">
                      <h4>{loan.loanCategory} Loan</h4>
                      <span className={`status ${getStatusColor(loan.status)}`}>{loan.status}</span>
                    </div>
                    <p><strong>Amount:</strong> ${loan.principal?.toFixed(2) || loan.loanAmount?.toFixed(2)}</p>
                    <p><strong>Monthly EMI:</strong> ${loan.monthlyEmi?.toFixed(2) || "-"}</p>
                    <p><strong>Outstanding:</strong> ${loan.outstandingAmount?.toFixed(2) || "-"}</p>
                    <p><strong>Account:</strong> {loan.accountNumber || "-"}</p>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Loan Details */}
        {selectedLoan && (
          <div className="card">
            <h3>Loan Details</h3>
            <div className="loan-details">
              <p><strong>Loan ID:</strong> {selectedLoan.id}</p>
              <p><strong>Category:</strong> {selectedLoan.loanCategory}</p>
              <p><strong>Principal:</strong> ${selectedLoan.principal?.toFixed(2) || selectedLoan.loanAmount?.toFixed(2)}</p>
              <p><strong>Interest Rate:</strong> {selectedLoan.interestRate}%</p>
              <p><strong>Tenure:</strong> {selectedLoan.tenureMonths} months</p>
              <p><strong>Monthly EMI:</strong> ${selectedLoan.monthlyEmi?.toFixed(2) || "-"}</p>
              <p><strong>Outstanding:</strong> ${selectedLoan.outstandingAmount?.toFixed(2) || "-"}</p>
              {selectedLoan.emiStartDate && (
                <p><strong>EMI start date:</strong> {new Date(selectedLoan.emiStartDate).toLocaleDateString()}</p>
              )}
              <p>
                <strong>Status:</strong>
                <span className={`status ${getStatusColor(selectedLoan.status)}`}>{selectedLoan.status}</span>
              </p>
              {selectedLoan.rejectionReason && (
                <p><strong>Rejection Reason:</strong> {selectedLoan.rejectionReason}</p>
              )}
            </div>

            {/* Payment Form */}
            {selectedLoan.status === "ACTIVE" && (
              <div className="payment-section">
                <h4>Make Payment</h4>
                <form onSubmit={handlePayInstallment}>
                  <div className="form-group">
                    <label htmlFor="paymentAmount">Payment Amount ($)</label>
                    <input
                      type="number"
                      id="paymentAmount"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      min="0.01"
                      step="0.01"
                      required
                    />
                  </div>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? "Processing..." : "Pay Installment"}
                  </button>
                </form>
              </div>
            )}

            {/* Loan Actions */}
            <div className="loan-actions">
              {selectedLoan.status === "ACTIVE" && (
                <button onClick={() => handleCloseLoan(selectedLoan)} className="btn btn-danger" disabled={loading}>
                  Close Loan
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Installments */}
      {installments.length > 0 && (
        <div className="card">
          <h3>Installment History</h3>
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
                    <span className={`status ${installment.status === "PAID" ? "status-active" : "status-pending"}`}>
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
  )
}

export default MyLoans

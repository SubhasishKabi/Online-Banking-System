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

  useEffect(() => {
    loadMyLoans()
  }, [])

  const loadMyLoans = async () => {
    setLoading(true)
    try {
      const response = await loanAPI.getMyLoans()
      setLoans(response.data)
    } catch (err) {
      console.error("Failed to load loans:", err)
      setError("Failed to load loans")
    } finally {
      setLoading(false)
    }
  }

  const loadLoanInstallments = async (loanId) => {
    try {
      const response = await loanAPI.getInstallments(loanId)
      setInstallments(response.data)
    } catch (err) {
      console.error("Failed to load installments:", err)
      setError("Failed to load installments")
    }
  }

  const handleLoanSelect = async (loan) => {
    setSelectedLoan(loan)
    setInstallments([])
    await loadLoanInstallments(loan.id)
  }

  const handlePayInstallment = async (e) => {
    e.preventDefault()
    if (!selectedLoan || !paymentAmount) return

    setLoading(true)
    try {
      await loanAPI.payInstallment(selectedLoan.id, {
        amount: Number.parseFloat(paymentAmount),
      })
      setSuccess("Installment paid successfully!")
      setPaymentAmount("")
      await loadLoanInstallments(selectedLoan.id)
      await loadMyLoans()
    } catch (err) {
      console.error("Payment failed:", err)
      setError(err.response?.data?.message || "Payment failed")
    } finally {
      setLoading(false)
    }
  }

  const handleCloseLoan = async (loanId) => {
    if (!window.confirm("Are you sure you want to close this loan?")) return

    setLoading(true)
    try {
      await loanAPI.closeLoan(loanId)
      setSuccess("Loan closed successfully!")
      await loadMyLoans()
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
        return "status-active"
      case "PENDING":
        return "status-pending"
      case "REJECTED":
        return "status-inactive"
      case "DISBURSED":
        return "status-active"
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
              {loans.map((loan) => (
                <div
                  key={loan.id}
                  className={`loan-item ${selectedLoan?.id === loan.id ? "selected" : ""}`}
                  onClick={() => handleLoanSelect(loan)}
                >
                  <div className="loan-header">
                    <h4>{loan.type} Loan</h4>
                    <span className={`status ${getStatusColor(loan.status)}`}>{loan.status}</span>
                  </div>
                  <p>
                    <strong>Amount:</strong> ${loan.principal?.toFixed(2)}
                  </p>
                  <p>
                    <strong>Monthly EMI:</strong> ${loan.monthlyEmi?.toFixed(2)}
                  </p>
                  <p>
                    <strong>Outstanding:</strong> ${loan.outstandingAmount?.toFixed(2)}
                  </p>
                  <p>
                    <strong>Account:</strong> {loan.accountNumber}
                  </p>
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
              <p>
                <strong>Loan ID:</strong> {selectedLoan.id}
              </p>
              <p>
                <strong>Type:</strong> {selectedLoan.type}
              </p>
              <p>
                <strong>Principal:</strong> ${selectedLoan.principal?.toFixed(2)}
              </p>
              <p>
                <strong>Interest Rate:</strong> {selectedLoan.interestRate}%
              </p>
              <p>
                <strong>Tenure:</strong> {selectedLoan.tenureMonths} months
              </p>
              <p>
                <strong>Monthly EMI:</strong> ${selectedLoan.monthlyEmi?.toFixed(2)}
              </p>
              <p>
                <strong>Outstanding:</strong> ${selectedLoan.outstandingAmount?.toFixed(2)}
              </p>
              <p>
                <strong>Status:</strong>
                <span className={`status ${getStatusColor(selectedLoan.status)}`}>{selectedLoan.status}</span>
              </p>
              {selectedLoan.rejectionReason && (
                <p>
                  <strong>Rejection Reason:</strong> {selectedLoan.rejectionReason}
                </p>
              )}
            </div>

            {/* Payment Form */}
            {selectedLoan.status === "DISBURSED" && (
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
              {selectedLoan.status === "DISBURSED" && (
                <button onClick={() => handleCloseLoan(selectedLoan.id)} className="btn btn-danger" disabled={loading}>
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

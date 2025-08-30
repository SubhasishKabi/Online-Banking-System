"use client"

import { useState, useEffect } from "react"
import { loanAPI } from "../../services/api"

const LoanManagement = () => {
  const [loans, setLoans] = useState([])
  const [selectedLoan, setSelectedLoan] = useState(null)
  const [installments, setInstallments] = useState([])
  const [paymentAmount, setPaymentAmount] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")

  useEffect(() => {
    fetchMyLoans()
  }, [])

  const fetchMyLoans = async () => {
    try {
      const response = await loanAPI.getMyLoans()
      setLoans(response.data)
    } catch (error) {
      console.error("Error fetching loans:", error)
    }
  }

  const fetchLoanInstallments = async (loanId) => {
    try {
      const response = await loanAPI.getInstallments(loanId)
      setInstallments(response.data)
    } catch (error) {
      console.error("Error fetching installments:", error)
    }
  }

  const handleLoanSelect = (loan) => {
    setSelectedLoan(loan)
    fetchLoanInstallments(loan.id)
  }

  const handlePayInstallment = async (e) => {
    e.preventDefault()
    if (!selectedLoan || !paymentAmount) return

    const amount = Number.parseFloat(paymentAmount)
    if (isNaN(amount) || amount <= 0) {
      setMessage("Please enter a valid payment amount")
      return
    }

    if (amount > selectedLoan.outstandingAmount) {
      setMessage("Payment amount cannot exceed outstanding amount")
      return
    }

    setLoading(true)
    setMessage("")

    try {
      const response = await loanAPI.payInstallment(selectedLoan.id, {
        amount: amount,
        paymentDate: new Date().toISOString().split("T")[0], // Current date in YYYY-MM-DD format
      })

      setMessage("Installment paid successfully!")
      setPaymentAmount("")
      fetchMyLoans()
      fetchLoanInstallments(selectedLoan.id)
    } catch (error) {
      console.error("Payment error:", error)
      setMessage(error.message || "Error paying installment")
    } finally {
      setLoading(false)
    }
  }

  const handleCloseLoan = async (loanId) => {
    if (!window.confirm("Are you sure you want to close this loan? This action cannot be undone.")) return

    setLoading(true)
    setMessage("")

    try {
      await loanAPI.closeLoan(loanId)
      setMessage("Loan closed successfully!")
      fetchMyLoans()
      setSelectedLoan(null)
      setInstallments([])
    } catch (error) {
      console.error("Close loan error:", error)
      setMessage(error.message || "Error closing loan")
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

  return (
    <div className="loan-management-container">
      <h2>My Loans</h2>

      <div className="loans-grid">
        <div className="loans-list">
          <h3>Your Loans</h3>
          {loans.length === 0 ? (
            <p>No loans found.</p>
          ) : (
            loans.map((loan) => (
              <div
                key={loan.id}
                className={`loan-card ${selectedLoan?.id === loan.id ? "selected" : ""}`}
                onClick={() => handleLoanSelect(loan)}
              >
                <div className="loan-header">
                  <h4>{loan.type} Loan</h4>
                  <span className={`status ${getStatusColor(loan.status)}`}>{loan.status}</span>
                </div>
                <div className="loan-details">
                  <p>
                    <strong>Amount:</strong> ₹{loan.principal}
                  </p>
                  <p>
                    <strong>Interest Rate:</strong> {loan.interestRate}%
                  </p>
                  <p>
                    <strong>Tenure:</strong> {loan.tenureMonths} months
                  </p>
                  <p>
                    <strong>Monthly EMI:</strong> ₹{loan.monthlyEmi}
                  </p>
                  <p>
                    <strong>Outstanding:</strong> ₹{loan.outstandingAmount}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {selectedLoan && (
          <div className="loan-details-panel">
            <h3>Loan Details</h3>
            <div className="loan-info">
              <h4>
                {selectedLoan.type} Loan #{selectedLoan.id}
              </h4>
              <div className="info-grid">
                <div>
                  <strong>Principal:</strong> ₹{selectedLoan.principal}
                </div>
                <div>
                  <strong>Interest Rate:</strong> {selectedLoan.interestRate}%
                </div>
                <div>
                  <strong>Tenure:</strong> {selectedLoan.tenureMonths} months
                </div>
                <div>
                  <strong>Monthly EMI:</strong> ₹{selectedLoan.monthlyEmi}
                </div>
                <div>
                  <strong>Outstanding:</strong> ₹{selectedLoan.outstandingAmount}
                </div>
                <div>
                  <strong>Status:</strong>
                  <span className={`status ${getStatusColor(selectedLoan.status)}`}>{selectedLoan.status}</span>
                </div>
              </div>
            </div>

            {selectedLoan.status === "DISBURSED" && (
              <div className="payment-section">
                <h4>Pay Installment</h4>
                <form onSubmit={handlePayInstallment}>
                  <div className="form-group">
                    <label>Payment Amount (₹)</label>
                    <input
                      type="number"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      min="1"
                      max={selectedLoan.outstandingAmount}
                      step="0.01"
                      placeholder={`Enter amount (Max: ₹${selectedLoan.outstandingAmount})`}
                      required
                    />
                    <small>
                      Monthly EMI: ₹{selectedLoan.monthlyEmi} | Outstanding: ₹{selectedLoan.outstandingAmount}
                    </small>
                  </div>
                  <button type="submit" disabled={loading || !paymentAmount} className="pay-btn">
                    {loading ? "Processing..." : "Pay Installment"}
                  </button>
                </form>

                <button
                  onClick={() => handleCloseLoan(selectedLoan.id)}
                  className="close-loan-btn"
                  disabled={loading || selectedLoan.outstandingAmount > 0}
                  title={
                    selectedLoan.outstandingAmount > 0 ? "Clear all outstanding amount before closing" : "Close loan"
                  }
                >
                  Close Loan
                </button>
              </div>
            )}

            <div className="installments-section">
              <h4>Installment History</h4>
              {installments.length === 0 ? (
                <p>No installment history available.</p>
              ) : (
                <div className="installments-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {installments.map((installment) => (
                        <tr key={installment.id}>
                          <td>{new Date(installment.dueDate).toLocaleDateString()}</td>
                          <td>₹{installment.amount}</td>
                          <td>
                            <span className={`status ${getStatusColor(installment.status)}`}>{installment.status}</span>
                          </td>
                          <td>₹{installment.remainingBalance}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {message && <div className={`message ${message.includes("Error") ? "error" : "success"}`}>{message}</div>}
    </div>
  )
}

export default LoanManagement

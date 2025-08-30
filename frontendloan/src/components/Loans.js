"use client"

import { useState, useEffect } from "react"
import { loanAPI } from "../services/api"
import PersonalLoanApplication from "./loans/PersonalLoanApplication"
import VehicleLoanApplication from "./loans/VehicleLoanApplication"
import StudentLoanApplication from "./loans/StudentLoanApplication"

function Loans() {
  const [loans, setLoans] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [showApplicationForm, setShowApplicationForm] = useState(false)
  const [selectedLoanType, setSelectedLoanType] = useState("")
  const [selectedLoan, setSelectedLoan] = useState(null)
  const [installments, setInstallments] = useState([])

  const [paymentForm, setPaymentForm] = useState({
    amount: "",
  })

  useEffect(() => {
    loadLoans()
  }, [])

  const loadLoans = async () => {
    try {
      const response = await loanAPI.getMyLoans()
      setLoans(response.data)
    } catch (err) {
      setError("Failed to load loans")
    } finally {
      setLoading(false)
    }
  }

  const loadInstallments = async (loanId) => {
    try {
      const response = await loanAPI.getInstallments(loanId)
      setInstallments(response.data)
    } catch (err) {
      setError("Failed to load installments")
    }
  }

  const handlePayInstallment = async (loanId) => {
    try {
      setError("")
      await loanAPI.payInstallment(loanId, {
        amount: Number.parseFloat(paymentForm.amount),
      })
      setSuccess("Installment paid successfully!")
      setPaymentForm({ amount: "" })
      loadLoans()
      if (selectedLoan?.id === loanId) {
        loadInstallments(loanId)
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to pay installment")
    }
  }

  const handleCloseLoan = async (loanId) => {
    if (window.confirm("Are you sure you want to close this loan?")) {
      try {
        setError("")
        await loanAPI.closeLoan(loanId)
        setSuccess("Loan closed successfully!")
        loadLoans()
      } catch (err) {
        setError(err.response?.data?.message || "Failed to close loan")
      }
    }
  }

  const viewLoanDetails = async (loan) => {
    setSelectedLoan(loan)
    await loadInstallments(loan.id)
  }

  const handleLoanTypeSelection = (type) => {
    setSelectedLoanType(type)
    setShowApplicationForm(true)
  }

  const closeApplicationForm = () => {
    setShowApplicationForm(false)
    setSelectedLoanType("")
    loadLoans() // Refresh loans after application
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

  if (loading) {
    return <div className="loading">Loading loans...</div>
  }

  return (
    <div className="container">
      {/* <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h1>My Loans</h1>
        {!showApplicationForm && (
          <div className="loan-type-buttons">
            <button onClick={() => handleLoanTypeSelection("PERSONAL")} className="btn btn-primary">
              Personal Loan
            </button>
            <button onClick={() => handleLoanTypeSelection("VEHICLE")} className="btn btn-primary">
              Vehicle Loan
            </button>
            <button onClick={() => handleLoanTypeSelection("STUDENT")} className="btn btn-primary">
              Student Loan
            </button>
          </div>
        )}
      </div> */}

      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      {showApplicationForm && (
        <div className="loan-application-wrapper">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h2>Apply for {selectedLoanType} Loan</h2>
            <button onClick={closeApplicationForm} className="btn btn-secondary">
              Back to Loans
            </button>
          </div>

          {selectedLoanType === "PERSONAL" && <PersonalLoanApplication onComplete={closeApplicationForm} />}
          {selectedLoanType === "VEHICLE" && <VehicleLoanApplication onComplete={closeApplicationForm} />}
          {selectedLoanType === "STUDENT" && <StudentLoanApplication onComplete={closeApplicationForm} />}
        </div>
      )}

      {/* Loan Details Modal */}
      {selectedLoan && !showApplicationForm && (
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3>Loan Details - #{selectedLoan.id}</h3>
            <button onClick={() => setSelectedLoan(null)} className="btn btn-secondary">
              Close
            </button>
          </div>

          <div className="grid grid-2">
            <div>
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

            {selectedLoan.status === "DISBURSED" && (
              <div>
                <h4>Pay Installment</h4>
                <div className="form-group">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Amount"
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({ amount: e.target.value })}
                  />
                </div>
                <button
                  onClick={() => handlePayInstallment(selectedLoan.id)}
                  className="btn btn-success"
                  disabled={!paymentForm.amount}
                >
                  Pay Installment
                </button>
              </div>
            )}
          </div>

          {/* Installments */}
          {installments.length > 0 && (
            <div style={{ marginTop: "20px" }}>
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
      )}

      {/* Loans List */}
      {!showApplicationForm && (
        <div className="grid grid-2">
          {loans.map((loan) => (
            <div key={loan.id} className="card">
              <h3>{loan.type} Loan</h3>
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
                <strong>Monthly EMI:</strong> ${loan.monthlyEmi?.toFixed(2)}
              </p>
              <p>
                <strong>Outstanding:</strong> ${loan.outstandingAmount?.toFixed(2)}
              </p>
              <p>
                <strong>Status:</strong>
                <span className={`status ${getStatusColor(loan.status)}`}>{loan.status}</span>
              </p>

              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "16px" }}>
                <button
                  onClick={() => viewLoanDetails(loan)}
                  className="btn btn-primary"
                  style={{ fontSize: "12px", padding: "6px 12px" }}
                >
                  View Details
                </button>

                {loan.status === "DISBURSED" && (
                  <button
                    onClick={() => handleCloseLoan(loan.id)}
                    className="btn btn-danger"
                    style={{ fontSize: "12px", padding: "6px 12px" }}
                  >
                    Close Loan
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {loans.length === 0 && !showApplicationForm && (
        <div className="card">
          <p>No loans found. Apply for your first loan to get started!</p>
        </div>
      )}
    </div>
  )
}

export default Loans

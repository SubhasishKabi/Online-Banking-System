"use client"

import { useState, useEffect } from "react"
import { loanAPI } from "../services/api"

function Loans() {
  const [loans, setLoans] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [showApplicationForm, setShowApplicationForm] = useState(false)
  const [selectedLoan, setSelectedLoan] = useState(null)
  const [installments, setInstallments] = useState([])

  const [applicationForm, setApplicationForm] = useState({
    type: "PERSONAL",
    principal: "",
    interestRate: "",
    tenureMonths: "",
    purpose: "",
  })

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

  const handleApplicationSubmit = async (e) => {
    e.preventDefault()
    try {
      setError("")
      await loanAPI.apply({
        ...applicationForm,
        principal: Number.parseFloat(applicationForm.principal),
        interestRate: Number.parseFloat(applicationForm.interestRate),
        tenureMonths: Number.parseInt(applicationForm.tenureMonths),
      })
      setSuccess("Loan application submitted successfully!")
      setShowApplicationForm(false)
      setApplicationForm({
        type: "PERSONAL",
        principal: "",
        interestRate: "",
        tenureMonths: "",
        purpose: "",
      })
      loadLoans()
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit loan application")
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

  if (loading) {
    return <div className="loading">Loading loans...</div>
  }

  return (
    <div className="container">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h1>My Loans</h1>
        <button onClick={() => setShowApplicationForm(true)} className="btn btn-primary">
          Apply for Loan
        </button>
      </div>

      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      {/* Loan Application Form */}
      {showApplicationForm && (
        <div className="card">
          <h3>Apply for Loan</h3>
          <form onSubmit={handleApplicationSubmit}>
            <div className="form-group">
              <label htmlFor="type">Loan Type</label>
              <select
                id="type"
                value={applicationForm.type}
                onChange={(e) => setApplicationForm({ ...applicationForm, type: e.target.value })}
              >
                <option value="PERSONAL">Personal</option>
                <option value="HOME">Home</option>
                <option value="CAR">Car</option>
                <option value="EDUCATION">Education</option>
                <option value="BUSINESS">Business</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="principal">Loan Amount</label>
              <input
                type="number"
                id="principal"
                step="0.01"
                min="1000"
                value={applicationForm.principal}
                onChange={(e) => setApplicationForm({ ...applicationForm, principal: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="interestRate">Interest Rate (%)</label>
              <input
                type="number"
                id="interestRate"
                step="0.01"
                min="1"
                max="30"
                value={applicationForm.interestRate}
                onChange={(e) => setApplicationForm({ ...applicationForm, interestRate: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="tenureMonths">Tenure (Months)</label>
              <input
                type="number"
                id="tenureMonths"
                min="6"
                max="360"
                value={applicationForm.tenureMonths}
                onChange={(e) => setApplicationForm({ ...applicationForm, tenureMonths: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="purpose">Purpose</label>
              <textarea
                id="purpose"
                rows="3"
                value={applicationForm.purpose}
                onChange={(e) => setApplicationForm({ ...applicationForm, purpose: e.target.value })}
                required
              />
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <button type="submit" className="btn btn-primary">
                Submit Application
              </button>
              <button type="button" onClick={() => setShowApplicationForm(false)} className="btn btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Loan Details Modal */}
      {selectedLoan && (
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
                <strong>Status:</strong>
                <span className={`status status-${selectedLoan.status?.toLowerCase()}`}>{selectedLoan.status}</span>
              </p>
            </div>

            {selectedLoan.status === "APPROVED" && (
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
              <h4>Installments</h4>
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
                      <td>{installment.dueDate}</td>
                      <td>${installment.amount?.toFixed(2)}</td>
                      <td>
                        <span className={`status status-${installment.status?.toLowerCase()}`}>
                          {installment.status}
                        </span>
                      </td>
                      <td>{installment.paidDate || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Loans List */}
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
              <strong>Status:</strong>
              <span className={`status status-${loan.status?.toLowerCase()}`}>{loan.status}</span>
            </p>

            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "16px" }}>
              <button
                onClick={() => viewLoanDetails(loan)}
                className="btn btn-primary"
                style={{ fontSize: "12px", padding: "6px 12px" }}
              >
                View Details
              </button>

              {loan.status === "APPROVED" && (
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

      {loans.length === 0 && (
        <div className="card">
          <p>No loans found. Apply for your first loan to get started!</p>
        </div>
      )}
    </div>
  )
}

export default Loans

"use client"

import { useState, useEffect } from "react"
import { loanAPI } from "../services/api"

function Loans() {
  const [loans, setLoans] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [selectedLoan, setSelectedLoan] = useState(null)
  const [installments, setInstallments] = useState([])
  const [paymentForm, setPaymentForm] = useState({ amount: "" })

  useEffect(() => {
    loadLoans()
  }, [])

  // Load all loans
  const loadLoans = async () => {
    setLoading(true)
    setError("")
    try {
      const [generalLoansRes, studentLoansRes, vehicleLoansRes] = await Promise.all([
        loanAPI.getMyLoans(),
        loanAPI.getMyStudentLoans(),
        loanAPI.getMyVehicleLoans(),
      ])

      const combinedLoans = [
        ...(generalLoansRes.data || []).map((loan) => ({
          ...loan,
          type: "General",
          principal: loan.principal ?? loan.loanAmount, // normalize
        })),
        ...(studentLoansRes.data || []).map((loan) => ({
          ...loan,
          type: "Student",
          principal: loan.principal ?? loan.loanAmount, // normalize
        })),
        ...(vehicleLoansRes.data || []).map((loan) => ({
          ...loan,
          type: "Vehicle",
          principal: loan.principal ?? loan.loanAmount, // normalize
        })),
      ]


      combinedLoans.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      setLoans(combinedLoans)
    } catch (err) {
      setError("Failed to load loans")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Load installments for a loan
  const loadInstallments = async (loan) => {
    setError("") // clear previous error
    try {
      let response
      if (loan.type === "General") {
        response = await loanAPI.getGeneralInstallments(loan.id)
      } else if (loan.type === "Student") {
        response = await loanAPI.getStudentInstallments(loan.id)
      } else if (loan.type === "Vehicle") {
        response = await loanAPI.getVehicleLoanInstallments(loan.id)
      } else {
        throw new Error("Unknown loan type")
      }
      setInstallments(response.data || [])
    } catch (err) {
      setInstallments([]) // clear on error
      setError(err.response?.data?.message || "Failed to load installments")
    }
  }

  // View loan details
  const viewLoanDetails = async (loan) => {
    setSelectedLoan(loan)
    await loadInstallments(loan)
  }

  // Pay installment
  const handlePayInstallment = async (loan) => {
    if (!paymentForm.amount) return
    setError("")
    try {
      await loanAPI.payInstallment(loan.id, { amount: parseFloat(paymentForm.amount) })
      setSuccess("Installment paid successfully!")
      setPaymentForm({ amount: "" })
      await loadLoans()
      await loadInstallments(loan)
    } catch (err) {
      setError(err.response?.data?.message || "Failed to pay installment")
    }
  }

  // Close loan
  const handleCloseLoan = async (loan) => {
    if (!window.confirm("Are you sure you want to close this loan?")) return
    setError("")
    try {
      await loanAPI.closeLoan(loan.id)
      setSuccess("Loan closed successfully!")
      await loadLoans()
      setSelectedLoan(null)
    } catch (err) {
      setError(err.response?.data?.message || "Failed to close loan")
    }
  }

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

  if (loading) return <div className="loading">Loading loans...</div>

  return (
    <div className="container">
      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

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
              <p><strong>Type:</strong> {selectedLoan.type}</p>
              <p><strong>Principal:</strong> ${selectedLoan.principal?.toFixed(2)}</p>
              <p><strong>Interest Rate:</strong> {selectedLoan.interestRate}%</p>
              <p><strong>Tenure:</strong> {selectedLoan.tenureMonths} months</p>
              <p><strong>Monthly EMI:</strong> ${selectedLoan.monthlyEmi?.toFixed(2)}</p>
              <p><strong>Outstanding:</strong> ${selectedLoan.outstandingAmount?.toFixed(2)}</p>
              <p>
                <strong>Status:</strong>{" "}
                <span className={`status ${getStatusColor(selectedLoan.status)}`}>{selectedLoan.status}</span>
              </p>
              {selectedLoan.rejectionReason && (
                <p><strong>Rejection Reason:</strong> {selectedLoan.rejectionReason}</p>
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
                  onClick={() => handlePayInstallment(selectedLoan)}
                  className="btn btn-success"
                  disabled={!paymentForm.amount}
                >
                  Pay Installment
                </button>
              </div>
            )}
          </div>

          {/* Installments */}
          {installments.length > 0 ? (
            <table className="min-w-full bg-white shadow rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-gray-200 text-gray-700 text-left text-sm font-medium">
                  <th className="px-4 py-2">#</th>
                  <th className="px-4 py-2">Due Date</th>
                  <th className="px-4 py-2">Amount</th>
                  <th className="px-4 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {installments.map((inst, idx) => (
                  <tr key={idx} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-2">{idx + 1}</td>
                    <td className="px-4 py-2">{inst.dueDate}</td>
                    <td className="px-4 py-2">₹{inst.amount}</td>
                    <td className="px-4 py-2">{inst.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center text-gray-500 p-4 border rounded bg-gray-50">
              📭 No installments available yet
            </div>
          )}

        </div>
      )}

      {/* Loans List */}
      <div className="grid grid-2">
        {loans.map((loan) => (
          <div key={loan.id} className="card">
            <h3>{loan.type} Loan</h3>
            <p><strong>Amount:</strong> ${loan.principal?.toFixed(2)}</p>
            <p><strong>Interest Rate:</strong> {loan.interestRate}%</p>
            <p><strong>Tenure:</strong> {loan.tenureMonths} months</p>
            <p><strong>Monthly EMI:</strong> ${loan.monthlyEmi?.toFixed(2)}</p>
            <p><strong>Outstanding:</strong> ${loan.outstandingAmount?.toFixed(2)}</p>
            <p>
              <strong>Status:</strong>{" "}
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
                  onClick={() => handleCloseLoan(loan)}
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

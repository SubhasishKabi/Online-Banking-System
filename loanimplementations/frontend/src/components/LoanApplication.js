"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../context/AuthContext"
import { loanAPI, accountAPI } from "../services/api"

function LoanApplication() {
  const { user } = useAuth()
  const [accounts, setAccounts] = useState([])
  const [formData, setFormData] = useState({
    accountId: "",
    principal: "",
    type: "PERSONAL",
    interestRate: "12.5",
    tenureMonths: "12",
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState("")
  const [error, setError] = useState("")

  const loanTypes = [
    { value: "PERSONAL", label: "Personal Loan", defaultRate: "12.5", maxTenure: 60 },
    { value: "EDUCATION", label: "Education Loan", defaultRate: "8.5", maxTenure: 120 },
    { value: "STUDENT", label: "Student Loan", defaultRate: "6.5", maxTenure: 180 },
  ]

  useEffect(() => {
    loadAccounts()
  }, [])

  const loadAccounts = async () => {
    try {
      const response = await accountAPI.getAccounts()
      setAccounts(response.data.filter((acc) => acc.status === "ACTIVE"))
    } catch (err) {
      console.error("Failed to load accounts:", err)
      setError("Failed to load accounts")
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => {
      const updated = { ...prev, [name]: value }

      if (name === "type") {
        const selectedType = loanTypes.find((type) => type.value === value)
        updated.interestRate = selectedType?.defaultRate || "12.5"
      }

      return updated
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const applicationData = {
        accountId: Number.parseInt(formData.accountId),
        principal: Number.parseFloat(formData.principal),
        type: formData.type,
        interestRate: Number.parseFloat(formData.interestRate),
        tenureMonths: Number.parseInt(formData.tenureMonths),
      }

      await loanAPI.apply(applicationData)
      setSuccess("Loan application submitted successfully!")
      setFormData({
        accountId: "",
        principal: "",
        type: "PERSONAL",
        interestRate: "12.5",
        tenureMonths: "12",
      })
    } catch (err) {
      console.error("Loan application failed:", err)
      setError(err.response?.data?.message || "Failed to submit loan application")
    } finally {
      setLoading(false)
    }
  }

  const selectedLoanType = loanTypes.find((type) => type.value === formData.type)

  return (
    <div className="container">
      <h1>Apply for Loan</h1>

      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      {accounts.length === 0 ? (
        <div className="card">
          <p>You need to have at least one active account to apply for a loan.</p>
          <a href="/accounts" className="btn btn-primary">
            Create Account
          </a>
        </div>
      ) : (
        <div className="card">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="accountId">Select Account *</label>
              <select id="accountId" name="accountId" value={formData.accountId} onChange={handleInputChange} required>
                <option value="">Choose an account</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.accountNumber} - Balance: ${account.balance?.toFixed(2)}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="type">Loan Type *</label>
              <select id="type" name="type" value={formData.type} onChange={handleInputChange} required>
                {loanTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              <small className="form-text">
                {selectedLoanType?.label} - Default Rate: {selectedLoanType?.defaultRate}% - Max Tenure:{" "}
                {selectedLoanType?.maxTenure} months
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="principal">Loan Amount ($) *</label>
              <input
                type="number"
                id="principal"
                name="principal"
                value={formData.principal}
                onChange={handleInputChange}
                min="100"
                max="1000000"
                step="0.01"
                required
              />
              <small className="form-text">Minimum: $100, Maximum: $1,000,000</small>
            </div>

            <div className="form-group">
              <label htmlFor="interestRate">Interest Rate (%) *</label>
              <input
                type="number"
                id="interestRate"
                name="interestRate"
                value={formData.interestRate}
                onChange={handleInputChange}
                min="1"
                max="30"
                step="0.01"
                required
              />
              <small className="form-text">Annual interest rate (1% - 30%)</small>
            </div>

            <div className="form-group">
              <label htmlFor="tenureMonths">Tenure (Months) *</label>
              <input
                type="number"
                id="tenureMonths"
                name="tenureMonths"
                value={formData.tenureMonths}
                onChange={handleInputChange}
                min="1"
                max={selectedLoanType?.maxTenure || 360}
                required
              />
              <small className="form-text">
                Minimum: 1 month, Maximum: {selectedLoanType?.maxTenure || 360} months for {selectedLoanType?.label}
              </small>
            </div>

            {formData.principal && formData.interestRate && formData.tenureMonths && (
              <div className="loan-calculation">
                <h4>Loan Calculation Preview</h4>
                <p>
                  <strong>Monthly EMI:</strong> $
                  {calculateEMI(formData.principal, formData.interestRate, formData.tenureMonths)}
                </p>
                <p>
                  <strong>Total Amount:</strong> $
                  {(
                    calculateEMI(formData.principal, formData.interestRate, formData.tenureMonths) *
                    formData.tenureMonths
                  ).toFixed(2)}
                </p>
                <p>
                  <strong>Total Interest:</strong> $
                  {(
                    calculateEMI(formData.principal, formData.interestRate, formData.tenureMonths) *
                    formData.tenureMonths -
                    formData.principal
                  ).toFixed(2)}
                </p>
              </div>
            )}

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Submitting..." : "Submit Application"}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}

function calculateEMI(principal, rate, tenure) {
  const P = Number.parseFloat(principal)
  const r = Number.parseFloat(rate) / 100 / 12 // Monthly interest rate
  const n = Number.parseInt(tenure)

  if (r === 0) return (P / n).toFixed(2)

  const emi = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)
  return emi.toFixed(2)
}

export default LoanApplication

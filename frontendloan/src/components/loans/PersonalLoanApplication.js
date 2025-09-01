"use client"

import { useState, useEffect } from "react"
import { accountAPI, loanAPI } from "../../services/api"

const PersonalLoanApplication = () => {
  const [accounts, setAccounts] = useState([])
  const [formData, setFormData] = useState({
    accountId: "",
    principal: "",
    type: "PERSONAL",
    interestRate: "12.0",
    tenureMonths: "36",
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")

  useEffect(() => {
    fetchAccounts()
  }, [])

  const fetchAccounts = async () => {
    try {
      const response = await accountAPI.getAccounts()
      // Adjust if your API returns nested data
      setAccounts(response.data)
      console.log("Accounts fetched:", response.data)
    } catch (error) {
      console.error("Error fetching accounts:", error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage("")

    try {
      const applicationData = {
        accountId: Number.parseInt(formData.accountId),
        principal: Number.parseFloat(formData.principal),
        type: formData.type,
        interestRate: Number.parseFloat(formData.interestRate),
        tenureMonths: Number.parseInt(formData.tenureMonths),
      }

      await loanAPI.apply(applicationData)
      setMessage("Personal loan application submitted successfully!")
      setFormData({
        accountId: "",
        principal: "",
        type: "PERSONAL",
        interestRate: "12.0",
        tenureMonths: "36",
      })
    } catch (error) {
      setMessage(error.response?.data?.message || "Error submitting application")
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const calculateEMI = () => {
    const { principal, interestRate, tenureMonths } = formData
    if (principal && interestRate && tenureMonths) {
      const P = Number.parseFloat(principal)
      const r = Number.parseFloat(interestRate) / 100 / 12
      const n = Number.parseInt(tenureMonths)
      const emi = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)
      return emi.toFixed(2)
    }
    return "0.00"
  }

  return (
    <div className="loan-application-container">
      <div className="loan-application-card">
        <h2>Personal Loan Application</h2>
        <p className="loan-description">
          Quick personal loan for your immediate financial needs. Flexible tenure options available.
        </p>

        <form onSubmit={handleSubmit} className="loan-form">
          <div className="form-group">
            <label htmlFor="accountId">Select Account *</label>
            <select
              id="accountId"
              name="accountId"
              value={formData.accountId}
              onChange={handleChange}
              required
            >
              <option value="">Choose an account</option>
              {accounts.length === 0 ? (
                <option value="">Loading accounts...</option>
              ) : (
                accounts.map((account) => (
                  <option key={account.id} value={account.id.toString()}>
                    {account.accountNumber} - Balance: ₹{account.balance?.toFixed(2)}
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="principal">Loan Amount (₹) *</label>
            <input
              type="number"
              id="principal"
              name="principal"
              value={formData.principal}
              onChange={handleChange}
              min="1000"
              max="2000000"
              step="0.01"
              required
              placeholder="Enter loan amount"
            />
          </div>

          <div className="form-group">
            <label htmlFor="interestRate">Interest Rate (% per annum) *</label>
            <input
              type="number"
              id="interestRate"
              name="interestRate"
              value={formData.interestRate}
              onChange={handleChange}
              min="8"
              max="30"
              step="0.01"
              required
              placeholder="12.0"
            />
          </div>

          <div className="form-group">
            <label htmlFor="tenureMonths">Tenure (Months) *</label>
            <select
              id="tenureMonths"
              name="tenureMonths"
              value={formData.tenureMonths}
              onChange={handleChange}
              required
            >
              <option value="6">6 Months</option>
              <option value="12">1 Year (12 months)</option>
              <option value="18">18 Months</option>
              <option value="24">2 Years (24 months)</option>
              <option value="36">3 Years (36 months)</option>
              <option value="48">4 Years (48 months)</option>
              <option value="60">5 Years (60 months)</option>
            </select>
          </div>

          {formData.principal && formData.interestRate && formData.tenureMonths && (
            <div className="emi-calculator">
              <h4>Estimated Monthly EMI: ₹{calculateEMI()}</h4>
            </div>
          )}

          <button type="submit" disabled={loading} className="submit-btn">
            {loading ? "Submitting..." : "Apply for Personal Loan"}
          </button>
        </form>

        {message && (
          <div className={`message ${message.includes("Error") ? "error" : "success"}`}>
            {message}
          </div>
        )}
      </div>
    </div>
  )
}

export default PersonalLoanApplication

"use client"

import { useState, useEffect } from "react"
import { accountAPI, loanAPI } from "../../services/api"

const EducationLoanApplication = () => {
  const [accounts, setAccounts] = useState([])
  const [formData, setFormData] = useState({
    accountId: "",
    principal: "",
    type: "EDUCATION",
    interestRate: "8.5",
    tenureMonths: "60",
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")

  useEffect(() => {
    fetchAccounts()
  }, [])

  const fetchAccounts = async () => {
    try {
      const response = await accountAPI.getAccounts()
      setAccounts(response.data)
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
      setMessage("Education loan application submitted successfully!")
      setFormData({
        accountId: "",
        principal: "",
        type: "EDUCATION",
        interestRate: "8.5",
        tenureMonths: "60",
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
        <h2>Education Loan Application</h2>
        <p className="loan-description">
          Apply for an education loan to fund your academic pursuits. Competitive interest rates starting from 8.5%.
        </p>

        <form onSubmit={handleSubmit} className="loan-form">
          <div className="form-group">
            <label htmlFor="accountId">Select Account *</label>
            <select id="accountId" name="accountId" value={formData.accountId} onChange={handleChange} required>
              <option value="">Choose an account</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.accountNumber} - Balance: ₹{account.balance}
                </option>
              ))}
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
              max="10000000"
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
              min="1"
              max="25"
              step="0.01"
              required
              placeholder="8.5"
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
              <option value="12">1 Year (12 months)</option>
              <option value="24">2 Years (24 months)</option>
              <option value="36">3 Years (36 months)</option>
              <option value="48">4 Years (48 months)</option>
              <option value="60">5 Years (60 months)</option>
              <option value="84">7 Years (84 months)</option>
              <option value="120">10 Years (120 months)</option>
              <option value="180">15 Years (180 months)</option>
              <option value="240">20 Years (240 months)</option>
            </select>
          </div>

          {formData.principal && formData.interestRate && formData.tenureMonths && (
            <div className="emi-calculator">
              <h4>Estimated Monthly EMI: ₹{calculateEMI()}</h4>
            </div>
          )}

          <button type="submit" disabled={loading} className="submit-btn">
            {loading ? "Submitting..." : "Apply for Education Loan"}
          </button>
        </form>

        {message && <div className={`message ${message.includes("Error") ? "error" : "success"}`}>{message}</div>}
      </div>
    </div>
  )
}

export default EducationLoanApplication

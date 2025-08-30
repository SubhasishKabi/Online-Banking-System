"use client"

import { useState, useEffect } from "react"
import { accountAPI, loanAPI } from "../../services/api"

const VehicleLoanApplication = () => {
  const [accounts, setAccounts] = useState([])
  const [formData, setFormData] = useState({
    accountId: "",
    loanAmount: "",
    interestRate: "9.5",
    tenureMonths: "60",
    vehicleType: "CAR",
    vehicleMake: "",
    vehicleModel: "",
    vehicleYear: "",
    vehiclePrice: "",
    downPayment: "",
    monthlyIncome: "",
    employmentType: "SALARIED",
    incomeProof: "",
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
        loanAmount: Number.parseFloat(formData.loanAmount),
        interestRate: Number.parseFloat(formData.interestRate),
        tenureMonths: Number.parseInt(formData.tenureMonths),
        vehicleType: formData.vehicleType,
        vehicleMake: formData.vehicleMake,
        vehicleModel: formData.vehicleModel,
        vehicleYear: Number.parseInt(formData.vehicleYear),
        vehiclePrice: Number.parseFloat(formData.vehiclePrice),
        downPayment: Number.parseFloat(formData.downPayment),
        monthlyIncome: Number.parseFloat(formData.monthlyIncome),
        employmentType: formData.employmentType,
        incomeProof: formData.incomeProof,
      }

      await loanAPI.applyVehicleLoan(applicationData) // <-- call vehicle loan API
      setMessage("Vehicle loan application submitted successfully!")
      setFormData({
        accountId: "",
        loanAmount: "",
        interestRate: "9.5",
        tenureMonths: "60",
        vehicleType: "CAR",
        vehicleMake: "",
        vehicleModel: "",
        vehicleYear: "",
        vehiclePrice: "",
        downPayment: "",
        monthlyIncome: "",
        employmentType: "SALARIED",
        incomeProof: "",
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
    const { loanAmount, interestRate, tenureMonths } = formData
    if (loanAmount && interestRate && tenureMonths) {
      const P = Number.parseFloat(loanAmount)
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
        <h2>Vehicle Loan Application</h2>
        <p className="loan-description">
          Apply for a vehicle loan to purchase your dream car, bike, or truck. Attractive interest rates starting at 9.5%.
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
            <label htmlFor="loanAmount">Loan Amount (₹) *</label>
            <input
              type="number"
              id="loanAmount"
              name="loanAmount"
              value={formData.loanAmount}
              onChange={handleChange}
              min="10000"
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
              placeholder="9.5"
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
              <option value="12">1 Year</option>
              <option value="24">2 Years</option>
              <option value="36">3 Years</option>
              <option value="48">4 Years</option>
              <option value="60">5 Years</option>
              <option value="84">7 Years</option>
              <option value="120">10 Years</option>
            </select>
          </div>

          {/* Vehicle details */}
          <div className="form-group">
            <label>Vehicle Type *</label>
            <select name="vehicleType" value={formData.vehicleType} onChange={handleChange} required>
              <option value="CAR">Car</option>
              <option value="BIKE">Bike</option>
              <option value="TRUCK">Truck</option>
            </select>
          </div>

          <div className="form-group">
            <label>Vehicle Make *</label>
            <input type="text" name="vehicleMake" value={formData.vehicleMake} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label>Vehicle Model *</label>
            <input type="text" name="vehicleModel" value={formData.vehicleModel} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label>Vehicle Year *</label>
            <input type="number" name="vehicleYear" value={formData.vehicleYear} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label>Vehicle Price (₹) *</label>
            <input type="number" name="vehiclePrice" value={formData.vehiclePrice} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label>Down Payment (₹) *</label>
            <input type="number" name="downPayment" value={formData.downPayment} onChange={handleChange} required />
          </div>

          {/* Financial info */}
          <div className="form-group">
            <label>Monthly Income (₹) *</label>
            <input type="number" name="monthlyIncome" value={formData.monthlyIncome} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label>Employment Type *</label>
            <select name="employmentType" value={formData.employmentType} onChange={handleChange} required>
              <option value="SALARIED">Salaried</option>
              <option value="SELF_EMPLOYED">Self Employed</option>
              <option value="BUSINESS">Business</option>
            </select>
          </div>

          <div className="form-group">
            <label>Income Proof *</label>
            <input type="text" name="incomeProof" value={formData.incomeProof} onChange={handleChange} required />
          </div>

          {formData.loanAmount && (
            <div className="emi-calculator">
              <h4>Estimated Monthly EMI: ₹{calculateEMI()}</h4>
            </div>
          )}

          <button type="submit" disabled={loading} className="submit-btn">
            {loading ? "Submitting..." : "Apply for Vehicle Loan"}
          </button>
        </form>

        {message && <div className={`message ${message.includes("Error") ? "error" : "success"}`}>{message}</div>}
      </div>
    </div>
  )
}

export default VehicleLoanApplication

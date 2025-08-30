"use client"

import { useState, useEffect } from "react"
import { accountAPI, loanAPI } from "../../services/api"

const StudentLoanApplication = ({ onComplete }) => {
  const [accounts, setAccounts] = useState([])
  const [formData, setFormData] = useState({
    accountId: "",
    loanAmount: "",
    interestRate: "7.5",
    tenureMonths: "48",
    courseName: "",
    institutionName: "",
    courseDurationYears: "4",
    courseFee: "",
    academicYear: "",
    studentName: "",
    studentAge: "",
    guardianName: "",
    guardianIncome: "",
    collateralProvided: false,
    collateralDetails: "",
    moratoriumPeriodMonths: "6",
    disbursementType: "LUMP_SUM",
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [currentStep, setCurrentStep] = useState(1)
  const totalSteps = 4

  useEffect(() => {
    fetchAccounts()
  }, [])

  const fetchAccounts = async () => {
    try {
      const response = await accountAPI.getAccounts()
      setAccounts(response.data.filter((acc) => acc.status === "ACTIVE"))
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
        courseName: formData.courseName,
        institutionName: formData.institutionName,
        courseDurationYears: Number.parseInt(formData.courseDurationYears),
        courseFee: Number.parseFloat(formData.courseFee),
        academicYear: formData.academicYear,
        studentName: formData.studentName,
        studentAge: Number.parseInt(formData.studentAge),
        guardianName: formData.guardianName,
        guardianIncome: Number.parseFloat(formData.guardianIncome),
        collateralProvided: formData.collateralProvided,
        collateralDetails: formData.collateralDetails,
        moratoriumPeriodMonths: Number.parseInt(formData.moratoriumPeriodMonths),
        disbursementType: formData.disbursementType,
      }

      // Try student loan specific endpoint first, fallback to general loan API
      try {
        await loanAPI.applyStudentLoan(applicationData)
      } catch (err) {
        // Fallback to general loan application
        await loanAPI.apply({
          accountId: applicationData.accountId,
          principal: applicationData.loanAmount,
          type: "STUDENT",
          interestRate: applicationData.interestRate,
          tenureMonths: applicationData.tenureMonths,
        })
      }

      setMessage("Student loan application submitted successfully!")

      // Reset form
      setFormData({
        accountId: "",
        loanAmount: "",
        interestRate: "7.5",
        tenureMonths: "48",
        courseName: "",
        institutionName: "",
        courseDurationYears: "4",
        courseFee: "",
        academicYear: "",
        studentName: "",
        studentAge: "",
        guardianName: "",
        guardianIncome: "",
        collateralProvided: false,
        collateralDetails: "",
        moratoriumPeriodMonths: "6",
        disbursementType: "LUMP_SUM",
      })
      setCurrentStep(1)

      // Call completion callback if provided
      if (onComplete) {
        setTimeout(() => onComplete(), 2000)
      }
    } catch (error) {
      setMessage(error.response?.data?.message || "Error submitting application")
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    })
  }

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const calculateEMI = () => {
    const { loanAmount, interestRate, tenureMonths } = formData
    if (loanAmount && interestRate && tenureMonths) {
      const P = Number.parseFloat(loanAmount)
      const r = Number.parseFloat(interestRate) / 100 / 12
      const n = Number.parseInt(tenureMonths)
      if (r === 0) return (P / n).toFixed(2)
      const emi = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)
      return emi.toFixed(2)
    }
    return "0.00"
  }

  const calculateTotalAmount = () => {
    const emi = Number.parseFloat(calculateEMI())
    const tenure = Number.parseInt(formData.tenureMonths)
    return (emi * tenure).toFixed(2)
  }

  const isStepValid = (step) => {
    switch (step) {
      case 1:
        return formData.accountId && formData.loanAmount && formData.interestRate && formData.tenureMonths
      case 2:
        return (
          formData.courseName &&
          formData.institutionName &&
          formData.courseDurationYears &&
          formData.courseFee &&
          formData.academicYear
        )
      case 3:
        return formData.studentName && formData.studentAge && formData.guardianName && formData.guardianIncome
      case 4:
        return true // Optional step
      default:
        return false
    }
  }

  return (
    <div className="loan-application-container">
      <div className="loan-application-card">
        <h2>Student Loan Application</h2>
        <p className="loan-description">
          Comprehensive student loan with flexible disbursement options and moratorium period. Starting from 7.5%
          interest rate.
        </p>

        <div className="step-indicator">
          <div className="steps">
            {[1, 2, 3, 4].map((step) => (
              <div
                key={step}
                className={`step ${currentStep >= step ? "active" : ""} ${currentStep > step ? "completed" : ""}`}
              >
                <span className="step-number">{step}</span>
                <span className="step-label">
                  {step === 1 && "Loan Details"}
                  {step === 2 && "Course Information"}
                  {step === 3 && "Student & Guardian"}
                  {step === 4 && "Additional Details"}
                </span>
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="loan-form">
          {/* Step 1: Basic Loan Details */}
          {currentStep === 1 && (
            <div className="form-step">
              <h3>Step 1: Loan Details</h3>

              <div className="form-group">
                <label htmlFor="accountId">Select Account *</label>
                <select id="accountId" name="accountId" value={formData.accountId} onChange={handleChange} required>
                  <option value="">Choose an account</option>
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.accountNumber} - Balance: ${account.balance?.toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="loanAmount">Loan Amount ($) *</label>
                <input
                  type="number"
                  id="loanAmount"
                  name="loanAmount"
                  value={formData.loanAmount}
                  onChange={handleChange}
                  min="1000"
                  max="5000000"
                  step="0.01"
                  required
                  placeholder="Enter loan amount"
                />
                <small>Minimum: $1,000, Maximum: $5,000,000</small>
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
                  max="20"
                  step="0.01"
                  required
                  placeholder="7.5"
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
                </select>
              </div>

              {formData.loanAmount && formData.interestRate && formData.tenureMonths && (
                <div className="emi-calculator">
                  <h4>Loan Summary</h4>
                  <p>
                    <strong>Monthly EMI:</strong> ${calculateEMI()}
                  </p>
                  <p>
                    <strong>Total Amount:</strong> ${calculateTotalAmount()}
                  </p>
                  <p>
                    <strong>Total Interest:</strong> $
                    {(Number.parseFloat(calculateTotalAmount()) - Number.parseFloat(formData.loanAmount)).toFixed(2)}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Course Information */}
          {currentStep === 2 && (
            <div className="form-step">
              <h3>Step 2: Course Information</h3>

              <div className="form-group">
                <label htmlFor="courseName">Course Name *</label>
                <input
                  type="text"
                  id="courseName"
                  name="courseName"
                  value={formData.courseName}
                  onChange={handleChange}
                  required
                  placeholder="e.g., Bachelor of Computer Science"
                />
              </div>

              <div className="form-group">
                <label htmlFor="institutionName">Institution Name *</label>
                <input
                  type="text"
                  id="institutionName"
                  name="institutionName"
                  value={formData.institutionName}
                  onChange={handleChange}
                  required
                  placeholder="e.g., University of Technology"
                />
              </div>

              <div className="form-group">
                <label htmlFor="courseDurationYears">Course Duration (Years) *</label>
                <select
                  id="courseDurationYears"
                  name="courseDurationYears"
                  value={formData.courseDurationYears}
                  onChange={handleChange}
                  required
                >
                  <option value="1">1 Year</option>
                  <option value="2">2 Years</option>
                  <option value="3">3 Years</option>
                  <option value="4">4 Years</option>
                  <option value="5">5 Years</option>
                  <option value="6">6 Years</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="courseFee">Total Course Fee ($) *</label>
                <input
                  type="number"
                  id="courseFee"
                  name="courseFee"
                  value={formData.courseFee}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  required
                  placeholder="Enter total course fee"
                />
              </div>

              <div className="form-group">
                <label htmlFor="academicYear">Academic Year *</label>
                <input
                  type="text"
                  id="academicYear"
                  name="academicYear"
                  value={formData.academicYear}
                  onChange={handleChange}
                  required
                  placeholder="e.g., 2024-2025"
                />
              </div>
            </div>
          )}

          {/* Step 3: Student & Guardian Information */}
          {currentStep === 3 && (
            <div className="form-step">
              <h3>Step 3: Student & Guardian Information</h3>

              <div className="form-group">
                <label htmlFor="studentName">Student Name *</label>
                <input
                  type="text"
                  id="studentName"
                  name="studentName"
                  value={formData.studentName}
                  onChange={handleChange}
                  required
                  placeholder="Full name of the student"
                />
              </div>

              <div className="form-group">
                <label htmlFor="studentAge">Student Age *</label>
                <input
                  type="number"
                  id="studentAge"
                  name="studentAge"
                  value={formData.studentAge}
                  onChange={handleChange}
                  min="16"
                  max="35"
                  required
                  placeholder="Age in years"
                />
              </div>

              <div className="form-group">
                <label htmlFor="guardianName">Guardian/Parent Name *</label>
                <input
                  type="text"
                  id="guardianName"
                  name="guardianName"
                  value={formData.guardianName}
                  onChange={handleChange}
                  required
                  placeholder="Full name of guardian/parent"
                />
              </div>

              <div className="form-group">
                <label htmlFor="guardianIncome">Guardian Annual Income ($) *</label>
                <input
                  type="number"
                  id="guardianIncome"
                  name="guardianIncome"
                  value={formData.guardianIncome}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  required
                  placeholder="Annual income of guardian"
                />
              </div>
            </div>
          )}

          {/* Step 4: Additional Details */}
          {currentStep === 4 && (
            <div className="form-step">
              <h3>Step 4: Additional Details</h3>

              <div className="form-group">
                <label htmlFor="disbursementType">Disbursement Type</label>
                <select
                  id="disbursementType"
                  name="disbursementType"
                  value={formData.disbursementType}
                  onChange={handleChange}
                >
                  <option value="LUMP_SUM">Lump Sum (Full amount at once)</option>
                  <option value="SEMESTER_WISE">Semester-wise disbursement</option>
                  <option value="YEARLY">Yearly disbursement</option>
                </select>
                <small>Choose how you want to receive the loan amount</small>
              </div>

              <div className="form-group">
                <label htmlFor="moratoriumPeriodMonths">Moratorium Period (Months)</label>
                <select
                  id="moratoriumPeriodMonths"
                  name="moratoriumPeriodMonths"
                  value={formData.moratoriumPeriodMonths}
                  onChange={handleChange}
                >
                  <option value="0">No moratorium</option>
                  <option value="6">6 months</option>
                  <option value="12">12 months</option>
                  <option value="18">18 months</option>
                  <option value="24">24 months</option>
                </select>
                <small>Grace period before EMI starts after course completion</small>
              </div>

              <div className="form-group">
                <div className="checkbox-group">
                  <input
                    type="checkbox"
                    id="collateralProvided"
                    name="collateralProvided"
                    checked={formData.collateralProvided}
                    onChange={handleChange}
                  />
                  <label htmlFor="collateralProvided">I am providing collateral security</label>
                </div>
              </div>

              {formData.collateralProvided && (
                <div className="form-group">
                  <label htmlFor="collateralDetails">Collateral Details</label>
                  <textarea
                    id="collateralDetails"
                    name="collateralDetails"
                    value={formData.collateralDetails}
                    onChange={handleChange}
                    rows="3"
                    placeholder="Describe the collateral being provided (property, investments, etc.)"
                  />
                </div>
              )}

              {/* Final Summary */}
              <div className="application-summary">
                <h4>Application Summary</h4>
                <div className="summary-grid">
                  <div>
                    <strong>Loan Amount:</strong> ${Number.parseFloat(formData.loanAmount || 0).toFixed(2)}
                  </div>
                  <div>
                    <strong>Course:</strong> {formData.courseName}
                  </div>
                  <div>
                    <strong>Institution:</strong> {formData.institutionName}
                  </div>
                  <div>
                    <strong>Student:</strong> {formData.studentName}
                  </div>
                  <div>
                    <strong>Monthly EMI:</strong> ${calculateEMI()}
                  </div>
                  <div>
                    <strong>Disbursement:</strong> {formData.disbursementType.replace("_", " ")}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="form-navigation">
            {currentStep > 1 && (
              <button type="button" onClick={prevStep} className="btn btn-secondary">
                Previous
              </button>
            )}

            {currentStep < totalSteps ? (
              <button type="button" onClick={nextStep} className="btn btn-primary" disabled={!isStepValid(currentStep)}>
                Next
              </button>
            ) : (
              <button type="submit" disabled={loading || !isStepValid(currentStep)} className="submit-btn">
                {loading ? "Submitting..." : "Submit Application"}
              </button>
            )}
          </div>
        </form>

        {message && <div className={`message ${message.includes("Error") ? "error" : "success"}`}>{message}</div>}
      </div>
    </div>
  )
}

export default StudentLoanApplication

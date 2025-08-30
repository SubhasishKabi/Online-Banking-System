"use client"

import { useState } from "react"
import PersonalLoanApplication from "./loans/PersonalLoanApplication"
import VehicleLoanApplication from "./loans/VehicleLoanApplication"
import StudentLoanApplication from "./loans/StudentLoanApplication"

function LoanApplication() {
  const [selectedLoanType, setSelectedLoanType] = useState(null)

  const handleLoanTypeSelection = (type) => {
    setSelectedLoanType(type)
  }

  const closeApplicationForm = () => {
    setSelectedLoanType(null)
  }

  return (
    <div className="container">
      <div style={{ marginBottom: "20px", textAlign: "center" }}>
        <h1>Apply for Loan</h1>

        {!selectedLoanType && (
          <div
            className="loan-type-buttons"
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "20px", // spacing between buttons
              marginTop: "20px",
            }}
          >
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
      </div>

      {selectedLoanType && (
        <div className="loan-application-wrapper">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h2>Apply for {selectedLoanType} Loan</h2>
            <button onClick={closeApplicationForm} className="btn btn-secondary">
              Back to Loan Types
            </button>
          </div>

          {selectedLoanType === "PERSONAL" && <PersonalLoanApplication onComplete={closeApplicationForm} />}
          {selectedLoanType === "VEHICLE" && <VehicleLoanApplication onComplete={closeApplicationForm} />}
          {selectedLoanType === "STUDENT" && <StudentLoanApplication onComplete={closeApplicationForm} />}
        </div>
      )}
    </div>
  )
}

export default LoanApplication

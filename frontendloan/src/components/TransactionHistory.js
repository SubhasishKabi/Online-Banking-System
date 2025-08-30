"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../context/AuthContext"
import { accountAPI } from "../services/api"

function TransactionHistory() {
  const { user } = useAuth()
  const [accounts, setAccounts] = useState([])
  const [selectedAccount, setSelectedAccount] = useState("")
  const [transactions, setTransactions] = useState([])
  const [miniStatement, setMiniStatement] = useState([])
  const [statementData, setStatementData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [statementForm, setStatementForm] = useState({
    fromDate: "",
    toDate: "",
    csv: false,
  })

  useEffect(() => {
    loadAccounts()
  }, [])

  const loadAccounts = async () => {
    try {
      const response = await accountAPI.getAccounts()
      setAccounts(response.data)
      if (response.data.length > 0) {
        setSelectedAccount(response.data[0].accountNumber)
      }
    } catch (err) {
      console.error("Failed to load accounts:", err)
      setError("Failed to load accounts")
    }
  }

  const loadMiniStatement = async () => {
    if (!selectedAccount) return

    setLoading(true)
    try {
      const response = await accountAPI.getMiniStatement(selectedAccount)
      setMiniStatement(response.data.last5 || [])
    } catch (err) {
      console.error("Failed to load mini statement:", err)
      setError("Failed to load transaction history")
    } finally {
      setLoading(false)
    }
  }

  const generateStatement = async (e) => {
    e.preventDefault()
    if (!selectedAccount) return

    setLoading(true)
    try {
      const requestData = {
        accountNumber: selectedAccount,
        fromDate: statementForm.fromDate,
        toDate: statementForm.toDate,
        csv: statementForm.csv,
      }

      const response = await accountAPI.getStatement(requestData)
      setStatementData(response.data)
    } catch (err) {
      console.error("Failed to generate statement:", err)
      setError("Failed to generate statement")
    } finally {
      setLoading(false)
    }
  }

  const handleAccountChange = (e) => {
    setSelectedAccount(e.target.value)
    setMiniStatement([])
    setStatementData(null)
  }

  const handleStatementFormChange = (e) => {
    const { name, value, type, checked } = e.target
    setStatementForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))
  }

  return (
    <div className="container">
      <h1>Transaction History</h1>

      {error && <div className="error">{error}</div>}

      {accounts.length === 0 ? (
        <div className="card">
          <p>No accounts found. Create an account first.</p>
          <a href="/accounts" className="btn btn-primary">
            Create Account
          </a>
        </div>
      ) : (
        <>
          {/* Account Selection */}
          <div className="card">
            <h3>Select Account</h3>
            <div className="form-group">
              <select value={selectedAccount} onChange={handleAccountChange}>
                <option value="">Choose an account</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.accountNumber}>
                    {account.accountNumber} - Balance: ${account.balance?.toFixed(2)}
                  </option>
                ))}
              </select>
              <button onClick={loadMiniStatement} className="btn btn-primary" disabled={!selectedAccount || loading}>
                {loading ? "Loading..." : "Load Recent Transactions"}
              </button>
            </div>
          </div>

          {/* Mini Statement */}
          {miniStatement.length > 0 && (
            <div className="card">
              <h3>Recent Transactions (Last 5)</h3>
              <table className="table">
                <thead>
                  <tr>
                    <th>Date & Time</th>
                    <th>Type</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {miniStatement.map((txn, index) => (
                    <tr key={index}>
                      <td>{new Date(txn.occurredAt).toLocaleString()}</td>
                      <td>
                        <span
                          className={`status ${txn.type === "DEPOSIT"
                              ? "status-active"
                              : txn.type === "WITHDRAWAL"
                                ? "status-pending"
                                : "status-inactive"
                            }`}
                        >
                          {txn.type}
                        </span>
                      </td>
                      <td className={txn.type === "DEPOSIT" ? "text-success" : "text-danger"}>
                        {txn.type === "DEPOSIT" ? "+" : "-"}${Math.abs(txn.amount).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Statement Generation */}
          <div className="card">
            <h3>Generate Statement</h3>
            <form onSubmit={generateStatement}>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="fromDate">From Date</label>
                  <input
                    type="date"
                    id="fromDate"
                    name="fromDate"
                    value={statementForm.fromDate}
                    onChange={handleStatementFormChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="toDate">To Date</label>
                  <input
                    type="date"
                    id="toDate"
                    name="toDate"
                    value={statementForm.toDate}
                    onChange={handleStatementFormChange}
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label>
                  <input type="checkbox" name="csv" checked={statementForm.csv} onChange={handleStatementFormChange} />
                  Generate as CSV format
                </label>
              </div>
              <button type="submit" className="btn btn-primary" disabled={!selectedAccount || loading}>
                {loading ? "Generating..." : "Generate Statement"}
              </button>
            </form>
          </div>

          {/* Statement Results */}
          {statementData && (
            <div className="card">
              <h3>Account Statement</h3>
              <div className="statement-header">
                <p>
                  <strong>Account:</strong> {statementData.accountNumber}
                </p>
                <p>
                  <strong>Period:</strong> {statementData.fromDate} to {statementData.toDate}
                </p>
                <p>
                  <strong>Opening Balance:</strong> ${statementData.openingBalance?.toFixed(2)}
                </p>
                <p>
                  <strong>Closing Balance:</strong> ${statementData.closingBalance?.toFixed(2)}
                </p>
              </div>

              {statementData.lines && statementData.lines.length > 0 ? (
                <table className="table">
                  <thead>
                    <tr>
                      <th>Date & Time</th>
                      <th>Type</th>
                      <th>Amount</th>
                      <th>Reference Account</th>
                    </tr>
                  </thead>
                  <tbody>
                    {statementData.lines.map((line, index) => (
                      <tr key={index}>
                        <td>{new Date(line.occurredAt).toLocaleString()}</td>
                        <td>
                          <span
                            className={`status ${line.type === "DEPOSIT"
                                ? "status-active"
                                : line.type === "WITHDRAWAL"
                                  ? "status-pending"
                                  : "status-inactive"
                              }`}
                          >
                            {line.type}
                          </span>
                        </td>
                        <td className={line.amount > 0 ? "text-success" : "text-danger"}>
                          {line.amount > 0 ? "+" : ""}${line.amount?.toFixed(2)}
                        </td>
                        <td>{line.refAccount || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>No transactions found for the selected period.</p>
              )}

              {statementData.payload && (
                <div className="statement-payload">
                  <h4>Formatted Statement</h4>
                  <pre style={{ whiteSpace: "pre-wrap", fontSize: "12px" }}>{statementData.payload}</pre>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default TransactionHistory

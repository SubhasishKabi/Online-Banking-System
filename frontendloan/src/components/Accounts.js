"use client"

import { useState, useEffect } from "react"
import { accountAPI } from "../services/api"

function Accounts() {
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showTransactionForm, setShowTransactionForm] = useState(false)
  const [transactionType, setTransactionType] = useState("")
  const [selectedAccount, setSelectedAccount] = useState("")

  const [createForm, setCreateForm] = useState({
    accountType: "SAVINGS",
  })

  const [transactionForm, setTransactionForm] = useState({
    accountNumber: "",
    amount: "",
    toAccount: "",
  })

  useEffect(() => {
    loadAccounts()
  }, [])

  const loadAccounts = async () => {
    try {
      const response = await accountAPI.getAccounts()
      setAccounts(response.data)
    } catch (err) {
      setError("Failed to load accounts")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAccount = async (e) => {
    e.preventDefault()
    try {
      setError("")
      await accountAPI.create(createForm)
      setSuccess("Account created successfully!")
      setShowCreateForm(false)
      setCreateForm({ accountType: "SAVINGS" })
      loadAccounts()
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create account")
    }
  }

  const handleTransaction = async (e) => {
    e.preventDefault()
    try {
      setError("")

      if (transactionType === "deposit") {
        await accountAPI.deposit({
          accountNumber: transactionForm.accountNumber,
          amount: Number.parseFloat(transactionForm.amount),
        })
      } else if (transactionType === "withdraw") {
        await accountAPI.withdraw({
          accountNumber: transactionForm.accountNumber,
          amount: Number.parseFloat(transactionForm.amount),
        })
      } else if (transactionType === "transfer") {
        await accountAPI.transfer({
          fromAccount: transactionForm.accountNumber,
          toAccount: transactionForm.toAccount,
          amount: Number.parseFloat(transactionForm.amount),
        })
      }

      setSuccess(`${transactionType.charAt(0).toUpperCase() + transactionType.slice(1)} completed successfully!`)
      setShowTransactionForm(false)
      setTransactionForm({ accountNumber: "", amount: "", toAccount: "" })
      loadAccounts()
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${transactionType}`)
    }
  }

  const openTransactionForm = (type, accountNumber = "") => {
    setTransactionType(type)
    setTransactionForm((prev) => ({ ...prev, accountNumber }))
    setShowTransactionForm(true)
    setError("")
    setSuccess("")
  }

  if (loading) {
    return <div className="loading">Loading accounts...</div>
  }

  return (
    <div className="container">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h1>My Accounts</h1>
        <button onClick={() => setShowCreateForm(true)} className="btn btn-primary">
          Create New Account
        </button>
      </div>

      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      {/* Create Account Form */}
      {showCreateForm && (
        <div className="card">
          <h3>Create New Account</h3>
          <form onSubmit={handleCreateAccount}>
            <div className="form-group">
              <label htmlFor="accountType">Account Type</label>
              <select
                id="accountType"
                value={createForm.accountType}
                onChange={(e) => setCreateForm({ ...createForm, accountType: e.target.value })}
              >
                <option value="SAVINGS">Savings</option>
                <option value="CHECKING">Checking</option>
                <option value="BUSINESS">Business</option>
              </select>
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button type="submit" className="btn btn-primary">
                Create Account
              </button>
              <button type="button" onClick={() => setShowCreateForm(false)} className="btn btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Transaction Form */}
      {showTransactionForm && (
        <div className="card">
          <h3>{transactionType.charAt(0).toUpperCase() + transactionType.slice(1)}</h3>
          <form onSubmit={handleTransaction}>
            <div className="form-group">
              <label htmlFor="accountNumber">Account Number</label>
              <select
                id="accountNumber"
                value={transactionForm.accountNumber}
                onChange={(e) => setTransactionForm({ ...transactionForm, accountNumber: e.target.value })}
                required
              >
                <option value="">Select Account</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.accountNumber}>
                    {account.accountNumber} (${account.balance?.toFixed(2) || "0.00"})
                  </option>
                ))}
              </select>
            </div>

            {transactionType === "transfer" && (
              <div className="form-group">
                <label htmlFor="toAccount">To Account Number</label>
                <input
                  type="text"
                  id="toAccount"
                  value={transactionForm.toAccount}
                  onChange={(e) => setTransactionForm({ ...transactionForm, toAccount: e.target.value })}
                  required
                />
              </div>
            )}

            <div className="form-group">
              <label htmlFor="amount">Amount</label>
              <input
                type="number"
                id="amount"
                step="0.01"
                min="0.01"
                value={transactionForm.amount}
                onChange={(e) => setTransactionForm({ ...transactionForm, amount: e.target.value })}
                required
              />
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <button type="submit" className="btn btn-primary">
                {transactionType.charAt(0).toUpperCase() + transactionType.slice(1)}
              </button>
              <button type="button" onClick={() => setShowTransactionForm(false)} className="btn btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Accounts List */}
      <div className="grid grid-2">
        {accounts.map((account) => (
          <div key={account.id} className="card">
            <h3>Account #{account.accountNumber}</h3>
            <p>
              <strong>Balance:</strong> ${account.balance?.toFixed(2) || "0.00"}
            </p>
            <p>
              <strong>Status:</strong>
              <span className={`status ${account.status === "ACTIVE" ? "status-active" : "status-pending"}`}>
                {account.status}
              </span>
            </p>

            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "16px" }}>
              <button
                onClick={() => openTransactionForm("deposit", account.accountNumber)}
                className="btn btn-success"
                style={{ fontSize: "12px", padding: "6px 12px" }}
              >
                Deposit
              </button>
              <button
                onClick={() => openTransactionForm("withdraw", account.accountNumber)}
                className="btn btn-danger"
                style={{ fontSize: "12px", padding: "6px 12px" }}
              >
                Withdraw
              </button>
              <button
                onClick={() => openTransactionForm("transfer", account.accountNumber)}
                className="btn btn-primary"
                style={{ fontSize: "12px", padding: "6px 12px" }}
              >
                Transfer
              </button>
            </div>
          </div>
        ))}
      </div>

      {accounts.length === 0 && (
        <div className="card">
          <p>No accounts found. Create your first account to get started!</p>
        </div>
      )}
    </div>
  )
}

export default Accounts

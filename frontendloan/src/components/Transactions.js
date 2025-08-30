"use client"

import { useState, useEffect } from "react"
import { transactionAPI } from "../services/api"

function Transactions() {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  useEffect(() => {
    loadTransactions()
  }, [currentPage])

  const loadTransactions = async () => {
    try {
      setLoading(true)
      const response = await transactionAPI.getHistory(currentPage, 10)
      setTransactions(response.data.content || [])
      setTotalPages(response.data.totalPages || 0)
    } catch (err) {
      setError("Failed to load transactions")
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString()
  }

  const formatAmount = (amount, type) => {
    const formattedAmount = Math.abs(amount || 0).toFixed(2)
    const sign = type === "DEBIT" ? "-" : "+"
    const color = type === "DEBIT" ? "#dc3545" : "#28a745"

    return (
      <span style={{ color, fontWeight: "bold" }}>
        {sign}${formattedAmount}
      </span>
    )
  }

  if (loading && transactions.length === 0) {
    return <div className="loading">Loading transactions...</div>
  }

  return (
    <div className="container">
      <h1>Transaction History</h1>

      {error && <div className="error">{error}</div>}

      {transactions.length === 0 ? (
        <div className="card">
          <p>No transactions found.</p>
        </div>
      ) : (
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Balance</th>
                <th>Account</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction, index) => (
                <tr key={transaction.id || index}>
                  <td>{formatDate(transaction.transactionDate)}</td>
                  <td>{transaction.description || "N/A"}</td>
                  <td>
                    <span className={`status ${transaction.type === "DEBIT" ? "status-rejected" : "status-approved"}`}>
                      {transaction.type}
                    </span>
                  </td>
                  <td>{formatAmount(transaction.amount, transaction.type)}</td>
                  <td>${transaction.balance?.toFixed(2) || "0.00"}</td>
                  <td>{transaction.accountNumber || "N/A"}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", gap: "10px", marginTop: "20px" }}>
              <button
                onClick={() => setCurrentPage((prev) => Math.max(0, prev - 1))}
                disabled={currentPage === 0}
                className="btn btn-secondary"
              >
                Previous
              </button>

              <span style={{ display: "flex", alignItems: "center", padding: "0 10px" }}>
                Page {currentPage + 1} of {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1))}
                disabled={currentPage >= totalPages - 1}
                className="btn btn-secondary"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default Transactions

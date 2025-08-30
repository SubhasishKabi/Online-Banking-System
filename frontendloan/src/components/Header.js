"use client"
import { Link } from "react-router-dom"
import { useAuth } from "../context/AuthContext"

function Header() {
  const { user, logout, isAuthenticated } = useAuth()

  const handleLogout = () => {
    logout()
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <header className="header">
      <div className="header-content">
        <div>
          <Link to="/dashboard" style={{ fontSize: "20px", fontWeight: "bold", textDecoration: "none", color: "#333" }}>
            Banking App
          </Link>
        </div>
        <nav className="nav">
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/accounts">Accounts</Link>
          {/* <Link to="/transactions">Transactions</Link> */}
          <Link to="/transaction-history">Transaction History</Link>
          <div className="nav-dropdown">
            <span className="nav-dropdown-toggle">Loans ▼</span>
            <div className="nav-dropdown-menu">
              <Link to="/loan-application">Apply for Loan</Link>
              <Link to="/my-loans">My Loans</Link>
              {/* <Link to="/loans">All Loans</Link> */}
            </div>
          </div>

          {user?.role === "ADMIN" && <Link to="/admin">Admin</Link>}

          {(user?.role === "ADMIN" || user?.role === "LOAN_OFFICER") && (
            <Link to="/loan-management">Loan Management</Link>
          )}

          <Link to="/profile">Profile</Link>

          <div style={{ marginLeft: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
            <span>Welcome, {user?.name}</span>
            <span className="status status-active">{user?.role}</span>
            <button onClick={handleLogout} className="btn btn-secondary">
              Logout
            </button>
          </div>
        </nav>
      </div>
    </header>
  )
}

export default Header

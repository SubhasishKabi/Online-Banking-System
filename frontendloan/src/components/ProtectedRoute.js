"use client"
import { useAuth } from "../context/AuthContext"

function ProtectedRoute({ children, requiredRole = null }) {
  const { isAuthenticated, user, isLoading } = useAuth()

  if (isLoading) {
    return <div className="loading">Loading...</div>
  }

  if (!isAuthenticated) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h2 className="auth-title">Access Denied</h2>
          <p>Please log in to access this page.</p>
        </div>
      </div>
    )
  }

  if (requiredRole && user?.role !== requiredRole) {
    const hasLoanAccess = user?.role === "ADMIN" || user?.role === "LOAN_OFFICER"
    const requiresLoanAccess = requiredRole === "LOAN_OFFICER"

    if (requiresLoanAccess && !hasLoanAccess) {
      return (
        <div className="auth-container">
          <div className="auth-card">
            <h2 className="auth-title">Access Denied</h2>
            <p>You don't have permission to access this page.</p>
          </div>
        </div>
      )
    }

    if (!requiresLoanAccess && user?.role !== requiredRole) {
      return (
        <div className="auth-container">
          <div className="auth-card">
            <h2 className="auth-title">Access Denied</h2>
            <p>You don't have permission to access this page.</p>
          </div>
        </div>
      )
    }
  }

  return children
}

export default ProtectedRoute

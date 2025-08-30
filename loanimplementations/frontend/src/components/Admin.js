"use client"

import { useState } from "react"
import { authAPI } from "../services/api"
import { useAuth } from "../context/AuthContext"

function Admin() {
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [userType, setUserType] = useState("admin")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    if (error) setError("")
    if (success) setSuccess("")
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      return
    }

    setLoading(true)
    try {
      setError("")

      const userData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
      }

      if (userType === "admin") {
        await authAPI.registerAdmin(userData)
        setSuccess("Admin user created successfully!")
      } else {
        await authAPI.registerLoanOfficer(userData)
        setSuccess("Loan Officer created successfully!")
      }

      setFormData({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
      })
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create user")
    } finally {
      setLoading(false)
    }
  }

  if (user?.role !== "ADMIN") {
    return (
      <div className="container">
        <div className="card">
          <h2>Access Denied</h2>
          <p>You don't have permission to access the admin panel.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <h1>Admin Panel</h1>

      <div className="card">
        <h3>Create New User</h3>

        {error && <div className="error">{error}</div>}
        {success && <div className="success">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="userType">User Type</label>
            <select id="userType" value={userType} onChange={(e) => setUserType(e.target.value)}>
              <option value="admin">Admin</option>
              <option value="loanOfficer">Loan Officer</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
            <small style={{ color: "#666", fontSize: "12px" }}>
              Must contain at least 8 characters with uppercase, lowercase, digit, and special character
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Creating..." : `Create ${userType === "admin" ? "Admin" : "Loan Officer"}`}
          </button>
        </form>
      </div>

      <div className="card">
        <h3>System Information</h3>
        <p>
          <strong>Current User:</strong> {user?.name}
        </p>
        <p>
          <strong>Role:</strong> <span className="status status-active">{user?.role}</span>
        </p>
        <p>
          <strong>Email:</strong> {user?.email}
        </p>
      </div>
    </div>
  )
}

export default Admin

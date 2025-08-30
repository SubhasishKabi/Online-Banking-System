# Banking Frontend

A React frontend application for the banking system with role-based access control.

## Features

- **Authentication**: Login, registration, and JWT token management
- **Role-based Access**: Different interfaces for USER, LOAN_OFFICER, and ADMIN roles
- **Account Management**: Create accounts, deposit, withdraw, transfer funds
- **Loan System**: Apply for loans, view loan details, pay installments
- **Loan Management**: Approve/reject loans (for loan officers and admins)
- **Transaction History**: View transaction history with pagination
- **Profile Management**: Update profile information and change password
- **Admin Panel**: Create admin users and loan officers

## User Roles

### USER (Regular Customer)
- Dashboard with account overview
- Account management (create, deposit, withdraw, transfer)
- Loan applications and management
- Transaction history
- Profile management

### LOAN_OFFICER
- All USER features
- Loan management dashboard
- Approve/reject loan applications
- View all loans and analytics

### ADMIN
- All LOAN_OFFICER features
- Admin panel to create new users
- System-wide access and management

## Getting Started

1. Install dependencies:
\`\`\`bash
cd frontend
npm install
\`\`\`

2. Start the development server:
\`\`\`bash
npm start
\`\`\`

3. Make sure the backend is running on `http://localhost:8080`

## API Integration

The frontend connects to the Spring Boot backend running on port 8080. All API calls are handled through the `services/api.js` file with automatic JWT token management.

## Technology Stack

- React 18
- React Router DOM for routing
- Axios for API calls
- Context API for state management
- CSS for styling (no external UI libraries)

## Project Structure

\`\`\`
frontend/
├── public/
├── src/
│   ├── components/     # React components
│   ├── context/        # React context providers
│   ├── services/       # API service layer
│   ├── App.js         # Main app component
│   ├── index.js       # Entry point
│   └── index.css      # Global styles
└── package.json

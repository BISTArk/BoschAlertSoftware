# Authentication and Role-Based Access Control

## Overview
The Bosch Alert Hub now includes a complete authentication system with role-based access control. The system supports three user roles with different permissions.

## User Roles

### 1. Guard
- **Access**: Only sees alerts assigned to them
- **Permissions**:
  - View assigned alerts
  - Mark alerts as "in-progress"
  - Resolve alerts with optional notes
- **Dashboard**: Filtered view showing only their assignments

### 2. Head (Security Head)
- **Access**: Views all alerts in the system
- **Permissions**:
  - All guard permissions
  - Assign alerts to guards
  - Reassign alerts to different guards
  - View all alerts regardless of assignment status
  - Access filtering and search features
- **Dashboard**: Complete alert view with filtering options

### 3. Admin (System Administrator)
- **Access**: Full system access
- **Permissions**:
  - All head permissions
  - User management (create, update, deactivate users)
  - Access to admin panel
  - Full system configuration

## Default Users

The system comes with pre-seeded test users:

| Username | Password  | Role  | Name                  |
|----------|-----------|-------|-----------------------|
| admin    | admin123  | admin | System Administrator  |
| head1    | head123   | head  | Security Head         |
| guard1   | guard123  | guard | Guard One            |
| guard2   | guard123  | guard | Guard Two            |

## Features

### Authentication
- Simple username/password login
- Session persisted in localStorage
- Automatic redirect to login if not authenticated
- Logout functionality

### Alert Statuses
- **Unassigned**: New alerts waiting for assignment
- **Assigned**: Alert assigned to a guard
- **In Progress**: Guard is actively working on the alert
- **Resolved**: Alert has been resolved

### Filtering (Heads and Admins Only)
- Filter by status (unassigned, assigned, in-progress, resolved)
- Filter by event code
- Filter by account number
- Full-text search across alerts

### Alert Actions

#### For Guards:
- **Start**: Change status from "assigned" to "in-progress"
- **Resolve**: Mark alert as resolved with optional notes

#### For Heads and Admins:
- **Assign**: Assign unassigned alerts to guards
- **Reassign**: Change guard assignment
- All guard actions

## Database Schema

### Users Table
```typescript
{
  username: string          // Unique username
  password: string          // Password (plain text for demo)
  name: string             // Display name
  role: "guard" | "head" | "admin"
  active: boolean          // Soft delete flag
  createdAt: number        // Timestamp
}
```

### Alerts Table (Enhanced)
```typescript
{
  // Original SIA fields...
  
  // New assignment fields:
  assignedTo?: Id<"users">     // Guard assigned
  status?: "unassigned" | "assigned" | "in-progress" | "resolved"
  assignedBy?: Id<"users">     // Who assigned it
  assignedAt?: number          // When assigned
  resolvedAt?: number          // When resolved
  resolvedBy?: Id<"users">     // Who resolved it
  notes?: string               // Resolution notes
}
```

## API Endpoints

### Authentication (convex/auth.ts)
- `login`: Authenticate user
- `getUsers`: List all users (admin only)
- `getGuards`: List active guards (for assignment)
- `createUser`: Create new user
- `updateUser`: Update user details
- `deactivateUser`: Soft delete user
- `deleteUser`: Hard delete user

### Alert Management (convex/alerts.ts)
- `getAlerts`: Query alerts with role-based filtering
- `createAlert`: Create new alert (from SIA receiver)
- `assignAlert`: Assign alert to guard
- `reassignAlert`: Change guard assignment
- `updateAlertStatus`: Update alert status
- `deleteAlert`: Delete alert

## Security Notes

⚠️ **Important**: This is a simple authentication system designed to be easily replaceable.

Current implementation:
- Passwords stored in plain text
- No rate limiting
- Basic session management
- No password requirements

**For Production**:
- Replace with proper authentication (OAuth, JWT, etc.)
- Use Convex Auth or another auth provider
- Implement password hashing (bcrypt/argon2)
- Add rate limiting and security headers
- Implement password complexity requirements
- Add MFA support
- Use secure session management

## Replacing Authentication

The authentication system is isolated in:
- `/src/contexts/AuthContext.tsx` - Auth context and session management
- `/src/components/Login.tsx` - Login UI
- `/convex/auth.ts` - Auth queries and mutations

To replace with a different auth system:
1. Update the AuthContext to use your auth provider
2. Replace the Login component
3. Update the Convex functions to use your auth
4. Update the schema if needed

The role-based filtering and alert assignment logic will remain unchanged as long as the user object maintains the same structure (`_id`, `username`, `name`, `role`).

## Usage Examples

### Typical Workflow

1. **New Alert Arrives**
   - Status: "unassigned"
   - Visible to heads and admins

2. **Head Assigns to Guard**
   - Head opens alert list
   - Clicks "Assign" on an alert
   - Selects guard from dropdown
   - Alert status changes to "assigned"
   - Guard can now see it in their filtered view

3. **Guard Works on Alert**
   - Guard sees alert in their dashboard
   - Clicks "Start" to mark as "in-progress"
   - Investigates and resolves the issue
   - Clicks "Resolve" and adds notes
   - Status changes to "resolved"

4. **Review and Reporting**
   - Heads/Admins can filter by "resolved" status
   - View resolution notes
   - Export data for reporting

## Next Steps

Pending features not yet implemented:
- User management UI (admin panel)
- Real-time notifications for guards on new assignments
- Alert history and audit log
- Bulk assignment operations
- Advanced reporting and analytics

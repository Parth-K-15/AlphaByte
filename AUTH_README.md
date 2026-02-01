# Authentication System

## Features

✅ Role-based authentication (Admin/Participant)
✅ Sign In & Sign Up pages
✅ Protected routes with role-based access control
✅ JWT token authentication
✅ Password hashing with bcrypt
✅ Persistent login (localStorage)

## How to Use

### 1. Start the servers

**Server (Backend):**
```bash
cd Server
npm run dev
```

**Client (Frontend):**
```bash
cd Client
npm run dev
```

### 2. Access the application

1. Go to `http://localhost:5173`
2. You'll see the landing page with two options:
   - **Admin** - For event organizers and staff
   - **Participant** - For event attendees

### 3. Sign Up

- Click on either Admin or Participant
- Click "Sign Up" link
- Fill in the registration form
- You'll be automatically logged in after signup

### 4. Sign In

- Enter your email and password
- Click "Sign In"
- You'll be redirected to your dashboard based on your role

## Routes

### Public Routes
- `/auth` - Landing page (role selection)
- `/auth/signin/admin` - Admin sign in
- `/auth/signin/participant` - Participant sign in
- `/auth/signup/admin` - Admin sign up
- `/auth/signup/participant` - Participant sign up

### Protected Routes
- `/admin/*` - Admin dashboard (requires ADMIN, TEAM_LEAD, or EVENT_STAFF role)
- `/organizer/*` - Organizer dashboard (requires TEAM_LEAD or EVENT_STAFF role)
- `/participant/*` - Participant dashboard (requires PARTICIPANT role)

## API Endpoints

### POST `/api/auth/signup`
Create a new account
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "password": "password123",
  "role": "admin" // or "participant"
}
```

### POST `/api/auth/login`
Login to existing account
```json
{
  "email": "john@example.com",
  "password": "password123",
  "role": "admin" // or "participant"
}
```

### GET `/api/auth/verify`
Verify JWT token (requires Authorization header)
```
Authorization: Bearer <token>
```

## User Roles

### Admin Roles
- **ADMIN** - Full access to all admin features
- **TEAM_LEAD** - Can manage events and team members
- **EVENT_STAFF** - Can manage assigned events

### Participant Role
- **PARTICIPANT** - Can browse events, register, and manage profile

## Security Features

- Passwords are hashed using bcrypt
- JWT tokens expire after 7 days
- Protected routes check authentication and authorization
- Suspended accounts cannot login
- Inactive admin accounts are blocked

# Employee Task & Project Management Web Application

> **Project:** Group Full-Stack Development Internship Major Project  
> **Assigned Responsibility:** **MODULE 5 — DASHBOARD**  
> **Maintainer / Lead Developer (Module 5):** Sanjay Kumar  
> **Integrated Modules:** User Authentication (M1), Employee Management (M2), Project Management (M3), Task Management (M4), Dashboard (M5), Search & Filtering (M6), Database & REST API (M7).

---

## 1. Executive Summary

This application is an enterprise-grade, full-stack web application designed for end-to-end management of corporate employees, projects, task deliverables, and team productivity analytics.

The **Dashboard (Module 5)** serves as the central operational intelligence hub. It integrates directly with the underlying MongoDB database via Express RESTful aggregation APIs, delivering real-time Key Performance Indicators (KPIs), dynamically calculated project delivery velocity, individual employee workload analytics, priority task queues, and an interactive **3D Project Core** network built using Three.js / React Three Fiber.

---

## 2. Technology Stack

- **Frontend:** React.js (v18), Vite (v5)
- **Styling:** Tailwind CSS (v3) with Dark-First Enterprise SaaS theme
- **3D Graphics:** Three.js (v0.168), React Three Fiber (`@react-three/fiber`), Drei (`@react-three/drei`)
- **Backend:** Node.js (v18+), Express.js (v4)
- **Database / ODM:** MongoDB with Mongoose (v8) + Automatic In-Memory Mongo fallback (`mongodb-memory-server`) for zero-setup execution
- **Authentication:** JWT (JSON Web Tokens) with bcrypt password hashing
- **Routing:** React Router DOM (v6)

---

## 3. Module 5 — Dashboard Architecture & Data Engine

### 3.1 Real MongoDB Aggregation (Zero Hardcoded / Fake Data)

All statistics and visual components are driven by the `GET /api/dashboard/stats` endpoint:

1. **Total Employees:** Count of active documents in the `Employee` collection:
   ```javascript
   await Employee.countDocuments();
   ```
2. **Active Projects:**
   ```javascript
   await Project.countDocuments({ status: 'Active' });
   ```
3. **Completed Projects:**
   ```javascript
   await Project.countDocuments({ status: 'Completed' });
   ```
4. **Pending Tasks:**
   ```javascript
   await Task.countDocuments({ status: 'Pending' });
   ```
5. **Completed Tasks:**
   ```javascript
   await Task.countDocuments({ status: 'Completed' });
   ```

### 3.2 Real Project Progress Calculation
Project progress is never fabricated; it is mathematically derived from associated tasks:
$$\text{Project Progress} = \frac{\text{Completed Tasks}}{\text{Total Tasks}} \times 100$$
*(If a project has zero tasks assigned yet, its baseline project progress field is utilized).*

### 3.3 Employee Task Workload Statistics
Aggregated per team member across all assigned tasks:
- **Total Tasks**
- **Completed Tasks**
- **In Progress Tasks**
- **Pending Tasks**
- **Completion Rate (%)**

Rendered with an interactive stacked bar chart featuring hover tooltips and department filtering.

### 3.4 Interactive 3D Project Core (`ProjectCore3D.jsx`)
Visualizes the foundational relational topology:
$$\text{EMPLOYEES} \longrightarrow \text{PROJECTS} \longrightarrow \text{TASKS}$$

- **Core Geometry:** Faceted glowing octahedron at the center representing the selected active project.
- **Satellites:** Orbiting cyan spheres for assigned employees and emerald/amber satellites for tasks.
- **Dynamic Connecting Lines:** Visual vectors showing active work relationships.
- **Interactions:** Mouse tilt parallax, continuous slow rotation, project selection buttons, play/pause controls.
- **Accessibility & Fallback:**
  - Detects `prefers-reduced-motion` and disables rotational animation for motion sensitivity.
  - Automatically activates a clean **2D Canvas / SVG topology fallback** if WebGL is unsupported or disabled.

---

## 4. Project Structure

```
ESPD_/
├── backend/
│   ├── config/
│   │   └── db.js                 # Resilient MongoDB connection with in-memory fallback
│   ├── controllers/
│   │   ├── authController.js     # Module 1: Auth & JWT handling
│   │   ├── employeeController.js # Module 2: Employee CRUD & dept stats
│   │   ├── projectController.js  # Module 3: Project CRUD & task-linked progress
│   │   ├── taskController.js     # Module 4: Task lifecycle & status hooks
│   │   └── dashboardController.js# Module 5: KPI, Progress & Workload aggregations
│   ├── models/
│   │   ├── Employee.js           # Employee Mongoose schema
│   │   ├── Project.js            # Project Mongoose schema
│   │   ├── Task.js               # Task Mongoose schema (with pre-save sync hooks)
│   │   └── User.js               # User authentication schema
│   ├── routes/
│   │   ├── authRoutes.js         # /api/auth
│   │   ├── employeeRoutes.js     # /api/employees
│   │   ├── projectRoutes.js      # /api/projects
│   │   ├── taskRoutes.js         # /api/tasks
│   │   └── dashboardRoutes.js    # /api/dashboard/stats
│   ├── seed/
│   │   └── seedData.js           # Seed dataset matching team standards
│   ├── tests/
│   │   ├── test_dashboard_api.js # Module 5 automated test suite (35 assertions)
│   │   └── test_api.js           # Task management integration test suite
│   ├── package.json
│   └── server.js
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── dashboard/
│   │   │   │   ├── DashboardHeader.jsx  # Hero greeting, live clock, refresh button
│   │   │   │   ├── StatCard.jsx         # Animated counter KPI card with route navigation
│   │   │   │   ├── ProjectCore3D.jsx    # Three.js 3D Project Core with 2D fallback
│   │   │   │   ├── ProjectProgress.jsx  # Task-driven delivery velocity bars & search
│   │   │   │   ├── EmployeeTaskStats.jsx# Stacked bar chart workload analytics
│   │   │   │   ├── RecentTasks.jsx      # Priority tasks table with quick completion toggle
│   │   │   │   └── DashboardSkeletons.jsx# Shimmer loading states
│   │   │   └── layout/
│   │   │       ├── Sidebar.jsx          # Dark SaaS sidebar with module navigation
│   │   │       ├── Navbar.jsx           # Top app bar with search and user badge
│   │   │       └── Layout.jsx           # Main shell wrapper
│   │   ├── pages/
│   │   │   ├── DashboardPage.jsx        # MODULE 5 DASHBOARD PAGE
│   │   │   ├── TasksPage.jsx            # Module 4 Task Management
│   │   │   ├── ProjectsPage.jsx         # Module 3 Project Management
│   │   │   ├── EmployeesPage.jsx        # Module 2 Employee Directory
│   │   │   ├── SearchPage.jsx           # Module 6 Universal Search & Filters
│   │   │   ├── LoginPage.jsx            # Module 1 Sign In & Demo Fast-Login
│   │   │   └── RegisterPage.jsx         # Module 1 Registration
│   │   ├── services/
│   │   │   ├── api.js                   # Axios client with JWT interceptor
│   │   │   ├── authService.js           # Session and auth tokens
│   │   │   └── dashboardService.js      # Dashboard stats API calls
│   │   ├── App.jsx                      # React Router routes
│   │   ├── index.css                    # Tailwind CSS + custom glassmorphism
│   │   └── main.jsx
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
│
└── package.json                         # Root orchestrator
```

---

## 5. Getting Started

### 5.1 Quick Seed & Test
Run the automated test suite (includes in-memory MongoDB, zero setup required):
```bash
cd backend
npm test
```

### 5.2 Seeding Database
To populate MongoDB with realistic enterprise data (Employees, Projects, Tasks, Demo Accounts):
```bash
cd backend
npm run seed
```

### 5.3 Starting the Backend
```bash
cd backend
npm start
```
*API runs on `http://localhost:5000`*  
*Health check: `http://localhost:5000/api/health`*  
*Dashboard stats: `http://localhost:5000/api/dashboard/stats`*

### 5.4 Starting the Frontend
```bash
cd frontend
npm run dev
```
*Frontend runs on `http://localhost:5173`*

### 5.5 Test Login Credentials
For testing role-based access:
- **Admin:** `admin@company.com` / `Admin@12345`
- **Project Manager:** `manager@company.com` / `Manager@12345`
- **Employee:** `rahul@gmail.com` / `Rahul@12345`
*(One-click quick login buttons are also provided directly on the Login screen).*

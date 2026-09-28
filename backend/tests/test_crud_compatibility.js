/**
 * Comprehensive Integration & CRUD Test Suite for:
 * 1. Sindhu's Employee Management CRUD (including 3-field submissions & arbitrary departments)
 * 2. Pallavi's Project Management CRUD (including 'Pending' status, date ranges & assigned employees)
 * 3. Prethiksha's Task Management with Dual Compatibility (assignedTo <-> employeeId)
 * 4. Module 5 Dashboard Real-Time Metrics & Dynamic Progress Calculation
 */
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const express = require('express');
const cors = require('cors');

const employeeRoutes = require('../routes/employeeRoutes');
const projectRoutes = require('../routes/projectRoutes');
const taskRoutes = require('../routes/taskRoutes');
const dashboardRoutes = require('../routes/dashboardRoutes');
const { notFound, errorHandler } = require('../middleware/errorMiddleware');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

let mongoServer;
let serverInstance;
let baseUrl;

const setupServer = async () => {
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test_jwt_secret_12345';
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  const app = express();
  app.use(cors());
  app.use(express.json());

  app.use('/api/employees', employeeRoutes);
  app.use('/api/projects', projectRoutes);
  app.use('/api/tasks', taskRoutes);
  app.use('/api/dashboard', dashboardRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return new Promise((resolve) => {
    serverInstance = app.listen(0, () => {
      baseUrl = `http://localhost:${serverInstance.address().port}`;
      resolve();
    });
  });
};

const teardownServer = async () => {
  if (serverInstance) serverInstance.close();
  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
};

const runSuite = async () => {
  console.log(`\n${colors.bold}======================================================${colors.reset}`);
  console.log(`${colors.bold}🚀 RUNNING TEAM CRUD & DUAL COMPATIBILITY TEST SUITE 🚀${colors.reset}`);
  console.log(`${colors.bold}======================================================\n${colors.reset}`);

  let passed = 0;
  let failed = 0;

  const assert = (cond, name, details = '') => {
    if (cond) {
      console.log(`  ${colors.green}✓ PASS${colors.reset} - ${name}`);
      passed++;
    } else {
      console.log(`  ${colors.red}✗ FAIL${colors.reset} - ${name} ${details ? `(${details})` : ''}`);
      failed++;
    }
  };

  try {
    await setupServer();

    const adminUser = await User.create({
      name: 'Admin Test User',
      email: 'admin.crud@company.com',
      password: 'Password@123',
      role: 'ADMIN',
    });

    const adminToken = jwt.sign(
      { id: adminUser._id },
      process.env.JWT_SECRET || 'test_jwt_secret_12345',
      { expiresIn: '1d' }
    );

    const authHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    };

    // ========================================================
    // 1. SINDHU'S EMPLOYEE MANAGEMENT CRUD TESTS
    // ========================================================
    console.log(`\n${colors.yellow}1. Sindhu's Employee Management Compatibility & CRUD${colors.reset}`);

    // A. Add Employee with Sindhu's exact 3-field payload and custom department
    const empRes1 = await fetch(`${baseUrl}/api/employees`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        name: 'Sindhu Employee',
        email: 'sindhu.emp@example.com',
        department: 'Cloud Infrastructure', // Non-standard department to test relaxed enum
      }),
    });
    const empData1 = await empRes1.json();
    assert(empRes1.status === 201, 'POST /api/employees accepts 3-field payload (name, email, department)');
    assert(empData1.data && empData1.data.department === 'Cloud Infrastructure', 'Saved employee preserves non-enum department');
    assert(empData1.data.role === 'Team Member', 'Employee automatically defaults role to "Team Member"');
    assert(empData1.data.status === 'Active', 'Employee automatically defaults status to "Active"');

    const empId1 = empData1.data._id;

    // B. Add second employee
    const empRes2 = await fetch(`${baseUrl}/api/employees`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        name: 'Jane Doe',
        email: 'jane.doe@example.com',
        department: 'Engineering',
      }),
    });
    const empData2 = await empRes2.json();
    const empId2 = empData2.data._id;
    assert(empRes2.status === 201, 'POST /api/employees creates second employee successfully');

    // C. Get all employees
    const allEmpsRes = await fetch(`${baseUrl}/api/employees`, {
      headers: authHeaders,
    });
    const allEmpsData = await allEmpsRes.json();
    assert(allEmpsRes.status === 200, 'GET /api/employees returns 200 OK');
    assert(allEmpsData.data.length === 2, 'GET /api/employees returns all registered employees (count: 2)');

    // D. Edit Employee (PUT /api/employees/:id)
    const updateEmpRes = await fetch(`${baseUrl}/api/employees/${empId1}`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({
        name: 'Sindhu Updated',
        email: 'sindhu.emp@example.com',
        department: 'DevOps & Cloud',
      }),
    });
    const updateEmpData = await updateEmpRes.json();
    assert(updateEmpRes.status === 200, 'PUT /api/employees/:id successfully updates employee');
    assert(updateEmpData.data.name === 'Sindhu Updated', 'Updated employee name matches new value');
    assert(updateEmpData.data.department === 'DevOps & Cloud', 'Updated employee department matches new value');

    // ========================================================
    // 2. PALLAVI'S PROJECT MANAGEMENT CRUD TESTS
    // ========================================================
    console.log(`\n${colors.yellow}2. Pallavi's Project Management Compatibility & CRUD${colors.reset}`);

    // A. Create project with status: 'Pending' and assignedEmployees
    const projRes1 = await fetch(`${baseUrl}/api/projects`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        name: 'Cloud Migration Platform',
        description: 'Migrating internal services to enterprise cloud architecture',
        status: 'Pending', // Specifically tests Pallavi's 'Pending' status
        startDate: '2026-10-01',
        endDate: '2026-12-31',
        assignedEmployees: [empId1, empId2],
      }),
    });
    const projData1 = await projRes1.json();
    assert(projRes1.status === 201, 'POST /api/projects successfully creates project with status "Pending"');
    assert(projData1.data.status === 'Pending', 'Project preserves "Pending" status without validation error');
    assert(projData1.data.assignedEmployees.length === 2, 'Project properly saves assignedEmployees ObjectId array');

    const projId1 = projData1.data._id;

    // B. Create second project with status: 'Active'
    const projRes2 = await fetch(`${baseUrl}/api/projects`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        name: 'Internal Portal Redesign',
        description: 'Revamping the internal developer workflow toolset',
        status: 'Active',
        startDate: '2026-09-01',
        endDate: '2026-11-30',
        assignedEmployees: [empId1],
      }),
    });
    const projData2 = await projRes2.json();
    const projId2 = projData2.data._id;
    assert(projRes2.status === 201, 'POST /api/projects creates second active project');

    // C. Get all projects
    const allProjsRes = await fetch(`${baseUrl}/api/projects`, {
      headers: authHeaders,
    });
    const allProjsData = await allProjsRes.json();
    assert(allProjsRes.status === 200, 'GET /api/projects returns 200 OK');
    assert(allProjsData.data.length === 2, 'GET /api/projects returns 2 projects');

    // D. Edit Project (PUT /api/projects/:id)
    const updateProjRes = await fetch(`${baseUrl}/api/projects/${projId1}`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({
        name: 'Cloud Migration Platform (Phase 1)',
        status: 'Active',
        description: 'Updated migration scope',
      }),
    });
    const updateProjData = await updateProjRes.json();
    assert(updateProjRes.status === 200, 'PUT /api/projects/:id updates project');
    assert(updateProjData.data.name === 'Cloud Migration Platform (Phase 1)', 'Updated project name matches');
    assert(updateProjData.data.status === 'Active', 'Project status successfully transitioned to Active');

    // ========================================================
    // 3. TASK MANAGEMENT & DUAL COMPATIBILITY TESTS
    // ========================================================
    console.log(`\n${colors.yellow}3. Task Management & employeeId Dual Compatibility${colors.reset}`);

    // A. Create Task using Prethiksha's assignedTo
    const taskRes1 = await fetch(`${baseUrl}/api/tasks`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        title: 'Setup Kubernetes Cluster',
        description: 'Configure cluster nodes and ingress rules',
        assignedTo: empId1,
        projectId: projId1,
        priority: 'High',
        status: 'Completed',
        dueDate: '2026-11-01',
      }),
    });
    const taskData1 = await taskRes1.json();
    assert(taskRes1.status === 201, 'POST /api/tasks creates task with assignedTo');
    assert(taskData1.data.status === 'Completed', 'Task status is Completed');
    assert(taskData1.data.completionPercentage === 100, 'Auto-sets 100% on Completed status');
    assert(taskData1.data.employeeId && (taskData1.data.employeeId._id === empId1 || taskData1.data.employeeId === empId1), 'Task exposes virtual employeeId matching assignedTo');

    // B. Create Task using Pallavi's employeeId alias
    const taskRes2 = await fetch(`${baseUrl}/api/tasks`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        title: 'Configure CI/CD Pipeline',
        description: 'Automate build and deployment pipelines',
        employeeId: empId2, // Using employeeId alias!
        projectId: projId1,
        priority: 'Medium',
        status: 'In Progress',
        dueDate: '2026-11-15',
        completionPercentage: 50,
      }),
    });
    const taskData2 = await taskRes2.json();
    assert(taskRes2.status === 201, 'POST /api/tasks accepts employeeId alias successfully');
    assert(taskData2.data.assignedTo && (taskData2.data.assignedTo._id === empId2 || taskData2.data.assignedTo === empId2), 'employeeId alias correctly mapped to assignedTo');

    // C. Create Task on Project 2
    const taskRes3 = await fetch(`${baseUrl}/api/tasks`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        title: 'Design System Polish',
        description: 'Standardize dark mode components',
        assignedTo: empId1,
        projectId: projId2,
        priority: 'Low',
        status: 'Completed',
        dueDate: '2026-10-15',
      }),
    });
    assert(taskRes3.status === 201, 'POST /api/tasks creates completed task for Project 2');

    // ========================================================
    // 4. MODULE 5 DASHBOARD INTEGRATION & REAL METRICS
    // ========================================================
    console.log(`\n${colors.yellow}4. Module 5 Dashboard Integration & Real Metrics Validation${colors.reset}`);

    const dashRes = await fetch(`${baseUrl}/api/dashboard/stats`, {
      headers: authHeaders,
    });
    const dashData = await dashRes.json();
    assert(dashRes.status === 200, 'GET /api/dashboard/stats returns 200 OK');

    const kpis = dashData.data.kpis;
    assert(kpis.totalEmployees === 2, `KPI Total Employees = 2 (Got: ${kpis.totalEmployees})`);
    assert(kpis.totalProjects === 2, `KPI Total Projects = 2 (Got: ${kpis.totalProjects})`);
    assert(kpis.totalTasks === 3, `KPI Total Tasks = 3 (Got: ${kpis.totalTasks})`);
    assert(kpis.completedTasks === 2, `KPI Completed Tasks = 2 (Got: ${kpis.completedTasks})`);
    assert(kpis.inProgressTasks === 1, `KPI In Progress Tasks = 1 (Got: ${kpis.inProgressTasks})`);

    // Verify Real Project Progress calculation (completedTasks / totalTasks * 100)
    const projectProgress = dashData.data.projectProgress;
    const p1Progress = projectProgress.find((p) => p._id === projId1);
    assert(p1Progress !== undefined, 'Project 1 found in dashboard project progress');
    assert(p1Progress.totalTasks === 2, `Project 1 totalTasks = 2 (Got: ${p1Progress.totalTasks})`);
    assert(p1Progress.completedTasks === 1, `Project 1 completedTasks = 1 (Got: ${p1Progress.completedTasks})`);
    assert(p1Progress.progress === 50, `Project 1 dynamic progress = 50% (Got: ${p1Progress.progress}%)`);

    const p2Progress = projectProgress.find((p) => p._id === projId2);
    assert(p2Progress !== undefined, 'Project 2 found in dashboard project progress');
    assert(p2Progress.progress === 100, `Project 2 dynamic progress = 100% (Got: ${p2Progress.progress}%)`);

    // Verify Employee Workload Stats
    const employeeStats = dashData.data.employeeTaskStats;
    assert(employeeStats.length === 2, `Employee workload stats contains both employees (Got: ${employeeStats.length})`);
    const emp1Stats = employeeStats.find((e) => e.employeeId === empId1);
    assert(emp1Stats.totalTasks === 2, `Emp 1 total tasks = 2 (Got: ${emp1Stats.totalTasks})`);
    assert(emp1Stats.completedTasks === 2, `Emp 1 completed tasks = 2 (Got: ${emp1Stats.completedTasks})`);
    assert(emp1Stats.completionRate === 100, `Emp 1 completion rate = 100% (Got: ${emp1Stats.completionRate}%)`);

    // ========================================================
    // 5. CLEANUP / DELETE VERIFICATION
    // ========================================================
    console.log(`\n${colors.yellow}5. Deletion & Cleanup Verification${colors.reset}`);

    // Delete project
    const delProjRes = await fetch(`${baseUrl}/api/projects/${projId2}`, {
      method: 'DELETE',
      headers: authHeaders,
    });
    assert(delProjRes.status === 200, 'DELETE /api/projects/:id returns 200 OK');

    // Delete employee
    const delEmpRes = await fetch(`${baseUrl}/api/employees/${empId2}`, {
      method: 'DELETE',
      headers: authHeaders,
    });
    assert(delEmpRes.status === 200, 'DELETE /api/employees/:id returns 200 OK');

    console.log(`\n${colors.bold}======================================================${colors.reset}`);
    console.log(`${colors.bold}Test Summary: ${colors.green}${passed} Passed${colors.reset}, ${colors.red}${failed} Failed${colors.reset}`);
    console.log(`${colors.bold}======================================================\n${colors.reset}`);

    await teardownServer();
    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Test execution error:', err);
    await teardownServer();
    process.exit(1);
  }
};

runSuite();

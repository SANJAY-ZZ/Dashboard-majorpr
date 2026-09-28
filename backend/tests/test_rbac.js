/**
 * Comprehensive Backend RBAC (Role-Based Access Control) Test Suite
 * Tests ADMIN, PROJECT_MANAGER, and EMPLOYEE authorization boundaries
 */
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const authRoutes = require('../routes/authRoutes');
const employeeRoutes = require('../routes/employeeRoutes');
const projectRoutes = require('../routes/projectRoutes');
const taskRoutes = require('../routes/taskRoutes');
const dashboardRoutes = require('../routes/dashboardRoutes');
const { notFound, errorHandler } = require('../middleware/errorMiddleware');

const User = require('../models/User');
const Employee = require('../models/Employee');
const Project = require('../models/Project');
const Task = require('../models/Task');

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
  process.env.JWT_SECRET = 'test_jwt_secret_rbac_2026';

  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  const app = express();
  app.use(cors());
  app.use(express.json());

  app.use('/api/auth', authRoutes);
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

const runRBACTests = async () => {
  console.log(`\n${colors.bold}======================================================${colors.reset}`);
  console.log(`${colors.bold}🛡️  RUNNING ROLE-BASED ACCESS CONTROL (RBAC) TEST SUITE 🛡️${colors.reset}`);
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

    // 1. Seed Users for each role
    const adminUser = await User.create({
      name: 'System Admin',
      email: 'admin@company.com',
      password: 'AdminPassword123!',
      role: 'ADMIN',
    });

    const managerUser = await User.create({
      name: 'Project Manager',
      email: 'manager@company.com',
      password: 'ManagerPassword123!',
      role: 'PROJECT_MANAGER',
    });

    const employeeUser = await User.create({
      name: 'Rahul Employee',
      email: 'rahul@gmail.com',
      password: 'EmployeePassword123!',
      role: 'EMPLOYEE',
    });

    const otherEmployeeUser = await User.create({
      name: 'Other Employee',
      email: 'other@gmail.com',
      password: 'OtherPassword123!',
      role: 'EMPLOYEE',
    });

    // Seed matching Employee profiles
    const rahulEmployee = await Employee.create({
      name: 'Rahul Employee',
      email: 'rahul@gmail.com',
      department: 'Engineering',
      role: 'Developer',
    });

    const otherEmployee = await Employee.create({
      name: 'Other Employee',
      email: 'other@gmail.com',
      department: 'Design',
      role: 'UI Designer',
    });

    // Seed Projects: 1 assigned to Rahul, 1 unassigned to Rahul
    const projRahul = await Project.create({
      name: 'Rahul Project Portal',
      code: 'PROJ-RAHUL-01',
      status: 'Active',
      assignedEmployees: [rahulEmployee._id],
    });

    const projOther = await Project.create({
      name: 'Other Team Project',
      code: 'PROJ-OTHER-02',
      status: 'Active',
      assignedEmployees: [otherEmployee._id],
    });

    // Seed Tasks: 1 assigned to Rahul, 1 assigned to other
    const taskRahul = await Task.create({
      title: 'Build UI for Portal',
      description: 'Implement frontend views',
      assignedTo: rahulEmployee._id,
      projectId: projRahul._id,
      status: 'In Progress',
      priority: 'High',
      dueDate: new Date(Date.now() + 86400000),
      completionPercentage: 50,
    });

    const taskOther = await Task.create({
      title: 'Design Marketing Banners',
      description: 'Create banners in Figma',
      assignedTo: otherEmployee._id,
      projectId: projOther._id,
      status: 'Pending',
      priority: 'Medium',
      dueDate: new Date(Date.now() + 86400000 * 2),
      completionPercentage: 0,
    });

    // Generate JWT tokens
    const createToken = (user) =>
      jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'test_jwt_secret_rbac_2026', {
        expiresIn: '1d',
      });

    const adminToken = createToken(adminUser);
    const managerToken = createToken(managerUser);
    const employeeToken = createToken(employeeUser);

    const adminHeaders = { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` };
    const managerHeaders = { 'Content-Type': 'application/json', Authorization: `Bearer ${managerToken}` };
    const employeeHeaders = { 'Content-Type': 'application/json', Authorization: `Bearer ${employeeToken}` };

    // ========================================================
    // TEST SECTION 1: UNAUTHENTICATED ACCESS
    // ========================================================
    console.log(`\n${colors.yellow}1. Unauthenticated Access Protection (401 Unauthorized)${colors.reset}`);

    const unauthGetTasks = await fetch(`${baseUrl}/api/tasks`);
    assert(unauthGetTasks.status === 401, 'GET /api/tasks without token returns 401 Unauthorized');

    const unauthGetProjects = await fetch(`${baseUrl}/api/projects`);
    assert(unauthGetProjects.status === 401, 'GET /api/projects without token returns 401 Unauthorized');

    const unauthGetEmployees = await fetch(`${baseUrl}/api/employees`);
    assert(unauthGetEmployees.status === 401, 'GET /api/employees without token returns 401 Unauthorized');

    const unauthCreateTask = await fetch(`${baseUrl}/api/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Hacked Task' }),
    });
    assert(unauthCreateTask.status === 401, 'POST /api/tasks without token returns 401 Unauthorized');

    // ========================================================
    // TEST SECTION 2: EMPLOYEE ROLE BOUNDARIES
    // ========================================================
    console.log(`\n${colors.yellow}2. Employee Role Permission Boundaries (403 Forbidden & Scoped Access)${colors.reset}`);

    // A. Employee cannot create employee
    const empCreateEmp = await fetch(`${baseUrl}/api/employees`, {
      method: 'POST',
      headers: employeeHeaders,
      body: JSON.stringify({ name: 'Fake Emp', email: 'fake@company.com', department: 'HR' }),
    });
    assert(empCreateEmp.status === 403, 'POST /api/employees by EMPLOYEE returns 403 Forbidden');

    // B. Employee cannot delete employee
    const empDeleteEmp = await fetch(`${baseUrl}/api/employees/${otherEmployee._id}`, {
      method: 'DELETE',
      headers: employeeHeaders,
    });
    assert(empDeleteEmp.status === 403, 'DELETE /api/employees/:id by EMPLOYEE returns 403 Forbidden');

    // C. Employee cannot create project
    const empCreateProj = await fetch(`${baseUrl}/api/projects`, {
      method: 'POST',
      headers: employeeHeaders,
      body: JSON.stringify({ name: 'Unauthorized Project' }),
    });
    assert(empCreateProj.status === 403, 'POST /api/projects by EMPLOYEE returns 403 Forbidden');

    // D. Employee cannot delete project
    const empDeleteProj = await fetch(`${baseUrl}/api/projects/${projRahul._id}`, {
      method: 'DELETE',
      headers: employeeHeaders,
    });
    assert(empDeleteProj.status === 403, 'DELETE /api/projects/:id by EMPLOYEE returns 403 Forbidden');

    // E. Employee cannot create task
    const empCreateTask = await fetch(`${baseUrl}/api/tasks`, {
      method: 'POST',
      headers: employeeHeaders,
      body: JSON.stringify({ title: 'Unauthorized Task' }),
    });
    assert(empCreateTask.status === 403, 'POST /api/tasks by EMPLOYEE returns 403 Forbidden');

    // F. Employee cannot delete task
    const empDeleteTask = await fetch(`${baseUrl}/api/tasks/${taskRahul._id}`, {
      method: 'DELETE',
      headers: employeeHeaders,
    });
    assert(empDeleteTask.status === 403, 'DELETE /api/tasks/:id by EMPLOYEE returns 403 Forbidden');

    // G. Employee cannot update someone else's task
    const empUpdateOtherTask = await fetch(`${baseUrl}/api/tasks/${taskOther._id}`, {
      method: 'PUT',
      headers: employeeHeaders,
      body: JSON.stringify({ status: 'Completed' }),
    });
    assert(empUpdateOtherTask.status === 403, 'PUT /api/tasks/:id on unassigned task by EMPLOYEE returns 403 Forbidden');

    // H. Employee cannot modify title or reassign assignedTo on own task
    const empReassignOwnTask = await fetch(`${baseUrl}/api/tasks/${taskRahul._id}`, {
      method: 'PUT',
      headers: employeeHeaders,
      body: JSON.stringify({ assignedTo: otherEmployee._id }),
    });
    assert(empReassignOwnTask.status === 403, 'PUT /api/tasks/:id reassigning employee by EMPLOYEE returns 403 Forbidden');

    // I. Employee CAN update status & progress of own task
    const empUpdateOwnStatus = await fetch(`${baseUrl}/api/tasks/${taskRahul._id}`, {
      method: 'PUT',
      headers: employeeHeaders,
      body: JSON.stringify({ status: 'Completed', completionPercentage: 100 }),
    });
    const empUpdateData = await empUpdateOwnStatus.json();
    assert(empUpdateOwnStatus.status === 200, 'PUT /api/tasks/:id status update on own task by EMPLOYEE returns 200 OK');
    assert(empUpdateData.data.status === 'Completed', 'Task status was updated to Completed by employee');

    // J. Scoped GET tasks: employee only receives tasks assigned to them
    const empGetTasks = await fetch(`${baseUrl}/api/tasks`, { headers: employeeHeaders });
    const empTasksData = await empGetTasks.json();
    assert(empGetTasks.status === 200, 'GET /api/tasks returns 200 OK for employee');
    assert(
      empTasksData.data.length === 1 && empTasksData.data[0]._id === taskRahul._id.toString(),
      'GET /api/tasks filters results strictly to employee assigned tasks'
    );

    // K. Scoped GET projects: employee only receives projects assigned to them
    const empGetProjects = await fetch(`${baseUrl}/api/projects`, { headers: employeeHeaders });
    const empProjectsData = await empGetProjects.json();
    assert(empGetProjects.status === 200, 'GET /api/projects returns 200 OK for employee');
    assert(
      empProjectsData.data.length === 1 && empProjectsData.data[0]._id === projRahul._id.toString(),
      'GET /api/projects filters results strictly to projects assigned to employee'
    );

    // L. Scoped Dashboard Stats for Employee
    const empDashStats = await fetch(`${baseUrl}/api/dashboard/stats`, { headers: employeeHeaders });
    const empDashData = await empDashStats.json();
    assert(empDashStats.status === 200, 'GET /api/dashboard/stats returns 200 OK for employee');
    assert(empDashData.data.role === 'employee', 'Dashboard stats identifies role as "employee"');
    assert(empDashData.data.kpis.totalTasks === 1, 'Employee KPI totalTasks reflects assigned tasks count (1)');
    assert(empDashData.data.kpis.completedTasks === 1, 'Employee KPI completedTasks reflects personal completed tasks (1)');

    // ========================================================
    // TEST SECTION 3: PROJECT MANAGER ROLE BOUNDARIES
    // ========================================================
    console.log(`\n${colors.yellow}3. Project Manager Role Boundaries (Project & Task Management)${colors.reset}`);

    // A. Manager CAN create project
    const mgrCreateProj = await fetch(`${baseUrl}/api/projects`, {
      method: 'POST',
      headers: managerHeaders,
      body: JSON.stringify({
        name: 'Manager Created Project',
        description: 'New initiative by project manager',
        status: 'Active',
      }),
    });
    const mgrProjData = await mgrCreateProj.json();
    assert(mgrCreateProj.status === 201, 'POST /api/projects by PROJECT_MANAGER returns 201 Created');
    const mgrProjId = mgrProjData.data._id;

    // B. Manager CAN update project
    const mgrUpdateProj = await fetch(`${baseUrl}/api/projects/${mgrProjId}`, {
      method: 'PUT',
      headers: managerHeaders,
      body: JSON.stringify({ description: 'Updated scope' }),
    });
    assert(mgrUpdateProj.status === 200, 'PUT /api/projects/:id by PROJECT_MANAGER returns 200 OK');

    // C. Manager CANNOT delete project (ADMIN only)
    const mgrDeleteProj = await fetch(`${baseUrl}/api/projects/${mgrProjId}`, {
      method: 'DELETE',
      headers: managerHeaders,
    });
    assert(mgrDeleteProj.status === 403, 'DELETE /api/projects/:id by PROJECT_MANAGER returns 403 Forbidden');

    // D. Manager CANNOT create, edit, or delete employee (ADMIN only)
    const mgrCreateEmp = await fetch(`${baseUrl}/api/employees`, {
      method: 'POST',
      headers: managerHeaders,
      body: JSON.stringify({ name: 'Manager New Emp', email: 'mgrnew@company.com', department: 'IT' }),
    });
    assert(mgrCreateEmp.status === 403, 'POST /api/employees by PROJECT_MANAGER returns 403 Forbidden');

    const mgrDeleteEmp = await fetch(`${baseUrl}/api/employees/${otherEmployee._id}`, {
      method: 'DELETE',
      headers: managerHeaders,
    });
    assert(mgrDeleteEmp.status === 403, 'DELETE /api/employees/:id by PROJECT_MANAGER returns 403 Forbidden');

    // E. Manager CAN create tasks
    const mgrCreateTask = await fetch(`${baseUrl}/api/tasks`, {
      method: 'POST',
      headers: managerHeaders,
      body: JSON.stringify({
        title: 'Manager Assigned Task',
        description: 'Task created by manager',
        assignedTo: rahulEmployee._id,
        projectId: mgrProjId,
        priority: 'High',
        status: 'Pending',
        dueDate: new Date(Date.now() + 86400000),
      }),
    });
    const mgrTaskData = await mgrCreateTask.json();
    assert(mgrCreateTask.status === 201, 'POST /api/tasks by PROJECT_MANAGER returns 201 Created');
    const mgrTaskId = mgrTaskData.data._id;

    // F. Manager CAN update task (including title and reassignment)
    const mgrUpdateTask = await fetch(`${baseUrl}/api/tasks/${mgrTaskId}`, {
      method: 'PUT',
      headers: managerHeaders,
      body: JSON.stringify({ title: 'Manager Updated Task Title' }),
    });
    assert(mgrUpdateTask.status === 200, 'PUT /api/tasks/:id by PROJECT_MANAGER returns 200 OK');

    // G. Manager CAN delete task
    const mgrDeleteTask = await fetch(`${baseUrl}/api/tasks/${mgrTaskId}`, {
      method: 'DELETE',
      headers: managerHeaders,
    });
    assert(mgrDeleteTask.status === 200, 'DELETE /api/tasks/:id by PROJECT_MANAGER returns 200 OK');

    // ========================================================
    // TEST SECTION 4: ADMIN ROLE FULL PERMISSIONS
    // ========================================================
    console.log(`\n${colors.yellow}4. Admin Role Authority (Full CRUD Operations)${colors.reset}`);

    // A. Admin CAN create employee
    const adminCreateEmp = await fetch(`${baseUrl}/api/employees`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({
        name: 'New Hired Engineer',
        email: 'engineer@company.com',
        department: 'Engineering',
        role: 'Senior Engineer',
      }),
    });
    const adminEmpData = await adminCreateEmp.json();
    assert(adminCreateEmp.status === 201, 'POST /api/employees by ADMIN returns 201 Created');
    const newEmpId = adminEmpData.data._id;

    // B. Admin CAN update employee
    const adminUpdateEmp = await fetch(`${baseUrl}/api/employees/${newEmpId}`, {
      method: 'PUT',
      headers: adminHeaders,
      body: JSON.stringify({ role: 'Lead Architect' }),
    });
    assert(adminUpdateEmp.status === 200, 'PUT /api/employees/:id by ADMIN returns 200 OK');

    // C. Admin CAN delete employee
    const adminDeleteEmp = await fetch(`${baseUrl}/api/employees/${newEmpId}`, {
      method: 'DELETE',
      headers: adminHeaders,
    });
    assert(adminDeleteEmp.status === 200, 'DELETE /api/employees/:id by ADMIN returns 200 OK');

    // D. Admin CAN delete project
    const adminDeleteProj = await fetch(`${baseUrl}/api/projects/${mgrProjId}`, {
      method: 'DELETE',
      headers: adminHeaders,
    });
    assert(adminDeleteProj.status === 200, 'DELETE /api/projects/:id by ADMIN returns 200 OK');

    // E. Admin full dashboard stats
    const adminDashStats = await fetch(`${baseUrl}/api/dashboard/stats`, { headers: adminHeaders });
    const adminDashData = await adminDashStats.json();
    assert(adminDashStats.status === 200, 'GET /api/dashboard/stats returns 200 OK for ADMIN');
    assert(adminDashData.data.role === 'admin', 'Dashboard stats reports role as "admin"');
    assert(adminDashData.data.kpis.totalEmployees >= 2, 'Admin receives organization-wide totalEmployees metric');

    console.log(`\n${colors.bold}======================================================${colors.reset}`);
    console.log(`${colors.bold}RBAC Test Summary: ${colors.green}${passed} Passed${colors.reset}, ${failed > 0 ? colors.red : colors.green}${failed} Failed${colors.reset}`);
    console.log(`${colors.bold}======================================================\n${colors.reset}`);

    await teardownServer();
    process.exit(failed > 0 ? 1 : 0);
  } catch (error) {
    console.error('RBAC test error:', error);
    await teardownServer();
    process.exit(1);
  }
};

runRBACTests();

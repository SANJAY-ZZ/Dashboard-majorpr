/**
 * Comprehensive Backend API Test Suite for MODULE 5 — DASHBOARD
 */
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const express = require('express');
const cors = require('cors');

const dashboardRoutes = require('../routes/dashboardRoutes');
const taskRoutes = require('../routes/taskRoutes');
const employeeRoutes = require('../routes/employeeRoutes');
const projectRoutes = require('../routes/projectRoutes');
const authRoutes = require('../routes/authRoutes');
const { notFound, errorHandler } = require('../middleware/errorMiddleware');

const Employee = require('../models/Employee');
const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');

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

const setupTestServer = async () => {
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test_jwt_secret_12345';

  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);

  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'healthy', module: 'Module 5 - Dashboard' });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/employees', employeeRoutes);
  app.use('/api/projects', projectRoutes);
  app.use('/api/tasks', taskRoutes);
  app.use('/api/dashboard', dashboardRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return new Promise((resolve) => {
    serverInstance = app.listen(0, () => {
      const port = serverInstance.address().port;
      baseUrl = `http://localhost:${port}`;
      console.log(`${colors.cyan}[TEST SERVER] Running on ${baseUrl} with MongoMemoryServer${colors.reset}`);
      resolve();
    });
  });
};

const teardownTestServer = async () => {
  if (serverInstance) {
    serverInstance.close();
  }
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
};

const runDashboardTests = async () => {
  console.log(`\n${colors.bold}======================================================${colors.reset}`);
  console.log(`${colors.bold}📊 RUNNING MODULE 5 — DASHBOARD BACKEND TEST SUITE 📊${colors.reset}`);
  console.log(`${colors.bold}======================================================\n${colors.reset}`);

  let passed = 0;
  let failed = 0;

  const assert = (condition, testName, details = '') => {
    if (condition) {
      console.log(`  ${colors.green}✓ PASS${colors.reset} - ${testName}`);
      passed++;
    } else {
      console.log(`  ${colors.red}✗ FAIL${colors.reset} - ${testName} ${details ? `(${details})` : ''}`);
      failed++;
    }
  };

  try {
    await setupTestServer();

    // 1. Health check
    console.log(`\n${colors.yellow}1. Service Health Check${colors.reset}`);
    const healthRes = await fetch(`${baseUrl}/api/health`);
    const healthData = await healthRes.json();
    assert(healthRes.status === 200 && healthData.status === 'healthy', 'GET /api/health responds with 200 and healthy status');

    // 2. Empty Database Check
    console.log(`\n${colors.yellow}2. Empty State Handling (GET /api/dashboard/stats)${colors.reset}`);
    const emptyStatsRes = await fetch(`${baseUrl}/api/dashboard/stats`);
    const emptyStats = await emptyStatsRes.json();
    assert(emptyStatsRes.status === 200, 'GET /api/dashboard/stats returns 200 OK on empty DB');
    assert(
      emptyStats.data.kpis.totalEmployees === 0 &&
      emptyStats.data.kpis.activeProjects === 0 &&
      emptyStats.data.kpis.pendingTasks === 0,
      'KPIs correctly report 0 when database has zero documents'
    );
    assert(Array.isArray(emptyStats.data.projectProgress), 'projectProgress returns empty array without throwing');
    assert(Array.isArray(emptyStats.data.employeeTaskStats), 'employeeTaskStats returns empty array without throwing');

    // 3. Seed Real Data for Testing
    console.log(`\n${colors.yellow}3. Seeding Realistic Data for Testing${colors.reset}`);
    const emp1 = await Employee.create({
      name: 'Rahul Sharma',
      email: 'rahul@gmail.com',
      department: 'IT',
      role: 'Frontend Developer',
      status: 'Active',
    });
    const emp2 = await Employee.create({
      name: 'Priya Das',
      email: 'priya@gmail.com',
      department: 'HR',
      role: 'HR Specialist',
      status: 'Active',
    });
    const emp3 = await Employee.create({
      name: 'Amit Roy',
      email: 'amit@gmail.com',
      department: 'Finance',
      role: 'Financial Analyst',
      status: 'Active',
    });

    const proj1 = await Project.create({
      name: 'Employee Management System',
      code: 'PROJ-EMS-01',
      description: 'Internal Management application',
      status: 'Active',
      startDate: new Date('2026-08-01'),
      endDate: new Date('2026-11-30'),
      assignedEmployees: [emp1._id, emp2._id],
    });
    const proj2 = await Project.create({
      name: 'Website Development',
      code: 'PROJ-WEB-02',
      description: 'Corporate website',
      status: 'Completed',
      startDate: new Date('2026-06-01'),
      endDate: new Date('2026-09-01'),
      assignedEmployees: [emp1._id, emp3._id],
    });

    // Create Tasks:
    // Proj1: 2 completed, 1 in progress, 1 pending (Total: 4 -> 50% completed)
    await Task.create({
      title: 'Create Login Page',
      description: 'Login form',
      assignedTo: emp1._id,
      projectId: proj1._id,
      priority: 'High',
      status: 'In Progress',
      dueDate: new Date(Date.now() + 86400000 * 3),
      completionPercentage: 50,
    });
    await Task.create({
      title: 'Design Dashboard',
      description: 'Dashboard layout',
      assignedTo: emp1._id,
      projectId: proj1._id,
      priority: 'High',
      status: 'Completed',
      dueDate: new Date(Date.now() + 86400000 * 2),
      completionPercentage: 100,
    });
    await Task.create({
      title: 'Prepare Employee Records',
      description: 'Records',
      assignedTo: emp2._id,
      projectId: proj1._id,
      priority: 'Low',
      status: 'Completed',
      dueDate: new Date(Date.now() - 86400000), // Overdue
      completionPercentage: 100,
    });
    await Task.create({
      title: 'Setup Automated Testing',
      description: 'Unit tests',
      assignedTo: emp2._id,
      projectId: proj1._id,
      priority: 'Medium',
      status: 'Pending',
      dueDate: new Date(Date.now() + 86400000 * 5),
      completionPercentage: 0,
    });

    // Proj2: 2 completed (Total: 2 -> 100% completed)
    await Task.create({
      title: 'Design Landing Page',
      description: 'Landing hero',
      assignedTo: emp1._id,
      projectId: proj2._id,
      priority: 'Medium',
      status: 'Completed',
      dueDate: new Date(Date.now() - 86400000 * 10),
      completionPercentage: 100,
    });
    await Task.create({
      title: 'SEO Audit',
      description: 'SEO tags',
      assignedTo: emp3._id,
      projectId: proj2._id,
      priority: 'Low',
      status: 'Completed',
      dueDate: new Date(Date.now() - 86400000 * 12),
      completionPercentage: 100,
    });

    assert(true, 'Test data seeded successfully (3 employees, 2 projects, 6 tasks)');

    // 4. Test Dashboard Stats
    console.log(`\n${colors.yellow}4. Dashboard Stats & KPI Calculation Accuracy${colors.reset}`);
    const statsRes = await fetch(`${baseUrl}/api/dashboard/stats`);
    const statsBody = await statsRes.json();
    assert(statsRes.status === 200, 'GET /api/dashboard/stats returns 200 OK');

    const kpis = statsBody.data.kpis;
    assert(kpis.totalEmployees === 3, `KPI Total Employees = 3 (Received: ${kpis.totalEmployees})`);
    assert(kpis.activeProjects === 1, `KPI Active Projects = 1 (Received: ${kpis.activeProjects})`);
    assert(kpis.completedProjects === 1, `KPI Completed Projects = 1 (Received: ${kpis.completedProjects})`);
    assert(kpis.pendingTasks === 1, `KPI Pending Tasks = 1 (Received: ${kpis.pendingTasks})`);
    assert(kpis.completedTasks === 4, `KPI Completed Tasks = 4 (Received: ${kpis.completedTasks})`);
    assert(kpis.inProgressTasks === 1, `KPI In Progress Tasks = 1 (Received: ${kpis.inProgressTasks})`);
    assert(kpis.totalTasks === 6, `KPI Total Tasks = 6 (Received: ${kpis.totalTasks})`);

    // 5. Test Project Progress Real Calculations
    console.log(`\n${colors.yellow}5. Real Project Progress Calculations${colors.reset}`);
    const pProgress = statsBody.data.projectProgress;
    assert(Array.isArray(pProgress) && pProgress.length === 2, 'projectProgress contains both seeded projects');

    const emsProj = pProgress.find((p) => p.name === 'Employee Management System');
    assert(Boolean(emsProj), 'EMS Project found in dashboard stats');
    assert(emsProj.totalTasks === 4, `EMS totalTasks = 4 (Received: ${emsProj.totalTasks})`);
    assert(emsProj.completedTasks === 2, `EMS completedTasks = 2 (Received: ${emsProj.completedTasks})`);
    assert(emsProj.progress === 50, `EMS calculated progress = 50% (completed 2/4 * 100) (Received: ${emsProj.progress}%)`);

    const webProj = pProgress.find((p) => p.name === 'Website Development');
    assert(Boolean(webProj), 'Website Development Project found');
    assert(webProj.progress === 100, `Website calculated progress = 100% (completed 2/2 * 100) (Received: ${webProj.progress}%)`);

    // 6. Test Employee Task Statistics Real Calculations
    console.log(`\n${colors.yellow}6. Real Employee Task Statistics Calculations${colors.reset}`);
    const empStats = statsBody.data.employeeTaskStats;
    assert(Array.isArray(empStats) && empStats.length === 3, 'employeeTaskStats contains all 3 employees');

    const rahulStats = empStats.find((e) => e.name === 'Rahul Sharma');
    assert(Boolean(rahulStats), 'Rahul Sharma found in employee statistics');
    assert(rahulStats.totalTasks === 3, `Rahul totalTasks = 3 (Received: ${rahulStats.totalTasks})`);
    assert(rahulStats.completedTasks === 2, `Rahul completedTasks = 2 (Received: ${rahulStats.completedTasks})`);
    assert(rahulStats.inProgressTasks === 1, `Rahul inProgressTasks = 1 (Received: ${rahulStats.inProgressTasks})`);
    assert(rahulStats.completionRate === 67, `Rahul completionRate = 67% (Received: ${rahulStats.completionRate}%)`);

    const priyaStats = empStats.find((e) => e.name === 'Priya Das');
    assert(priyaStats.totalTasks === 2 && priyaStats.completedTasks === 1 && priyaStats.pendingTasks === 1,
      'Priya Das task breakdown matches expected counts (1 completed, 1 pending)');

    // 7. Test 3D Project Core Graph Data Structure
    console.log(`\n${colors.yellow}7. 3D Project Core Graph Network Data${colors.reset}`);
    const graphData = statsBody.data.graphData;
    assert(Boolean(graphData) && Array.isArray(graphData.nodes) && Array.isArray(graphData.links),
      'graphData contains nodes and links arrays for 3D Project Core');

    const projectNodes = graphData.nodes.filter((n) => n.type === 'PROJECT');
    const employeeNodes = graphData.nodes.filter((n) => n.type === 'EMPLOYEE');
    const taskNodes = graphData.nodes.filter((n) => n.type === 'TASK');

    assert(projectNodes.length === 2, `Graph contains 2 project nodes (Found: ${projectNodes.length})`);
    assert(employeeNodes.length === 3, `Graph contains 3 employee nodes (Found: ${employeeNodes.length})`);
    assert(taskNodes.length > 0, `Graph contains task nodes (Found: ${taskNodes.length})`);
    assert(graphData.links.length > 0, `Graph contains relationship links (Found: ${graphData.links.length})`);

    // 8. Test Recent Tasks Data
    console.log(`\n${colors.yellow}8. Recent / Priority Tasks Overview${colors.reset}`);
    const recentTasks = statsBody.data.recentTasks;
    assert(Array.isArray(recentTasks) && recentTasks.length === 6, 'recentTasks returns populated tasks array');
    assert(recentTasks[0].assignedTo && recentTasks[0].projectId, 'Recent task correctly populates employee and project refs');

    console.log(`\n${colors.bold}======================================================${colors.reset}`);
    console.log(`${colors.bold}Test Results: ${colors.green}${passed} Passed${colors.reset}, ${failed > 0 ? colors.red : colors.green}${failed} Failed${colors.reset}`);
    console.log(`${colors.bold}======================================================\n${colors.reset}`);

    if (failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error(`\n${colors.red}Test failed with unexpected error:${colors.reset}`, error);
    process.exit(1);
  } finally {
    await teardownTestServer();
  }
};

runDashboardTests();

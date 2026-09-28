/**
 * Automated Test Suite for Task Management Module
 */
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const express = require('express');
const cors = require('cors');
const taskRoutes = require('../routes/taskRoutes');
const { errorHandler, notFound } = require('../middleware/errorMiddleware');
const Task = require('../models/Task');
const Employee = require('../models/Employee');
const Project = require('../models/Project');
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
    res.status(200).json({ status: 'healthy', module: 'Task Management' });
  });

  app.use('/api/tasks', taskRoutes);
  app.use(notFound);
  app.use(errorHandler);

  return new Promise((resolve) => {
    serverInstance = app.listen(0, () => {
      const port = serverInstance.address().port;
      baseUrl = `http://localhost:${port}`;
      console.log(`${colors.cyan}[TASK TEST SERVER] Running on ${baseUrl} with MongoMemoryServer${colors.reset}`);
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

const runTests = async () => {
  console.log(`\n${colors.bold}======================================================${colors.reset}`);
  console.log(`${colors.bold}🧪 RUNNING TASK MANAGEMENT MODULE INTEGRATION TESTS 🧪${colors.reset}`);
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

    const emp = await Employee.create({
      name: 'Alex Johnson',
      email: 'alex@company.com',
      department: 'Engineering',
      role: 'Lead Architect',
    });

    const proj = await Project.create({
      name: 'Employee Portal 2.0',
      code: 'PROJ-EMP-01',
      description: 'Internal employee system',
      status: 'Active',
    });

    const sampleEmployeeId1 = emp._id.toString();
    const sampleProjectId1 = proj._id.toString();

    const adminUser = await User.create({
      name: 'Test Admin',
      email: 'admin.test@company.com',
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

    // 1. Health check
    console.log(`\n${colors.yellow}1. Server Health Check${colors.reset}`);
    const healthRes = await fetch(`${baseUrl}/api/health`);
    const healthData = await healthRes.json();
    assert(healthRes.status === 200 && healthData.status === 'healthy', 'GET /api/health returns 200 OK & healthy status');

    // 2. Task Validation on Creation
    console.log(`\n${colors.yellow}2. Task Validation on Creation${colors.reset}`);
    const emptyTaskRes = await fetch(`${baseUrl}/api/tasks`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({}),
    });
    assert(emptyTaskRes.status === 400, 'POST /api/tasks with empty body returns 400 Bad Request');

    const invalidObjectIdRes = await fetch(`${baseUrl}/api/tasks`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        title: 'Valid Title',
        assignedTo: 'invalid-id-123',
        projectId: sampleProjectId1,
        dueDate: new Date().toISOString(),
      }),
    });
    assert(invalidObjectIdRes.status === 400, 'POST /api/tasks with invalid assignedTo ObjectId returns 400');

    // 3. Create Tasks
    console.log(`\n${colors.yellow}3. Task Creation (POST /api/tasks)${colors.reset}`);
    const task1Payload = {
      title: 'Implement Database Connection & Mongoose Schemas',
      description: 'Set up MongoDB connection and Task model.',
      assignedTo: sampleEmployeeId1,
      projectId: sampleProjectId1,
      priority: 'High',
      status: 'Pending',
      dueDate: new Date(Date.now() + 86400000 * 3).toISOString(),
      completionPercentage: 20,
    };
    const createRes1 = await fetch(`${baseUrl}/api/tasks`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(task1Payload),
    });
    const createData1 = await createRes1.json();
    assert(createRes1.status === 201 && createData1.data._id, 'POST /api/tasks successfully creates Task 1');
    const createdId1 = createData1.data._id;

    const task2Payload = {
      title: 'Auto-Complete Status Sync Test',
      description: 'Should synchronize status to Completed',
      assignedTo: sampleEmployeeId1,
      projectId: sampleProjectId1,
      priority: 'Low',
      status: 'Completed',
      dueDate: new Date(Date.now() + 86400000 * 2).toISOString(),
      completionPercentage: 50,
    };
    const createRes2 = await fetch(`${baseUrl}/api/tasks`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(task2Payload),
    });
    const createData2 = await createRes2.json();
    assert(
      createRes2.status === 201 && createData2.data.completionPercentage === 100,
      'POST /api/tasks automatically sets completionPercentage = 100 when status is Completed'
    );

    // 4. Get Tasks & Summary Metrics
    console.log(`\n${colors.yellow}4. Task Metrics & Retrieval${colors.reset}`);
    const getAllRes = await fetch(`${baseUrl}/api/tasks`, {
      headers: authHeaders,
    });
    const getAllData = await getAllRes.json();
    assert(getAllRes.status === 200 && getAllData.count === 2, `GET /api/tasks returns all tasks (count=${getAllData.count})`);

    const metricsRes = await fetch(`${baseUrl}/api/tasks/metrics/summary`, {
      headers: authHeaders,
    });
    const metricsData = await metricsRes.json();
    assert(
      metricsRes.status === 200 &&
      metricsData.data.total === 2 &&
      metricsData.data.completed === 1 &&
      metricsData.data.pending === 1,
      'GET /api/tasks/metrics/summary calculates accurate metrics'
    );

    // 5. Update Task
    console.log(`\n${colors.yellow}5. Update Task (PUT /api/tasks/:id)${colors.reset}`);
    const updateRes = await fetch(`${baseUrl}/api/tasks/${createdId1}`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({
        status: 'Completed',
      }),
    });
    const updateData = await updateRes.json();
    assert(
      updateRes.status === 200 && updateData.data.completionPercentage === 100,
      'PUT /api/tasks/:id auto-sets completionPercentage to 100 on Completed status'
    );

    console.log(`\n${colors.bold}======================================================${colors.reset}`);
    console.log(`${colors.bold}Test Results: ${colors.green}${passed} Passed${colors.reset}, ${failed > 0 ? colors.red : colors.green}${failed} Failed${colors.reset}`);
    console.log(`${colors.bold}======================================================\n${colors.reset}`);

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error(`\n${colors.red}Test execution failed with error:${colors.reset}`, err);
    process.exit(1);
  } finally {
    await teardownTestServer();
  }
};

runTests();

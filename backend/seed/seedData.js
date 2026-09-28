const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const { connectDB, disconnectDB } = require('../config/db');

const Employee = require('../models/Employee');
const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');

dotenv.config();

const seedDatabase = async (shouldDisconnect = true) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      console.log('[Seed] Connecting to MongoDB...');
      await connectDB();
    }

    console.log('[Seed] Clearing existing collections...');
    await Promise.all([
      Employee.deleteMany({}),
      Project.deleteMany({}),
      Task.deleteMany({}),
      User.deleteMany({}),
    ]);

    console.log('[Seed] Inserting users...');
    const hashedAdminPassword = await bcrypt.hash('Admin@12345', 12);
    const hashedManagerPassword = await bcrypt.hash('Manager@12345', 12);
    const hashedEmployeePassword = await bcrypt.hash('Rahul@12345', 12);

    const users = await User.insertMany([
      {
        name: 'Sanjay Kumar (Admin)',
        email: 'admin@company.com',
        password: hashedAdminPassword,
        role: 'ADMIN',
      },
      {
        name: 'Alex Johnson (PM)',
        email: 'manager@company.com',
        password: hashedManagerPassword,
        role: 'PROJECT_MANAGER',
      },
      {
        name: 'Rahul Sharma',
        email: 'rahul@gmail.com',
        password: hashedEmployeePassword,
        role: 'EMPLOYEE',
      },
    ]);
    console.log(`[Seed] Created ${users.length} users.`);

    console.log('[Seed] Inserting employees...');
    const employees = await Employee.insertMany([
      {
        name: 'Rahul Sharma',
        email: 'rahul@gmail.com',
        department: 'IT',
        role: 'Frontend Developer',
        phone: '+91 98765 43210',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        status: 'Active',
      },
      {
        name: 'Priya Das',
        email: 'priya@gmail.com',
        department: 'HR',
        role: 'HR Specialist',
        phone: '+91 98765 43211',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
        status: 'Active',
      },
      {
        name: 'Amit Roy',
        email: 'amit@gmail.com',
        department: 'Finance',
        role: 'Financial Analyst',
        phone: '+91 98765 43212',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        status: 'Active',
      },
      {
        name: 'Sneha Sen',
        email: 'sneha@gmail.com',
        department: 'IT',
        role: 'Full Stack Engineer',
        phone: '+91 98765 43213',
        avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
        status: 'Active',
      },
      {
        name: 'Alex Johnson',
        email: 'alex@company.com',
        department: 'Engineering',
        role: 'Lead Architect',
        phone: '+91 98765 43214',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
        status: 'Active',
      },
      {
        name: 'Samantha Miller',
        email: 'samantha@company.com',
        department: 'Engineering',
        role: 'Backend Architect',
        phone: '+91 98765 43215',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
        status: 'Active',
      },
    ]);
    console.log(`[Seed] Created ${employees.length} employees.`);

    const [rahul, priya, amit, sneha, alex, samantha] = employees;

    console.log('[Seed] Inserting projects...');
    const projects = await Project.insertMany([
      {
        name: 'Employee Management System',
        code: 'PROJ-EMS-01',
        description: 'Comprehensive enterprise portal for employee lifecycle, directory, and performance management.',
        status: 'Active',
        startDate: new Date('2026-08-01'),
        endDate: new Date('2026-11-30'),
        assignedEmployees: [rahul._id, sneha._id, samantha._id],
        progress: 75,
      },
      {
        name: 'Course Management System',
        code: 'PROJ-CMS-02',
        description: 'Scalable educational platform offering modular courses, assignments, and automated grading.',
        status: 'Active',
        startDate: new Date('2026-08-15'),
        endDate: new Date('2026-12-15'),
        assignedEmployees: [priya._id, alex._id],
        progress: 40,
      },
      {
        name: 'Website Development',
        code: 'PROJ-WEB-03',
        description: 'High-conversion public corporate website with modern branding and interactive design.',
        status: 'Completed',
        startDate: new Date('2026-06-01'),
        endDate: new Date('2026-09-01'),
        assignedEmployees: [rahul._id, amit._id],
        progress: 100,
      },
      {
        name: 'Cloud Infrastructure Migration',
        code: 'PROJ-OPS-04',
        description: 'Zero-downtime transition to automated Kubernetes clusters with Terraform IaC.',
        status: 'Active',
        startDate: new Date('2026-09-01'),
        endDate: new Date('2026-12-31'),
        assignedEmployees: [samantha._id, alex._id],
        progress: 50,
      },
    ]);
    console.log(`[Seed] Created ${projects.length} projects.`);

    const [pEMS, pCMS, pWeb, pCloud] = projects;

    console.log('[Seed] Inserting tasks...');
    const now = Date.now();
    const oneDay = 86400000;

    const tasks = await Task.insertMany([
      // Tasks for Employee Management System (4 tasks: 3 completed, 1 in progress -> 75% progress)
      {
        title: 'Create Login Page & Auth Form',
        description: 'Build responsive glassmorphic login interface with JWT authorization flow.',
        assignedTo: rahul._id,
        projectId: pEMS._id,
        priority: 'High',
        status: 'In Progress',
        dueDate: new Date(now + oneDay * 4),
        completionPercentage: 60,
      },
      {
        title: 'Design Dashboard Visual Architecture',
        description: 'Architect KPI grid, interactive charts, and 3D Project Core visualization.',
        assignedTo: sneha._id,
        projectId: pEMS._id,
        priority: 'High',
        status: 'Completed',
        dueDate: new Date(now - oneDay * 2),
        completionPercentage: 100,
      },
      {
        title: 'Prepare Employee Database Records',
        description: 'Structure employee profiles, department mapping, and contact cards.',
        assignedTo: priya._id,
        projectId: pEMS._id,
        priority: 'Medium',
        status: 'Completed',
        dueDate: new Date(now - oneDay * 5),
        completionPercentage: 100,
      },
      {
        title: 'Implement JWT Authentication & Roles',
        description: 'Express auth router with bcrypt password hashing and token expiry.',
        assignedTo: samantha._id,
        projectId: pEMS._id,
        priority: 'High',
        status: 'Completed',
        dueDate: new Date(now - oneDay * 8),
        completionPercentage: 100,
      },

      // Tasks for Course Management System (3 tasks: 1 completed, 1 in progress, 1 pending)
      {
        title: 'Student Enrollment Portal API',
        description: 'Build REST endpoints for student self-registration and course subscription.',
        assignedTo: alex._id,
        projectId: pCMS._id,
        priority: 'High',
        status: 'In Progress',
        dueDate: new Date(now + oneDay * 7),
        completionPercentage: 50,
      },
      {
        title: 'Automate Gradebook Processing',
        description: 'Batch processing worker for student quiz scoring and GPA calculations.',
        assignedTo: rahul._id,
        projectId: pCMS._id,
        priority: 'Medium',
        status: 'Pending',
        dueDate: new Date(now + oneDay * 12),
        completionPercentage: 0,
      },
      {
        title: 'Curriculum Outline & Syllabus Ingestion',
        description: 'Parse PDF and Markdown syllabus files into structured learning units.',
        assignedTo: priya._id,
        projectId: pCMS._id,
        priority: 'Low',
        status: 'Completed',
        dueDate: new Date(now - oneDay * 3),
        completionPercentage: 100,
      },

      // Tasks for Website Development (2 tasks: 2 completed -> 100% progress)
      {
        title: 'Design Corporate Landing Page',
        description: 'Responsive high-converting hero layout with dark mode palette.',
        assignedTo: rahul._id,
        projectId: pWeb._id,
        priority: 'Medium',
        status: 'Completed',
        dueDate: new Date(now - oneDay * 25),
        completionPercentage: 100,
      },
      {
        title: 'SEO and Core Web Vitals Optimization',
        description: 'Lighthouse score tuning, metadata tags, and image compression.',
        assignedTo: amit._id,
        projectId: pWeb._id,
        priority: 'Low',
        status: 'Completed',
        dueDate: new Date(now - oneDay * 20),
        completionPercentage: 100,
      },

      // Tasks for Cloud Infrastructure Migration (3 tasks: 1 completed, 1 in progress, 1 pending)
      {
        title: 'Database Migration to MongoDB Atlas',
        description: 'Live sync data pipeline with automatic failover and backup snapshots.',
        assignedTo: samantha._id,
        projectId: pCloud._id,
        priority: 'High',
        status: 'Completed',
        dueDate: new Date(now - oneDay * 4),
        completionPercentage: 100,
      },
      {
        title: 'Kubernetes Helm Chart Deployments',
        description: 'Configure pod auto-scaling, ingress rules, and TLS termination.',
        assignedTo: alex._id,
        projectId: pCloud._id,
        priority: 'High',
        status: 'In Progress',
        dueDate: new Date(now + oneDay * 5),
        completionPercentage: 65,
      },
      {
        title: 'Centralized Logging & Grafana Telemetry',
        description: 'Deploy Prometheus metrics exporter and alertmanager notifications.',
        assignedTo: sneha._id,
        projectId: pCloud._id,
        priority: 'Medium',
        status: 'Pending',
        dueDate: new Date(now + oneDay * 14),
        completionPercentage: 0,
      },
    ]);
    console.log(`[Seed] Created ${tasks.length} tasks.`);

    console.log('\n======================================================');
    console.log('✅ DATABASE SEEDING COMPLETED SUCCESSFULLY!');
    console.log('Summary:');
    console.log(`- Employees: ${employees.length}`);
    console.log(`- Projects:  ${projects.length}`);
    console.log(`- Tasks:     ${tasks.length}`);
    console.log(`- Users:     ${users.length}`);
    console.log('Test Login Credentials:');
    console.log('  Admin:   admin@company.com   / Admin@12345');
    console.log('  Manager: manager@company.com / Manager@12345');
    console.log('  User:    rahul@gmail.com     / Rahul@12345');
    console.log('======================================================\n');
  } catch (error) {
    console.error('[Seed] Error during seeding:', error);
    if (shouldDisconnect) process.exit(1);
    throw error;
  } finally {
    if (shouldDisconnect) {
      await disconnectDB();
    }
  }
};

if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;

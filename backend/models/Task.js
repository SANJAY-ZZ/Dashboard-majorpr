const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters long'],
      maxlength: [120, 'Title cannot exceed 120 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
      default: '',
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: [true, 'Assigned employee ID (assignedTo) is required'],
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project ID (projectId) is required'],
    },
    priority: {
      type: String,
      enum: {
        values: ['Low', 'Medium', 'High'],
        message: 'Priority must be Low, Medium, or High',
      },
      default: 'Medium',
    },
    status: {
      type: String,
      enum: {
        values: ['Pending', 'In Progress', 'Completed'],
        message: 'Status must be Pending, In Progress, or Completed',
      },
      default: 'Pending',
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required'],
    },
    completionPercentage: {
      type: Number,
      min: [0, 'Completion percentage cannot be less than 0'],
      max: [100, 'Completion percentage cannot exceed 100'],
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual getter and setter for employeeId <-> assignedTo interoperability
TaskSchema.virtual('employeeId')
  .get(function () {
    return this.assignedTo;
  })
  .set(function (val) {
    this.assignedTo = val;
  });

// Pre-save hook to ensure status and completionPercentage consistency
TaskSchema.pre('save', function (next) {
  if (this.status === 'Completed' && this.completionPercentage !== 100) {
    this.completionPercentage = 100;
  } else if (this.completionPercentage === 100 && this.status !== 'Completed') {
    this.status = 'Completed';
  }
  next();
});

// Pre-update hook for findOneAndUpdate
TaskSchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate();
  if (!update) return next();

  if (update.status === 'Completed') {
    update.completionPercentage = 100;
  } else if (update.completionPercentage === 100) {
    update.status = 'Completed';
  }

  next();
});

module.exports = mongoose.model('Task', TaskSchema);

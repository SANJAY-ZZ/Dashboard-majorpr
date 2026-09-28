import api from './api';

export const getDashboardStats = async () => {
  return await api.get('/dashboard/stats');
};

export const getEmployees = async (params = {}) => {
  return await api.get('/employees', { params });
};

export const getProjects = async (params = {}) => {
  return await api.get('/projects', { params });
};

export const getTasks = async (params = {}) => {
  return await api.get('/tasks', { params });
};

export const updateTaskStatus = async (taskId, status, completionPercentage) => {
  return await api.put(`/tasks/${taskId}`, { status, completionPercentage });
};

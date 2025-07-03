import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
export const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add token to requests if it exists
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Auth services
export const authService = {
    login: async (email, password) => {
        try {
            const response = await api.post('/api/auth/login', { email, password });
            if (response.data.token) {
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('userInfo', JSON.stringify(response.data.user));
            }
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'An error occurred' };
        }
    },

    register: async (userData) => {
        try {
            const response = await api.post('/api/auth/register', userData);
            if (response.data.token) {
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('userInfo', JSON.stringify(response.data.user));
            }
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'An error occurred' };
        }
    },

    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userInfo');
    },

    verifyToken: async () => {
        try {
            const response = await api.get('/api/auth/verify-token');
            return response.data.valid;
        } catch (error) {
            throw error.response?.data || { message: 'Token verification failed' };
        }
    }
};

// Exam services
export const examService = {
    getAllExams: async () => {
        try {
            const response = await api.get('/api/exams');
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'An error occurred' };
        }
    },

    getExamById: async (id) => {
        try {
            if (!id || typeof id !== 'string') {
                throw new Error('Invalid exam ID');
            }
            const response = await api.get(`/api/exams/${id}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'An error occurred' };
        }
    },

    getAttemptById: async (attemptId) => {
        try {
            const response = await api.get(`/api/attempts/${attemptId}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'An error occurred' };
        }
    },

    submitExam: async (examData) => {
        try {
            const response = await api.post('/api/exams/submit', examData);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'An error occurred' };
        }
    },

    submitAttempt: async (attemptId, data) => {
        try {
            const response = await api.post(`/api/attempts/${attemptId}/submit`, data);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'An error occurred' };
        }
    }
};

// Subject services
export const subjectService = {
    getAllSubjects: async () => {
        try {
            const response = await api.get('/api/subjects');
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'An error occurred' };
        }
    }
};

// Attempt services
export const attemptService = {
    createAttempt: async (attemptData) => {
        try {
            const response = await api.post('/api/attempts', attemptData);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'An error occurred' };
        }
    },

    getAttemptsByUser: async (userId) => {
        try {
            const response = await api.get(`/api/attempts/user/${userId}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'An error occurred' };
        }
    },

    getAttemptsByExam: async (examId) => {
        try {
            const response = await api.get(`/api/attempts/exam/${examId}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'An error occurred' };
        }
    },

    deleteAttempt: async (attemptId) => {
        try {
            const response = await api.delete(`/api/attempts/${attemptId}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to delete attempt' };
        }
    },

    saveProgress: async (attemptId, progressData) => {
        try {
            const response = await api.post(`/api/attempts/${attemptId}/progress`, progressData);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'An error occurred' };
        }
    },

    updateAttempt: async (attemptId, data) => {
        try {
            const response = await api.put(`/api/attempts/${attemptId}`, data);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    submitAttempt: async (attemptId, data) => {
        try {
            const tokenValid = await authService.verifyToken();
            if (!tokenValid) {
                throw new Error('Invalid token');
            }
            const response = await api.post(`/api/attempts/${attemptId}/submit`, data);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'An error occurred' };
        }
    },

    getAttemptById: async (attemptId) => {
        try {
            const response = await api.get(`/api/attempts/${attemptId}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to fetch attempt details' };
        }
    },

    startAttempt: async (examId) => {
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
            if (!userInfo || !userInfo._id) {
                throw new Error('User not authenticated');
            }

            // Get exam details
            const exam = await examService.getExamById(examId);
            if (!exam || !exam.isActive) {
                throw new Error('Exam not available');
            }

            // Get user's attempts for this exam
            const examAttempts = await attemptService.getAttemptsByExam(examId);

            // Check for existing in-progress attempt
            const existingAttempt = examAttempts.find(
                a => a.user && 
                     a.user._id === userInfo._id && 
                     a.status === 'in_progress'
            );

            // Check if user has reached max attempts
            if (exam.maxAttempts && examAttempts.length >= exam.maxAttempts) {
                throw new Error(`Max attempts (${exam.maxAttempts}) reached for this exam`);
            }

            // Start new attempt with proper data structure
            const attemptData = {
                user: userInfo._id,
                exam: examId,
                startTime: new Date(),
                endTime: new Date(new Date().getTime() + (exam.duration * 60 * 1000)),
                status: 'in_progress'
            };

            const response = await api.post(`/api/attempts`, attemptData);
            return response.data;
        } catch (error) {
            console.error('Error starting attempt:', error);
            
            // Handle specific errors
            if (error.response && error.response.data) {
                if (error.response.data.message.includes('E11000 duplicate key error')) {
                    throw new Error('You already have an attempt in progress for this exam. Please try again later.');
                }
                throw new Error(error.response.data.message || 'Failed to start exam attempt');
            }
            
            throw error;
        }
    }
};

// User services
export const userService = {
    saveFaceDescriptor: async (faceDescriptor) => {
        try {
            const response = await api.post('/api/users/face', { faceDescriptor });
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to save face descriptor' };
        }
    },
    // Optionally, add a method to clear all face descriptors (admin only)
    clearAllFaceDescriptors: async () => {
        try {
            const response = await api.delete('/api/users/face/clear/all');
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to clear face descriptors' };
        }
    },
    getProfile: async () => {
        try {
            const response = await api.get('/api/users/profile');
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to fetch user profile' };
        }
    }
}; 
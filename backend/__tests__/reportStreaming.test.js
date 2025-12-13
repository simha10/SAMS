const request = require('supertest');
const express = require('express');
const { streamReport } = require('../src/controllers/reportController');

// Create a mock app for testing
const app = express();
app.use(express.json());

// Mock the authentication middleware
app.use((req, res, next) => {
  req.user = {
    _id: 'mock-user-id',
    role: 'manager'
  };
  next();
});

// Mock route for testing
app.post('/api/reports/stream', streamReport);

// Mock the database models and utilities
jest.mock('../src/models/Report');
jest.mock('../src/models/Attendance');
jest.mock('../src/models/LeaveRequest');
jest.mock('../src/models/User');
jest.mock('../src/utils/excel');
jest.mock('../src/utils/excelStreaming');

describe('Report Streaming Endpoint', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/reports/stream', () => {
    it('should stream a CSV report successfully', async () => {
      const reportData = {
        type: 'attendance',
        format: 'csv',
        startDate: '2023-01-01',
        endDate: '2023-01-31',
        filters: {}
      };

      const response = await request(app)
        .post('/api/reports/stream')
        .send(reportData)
        .expect(200);

      expect(response.headers['content-type']).toMatch(/text\/csv/);
    });

    it('should validate request parameters', async () => {
      const invalidData = {
        type: 'invalid-type',
        format: 'csv',
        startDate: '2023-01-01',
        endDate: '2023-01-31'
      };

      const response = await request(app)
        .post('/api/reports/stream')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid request parameters');
    });

    it('should reject xlsx format', async () => {
      const reportData = {
        type: 'attendance',
        format: 'xlsx', // This should be rejected
        startDate: '2023-01-01',
        endDate: '2023-01-31'
      };

      const response = await request(app)
        .post('/api/reports/stream')
        .send(reportData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should validate date range', async () => {
      const invalidData = {
        type: 'attendance',
        format: 'csv',
        startDate: '2023-01-31',
        endDate: '2023-01-01' // End date before start date
      };

      const response = await request(app)
        .post('/api/reports/stream')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid date range');
    });

    it('should reject overly large date ranges', async () => {
      // Create a date range larger than 365 days
      const reportData = {
        type: 'attendance',
        format: 'csv',
        startDate: '2020-01-01',
        endDate: '2022-01-01' // More than 365 days
      };

      const response = await request(app)
        .post('/api/reports/stream')
        .send(reportData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Date range too large. Maximum 365 days allowed.');
    });
  });
});
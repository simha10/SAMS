const { z } = require('zod');

// Auth validation schemas
const registerSchema = z.object({
  empId: z.string().min(1, 'Employee ID is required'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['employee', 'manager', 'director']),
  managerId: z.string().optional(),
  officeLocation: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    radius: z.number().min(1).max(1000)
  }).optional()
});

const loginSchema = z.object({
  empId: z.string().min(1, 'Employee ID is required'),
  password: z.string().min(1, 'Password is required')
});

// Attendance validation schemas
const checkinSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180)
});

const attendanceQuerySchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()
});

// Leave request validation
const leaveRequestSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reason: z.string().optional(),
  type: z.enum(['sick', 'personal', 'vacation', 'emergency'])
});

module.exports = {
  registerSchema,
  loginSchema,
  checkinSchema,
  attendanceQuerySchema,
  leaveRequestSchema
};
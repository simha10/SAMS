const { z } = require('zod');

// Schema for report generation requests
const reportRequestSchema = z.object({
  type: z.enum(['attendance', 'leave', 'summary', 'combined']),
  format: z.enum(['csv', 'pdf']).default('csv'), // Removed 'xlsx' due to security vulnerabilities
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  filters: z.object({
    employeeId: z.string().optional()
  }).optional()
});

// Schema for date range validation
const dateRangeSchema = z.object({
  startDate: z.date(),
  endDate: z.date()
}).refine(data => data.endDate >= data.startDate, {
  message: "End date must be after start date",
  path: ["endDate"]
}).refine(data => {
  // Calculate the difference in days
  const timeDiff = Math.abs(data.endDate.getTime() - data.startDate.getTime());
  const diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;
  return diffDays <= 31; // Limit to 31 days
}, {
  message: "Date range cannot exceed 31 days",
  path: ["endDate"]
});

// Function to sanitize strings and prevent prototype pollution
function sanitizeInput(input) {
  if (typeof input !== 'object' || input === null) {
    return input;
  }

  // Prevent prototype pollution
  const sanitized = {};
  for (const [key, value] of Object.entries(input)) {
    // Skip dangerous keys
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      continue;
    }
    
    // Recursively sanitize nested objects
    if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeInput(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

// Function to prevent formula injection in Excel cells
function sanitizeExcelCell(value) {
  if (typeof value === 'string' && 
      (value.startsWith('=') || value.startsWith('+') || value.startsWith('-') || value.startsWith('@'))) {
    // Prefix with single quote to treat as text
    return "'" + value;
  }
  return value;
}

module.exports = {
  reportRequestSchema,
  dateRangeSchema,
  sanitizeInput,
  sanitizeExcelCell
};
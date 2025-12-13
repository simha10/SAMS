const { reportRequestSchema, dateRangeSchema, sanitizeInput, sanitizeExcelCell } = require('../src/utils/validation');

describe('Validation Utilities', () => {
  describe('reportRequestSchema', () => {
    it('should validate correct report request', () => {
      const validRequest = {
        type: 'attendance',
        format: 'csv',
        startDate: '2023-01-01',
        endDate: '2023-01-31',
        filters: {
          employeeId: 'EMP001'
        }
      };

      const result = reportRequestSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
    });

    it('should reject invalid report type', () => {
      const invalidRequest = {
        type: 'invalid',
        format: 'csv',
        startDate: '2023-01-01',
        endDate: '2023-01-31'
      };

      const result = reportRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });

    it('should reject invalid date format', () => {
      const invalidRequest = {
        type: 'attendance',
        format: 'csv',
        startDate: '01/01/2023',
        endDate: '2023-01-31'
      };

      const result = reportRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });

    it('should reject xlsx format', () => {
      const invalidRequest = {
        type: 'attendance',
        format: 'xlsx', // This should be rejected
        startDate: '2023-01-01',
        endDate: '2023-01-31'
      };

      const result = reportRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });
  });

  describe('dateRangeSchema', () => {
    it('should validate correct date range', () => {
      const validRange = {
        startDate: new Date('2023-01-01'),
        endDate: new Date('2023-01-31')
      };

      const result = dateRangeSchema.safeParse(validRange);
      expect(result.success).toBe(true);
    });

    it('should reject end date before start date', () => {
      const invalidRange = {
        startDate: new Date('2023-01-31'),
        endDate: new Date('2023-01-01')
      };

      const result = dateRangeSchema.safeParse(invalidRange);
      expect(result.success).toBe(false);
    });
  });

  describe('sanitizeInput', () => {
    it('should prevent prototype pollution', () => {
      const maliciousInput = {
        normalField: 'value',
        __proto__: { polluted: true },
        constructor: { polluted: true },
        prototype: { polluted: true }
      };

      const sanitized = sanitizeInput(maliciousInput);
      expect(sanitized.hasOwnProperty('__proto__')).toBe(false);
      expect(sanitized.hasOwnProperty('constructor')).toBe(false);
      expect(sanitized.hasOwnProperty('prototype')).toBe(false);
      expect(sanitized.normalField).toBe('value');
    });

    it('should handle nested objects', () => {
      const nestedInput = {
        level1: {
          normalField: 'value',
          __proto__: { polluted: true }
        },
        normalField: 'value'
      };

      const sanitized = sanitizeInput(nestedInput);
      expect(sanitized.level1.hasOwnProperty('__proto__')).toBe(false);
      expect(sanitized.level1.normalField).toBe('value');
      expect(sanitized.normalField).toBe('value');
    });

    it('should handle non-object inputs', () => {
      expect(sanitizeInput('string')).toBe('string');
      expect(sanitizeInput(123)).toBe(123);
      expect(sanitizeInput(null)).toBe(null);
      expect(sanitizeInput(undefined)).toBe(undefined);
    });
  });

  describe('sanitizeExcelCell', () => {
    it('should prevent formula injection', () => {
      expect(sanitizeExcelCell('=SUM(A1:A10)')).toBe("'=SUM(A1:A10)");
      expect(sanitizeExcelCell('+CMD|\'/C calc\'')).toBe("'+CMD|'/C calc'");
      expect(sanitizeExcelCell('-1234')).toBe("'-1234");
      expect(sanitizeExcelCell('@SUM(A1:A10)')).toBe("'@SUM(A1:A10)");
    });

    it('should not modify safe values', () => {
      expect(sanitizeExcelCell('Normal text')).toBe('Normal text');
      expect(sanitizeExcelCell(123)).toBe(123);
      expect(sanitizeExcelCell('Text with = sign in middle')).toBe('Text with = sign in middle');
    });
  });
});
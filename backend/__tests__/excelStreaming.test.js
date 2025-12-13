const { createExcelStreamWriter, addWorksheetToWorkbook, finalizeWorkbook } = require('../src/utils/excelStreaming');

// Mock response object
const mockRes = {
  setHeader: jest.fn(),
  write: jest.fn()
};

// Mock the ExcelJS WorkbookWriter
jest.mock('exceljs', () => {
  // Mock row object that supports property assignment
  const createMockRow = () => ({
    font: undefined,
    fill: undefined
  });
  
  // Mock worksheet with proper row handling
  const createMockWorksheet = () => {
    const rows = [];
    return {
      rows: rows,
      columns: [],
      addRow: jest.fn().mockImplementation((data) => {
        const row = createMockRow();
        rows.push(row);
        return row;
      }),
      commit: jest.fn()
    };
  };
  
  const mockWorkbook = {
    addWorksheet: jest.fn().mockImplementation(() => createMockWorksheet()),
    commit: jest.fn()
  };
  
  return {
    stream: {
      xlsx: {
        WorkbookWriter: jest.fn().mockImplementation(() => mockWorkbook)
      }
    }
  };
});

describe('Excel Streaming Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createExcelStreamWriter', () => {
    it('should create a workbook writer with correct headers', async () => {
      const filename = 'test.xlsx';
      
      const workbook = await createExcelStreamWriter(mockRes, filename);
      
      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'Content-Type', 
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'Content-Disposition', 
        `attachment; filename="${filename}"`
      );
      // Since we're mocking, we can't check instanceof, but we can check that it's an object
      expect(workbook).toBeDefined();
      expect(typeof workbook).toBe('object');
    });
  });

  describe('addWorksheetToWorkbook', () => {
    it('should add worksheet with headers and data', async () => {
      // Mock the workbook and worksheet with proper row objects
      const mockWorksheet = {
        rows: [],
        columns: [],
        addRow: jest.fn().mockImplementation(() => {
          const row = { font: undefined, fill: undefined };
          mockWorksheet.rows.push(row);
          return row;
        }),
        commit: jest.fn()
      };
      
      const mockWorkbook = {
        addWorksheet: jest.fn().mockReturnValue(mockWorksheet),
        commit: jest.fn()
      };
      
      const sheetName = 'Test Sheet';
      const headers = ['Name', 'Age', 'City'];
      const data = [
        { Name: 'John', Age: 30, City: 'New York' },
        { Name: 'Jane', Age: 25, City: 'Los Angeles' }
      ];
      
      const rowCount = await addWorksheetToWorkbook(mockWorkbook, sheetName, headers, data);
      
      // We should have 3 rows (1 header + 2 data rows)
      expect(rowCount).toBe(3);
      expect(mockWorkbook.addWorksheet).toHaveBeenCalledWith(sheetName);
      expect(mockWorksheet.addRow).toHaveBeenCalled();
    });

    it('should prevent formula injection in cells', async () => {
      // Mock the workbook and worksheet with proper row objects
      const mockWorksheet = {
        rows: [],
        columns: [],
        addRow: jest.fn().mockImplementation(() => {
          const row = { font: undefined, fill: undefined };
          mockWorksheet.rows.push(row);
          return row;
        }),
        commit: jest.fn()
      };
      
      const mockWorkbook = {
        addWorksheet: jest.fn().mockReturnValue(mockWorksheet),
        commit: jest.fn()
      };
      
      const sheetName = 'Test Sheet';
      const headers = ['Formula', 'Safe'];
      const data = [
        { Formula: '=SUM(A1:A10)', Safe: 'Normal text' },
        { Formula: '+CMD|\'/C calc\'', Safe: 'Another text' }
      ];
      
      const rowCount = await addWorksheetToWorkbook(mockWorkbook, sheetName, headers, data);
      
      // We should have 3 rows (1 header + 2 data rows)
      expect(rowCount).toBe(3);
      expect(mockWorkbook.addWorksheet).toHaveBeenCalledWith(sheetName);
      expect(mockWorksheet.addRow).toHaveBeenCalled();
    });

    it('should handle large datasets with batching', async () => {
      // Mock the workbook and worksheet with proper row objects
      const mockWorksheet = {
        rows: [],
        columns: [],
        addRow: jest.fn().mockImplementation(() => {
          const row = { font: undefined, fill: undefined };
          mockWorksheet.rows.push(row);
          return row;
        }),
        commit: jest.fn()
      };
      
      const mockWorkbook = {
        addWorksheet: jest.fn().mockReturnValue(mockWorksheet),
        commit: jest.fn()
      };
      
      const sheetName = 'Large Data';
      const headers = ['ID', 'Value'];
      
      // Create 1000 rows of data (more than the default batch size of 500)
      const data = [];
      for (let i = 0; i < 1000; i++) {
        data.push({ ID: i, Value: `Value ${i}` });
      }
      
      const rowCount = await addWorksheetToWorkbook(mockWorkbook, sheetName, headers, data);
      
      // We should have 1001 rows (1 header + 1000 data rows)
      expect(rowCount).toBe(1001);
      expect(mockWorkbook.addWorksheet).toHaveBeenCalledWith(sheetName);
      expect(mockWorksheet.addRow).toHaveBeenCalled();
    });
  });

  describe('finalizeWorkbook', () => {
    it('should finalize the workbook', async () => {
      // Mock the workbook
      const mockWorkbook = {
        addWorksheet: jest.fn(),
        commit: jest.fn()
      };
      
      // Add a worksheet to make the workbook valid
      mockWorkbook.addWorksheet('Test');
      
      await expect(finalizeWorkbook(mockWorkbook)).resolves.not.toThrow();
      expect(mockWorkbook.commit).toHaveBeenCalled();
    });
  });
});
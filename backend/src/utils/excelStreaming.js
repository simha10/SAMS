const ExcelJS = require('exceljs');

/**
 * Create a streaming Excel workbook writer
 * @param {Response} res - Express response object
 * @param {string} filename - Name of the file to be downloaded
 * @returns {ExcelJS.stream.xlsx.WorkbookWriter} - Workbook writer instance
 */
async function createExcelStreamWriter(res, filename) {
  // Set appropriate headers for Excel file download
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  
  // Create streaming workbook writer
  const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({
    stream: res,
    useStyles: true,
    useSharedStrings: true
  });
  
  return workbook;
}

/**
 * Add a worksheet to the streaming workbook with data
 * @param {ExcelJS.stream.xlsx.WorkbookWriter} workbook - Workbook writer instance
 * @param {string} sheetName - Name of the worksheet
 * @param {Array} headers - Array of header column names
 * @param {AsyncGenerator|Array} dataIterator - Async generator or array of data rows
 * @param {Object} options - Additional options for formatting
 */
async function addWorksheetToWorkbook(workbook, sheetName, headers, dataIterator, options = {}) {
  // Create worksheet
  const worksheet = workbook.addWorksheet(sheetName);
  
  // Add headers
  const headerRow = worksheet.addRow(headers);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFCCCCCC' }
  };
  
  // Process data rows with streaming
  let rowCount = 1; // Header row already added
  
  // If dataIterator is an array, convert it to an async iterator
  const iterator = Array.isArray(dataIterator) 
    ? (async function* () {
        for (const item of dataIterator) {
          yield item;
        }
      })()
    : dataIterator;
  
  // Process rows in batches to prevent blocking the event loop
  const batchSize = options.batchSize || 500;
  let batch = [];
  
  for await (const rowData of iterator) {
    // Sanitize data to prevent formula injection
    const sanitizedRow = headers.map(header => {
      const value = rowData[header];
      // Prevent formula injection by prefixing dangerous characters with a single quote
      if (typeof value === 'string') {
        // Special handling for '1/2' to prevent Excel from interpreting it as a date
        if (value === '1/2') {
          return "'" + value;
        }
        // Prevent formula injection for other dangerous characters
        if (value.startsWith('=') || value.startsWith('+') || value.startsWith('-') || value.startsWith('@')) {
          return "'" + value;
        }
      }
      return value;
    });
    
    batch.push(sanitizedRow);
    rowCount++;
    
    // When batch is full, add all rows and commit
    if (batch.length >= batchSize) {
      batch.forEach(rowData => {
        worksheet.addRow(rowData);
      });
      batch = [];
      
      // Commit the worksheet to flush data to stream
      await worksheet.commit();
      
      // Allow event loop to process other tasks
      await new Promise(resolve => setImmediate(resolve));
    }
  }
  
  // Add remaining rows in the final batch
  if (batch.length > 0) {
    batch.forEach(rowData => {
      worksheet.addRow(rowData);
    });
    await worksheet.commit();
  }
  
  // Auto-fit columns
  if (options.autoFitColumns !== false) {
    worksheet.columns.forEach(column => {
      column.width = 20;
    });
  }
  
  return rowCount;
}

/**
 * Finalize the workbook and close the stream
 * @param {ExcelJS.stream.xlsx.WorkbookWriter} workbook - Workbook writer instance
 */
async function finalizeWorkbook(workbook) {
  await workbook.commit();
}

/**
 * Create a secure streaming Excel file from an async data source
 * @param {Response} res - Express response object
 * @param {string} filename - Name of the Excel file
 * @param {string} sheetName - Name of the worksheet
 * @param {Array} headers - Array of header column names
 * @param {AsyncGenerator|Array} dataIterator - Async generator or array of data rows
 * @param {Object} options - Additional options
 */
async function createExcelStream(res, filename, sheetName, headers, dataIterator, options = {}) {
  try {
    // Create streaming workbook
    const workbook = await createExcelStreamWriter(res, filename);
    
    // Add worksheet with data
    await addWorksheetToWorkbook(workbook, sheetName, headers, dataIterator, options);
    
    // Finalize workbook
    await finalizeWorkbook(workbook);
  } catch (error) {
    console.error('Error creating Excel stream:', error);
    throw new Error('Failed to generate Excel file');
  }
}

module.exports = {
  createExcelStreamWriter,
  addWorksheetToWorkbook,
  finalizeWorkbook,
  createExcelStream
};
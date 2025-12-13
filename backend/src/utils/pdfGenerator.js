const puppeteer = require('puppeteer');
const { generateAttendanceReportData } = require('./excel');
const { generateLeaveReportData } = require('./excel');
const { generateSummaryReportData } = require('./excel');

// Generate HTML template for attendance report
function generateAttendanceHTML(reportData, startDate, endDate, filters = {}) {
  if (!reportData || reportData.length === 0) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Attendance Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 20px; }
          .report-info { margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .footer { margin-top: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>SAMS - Attendance Report</h1>
        </div>
        <div class="report-info">
          <p><strong>Period:</strong> ${startDate} to ${endDate}</p>
          ${filters.employeeId ? `<p><strong>Employee ID:</strong> ${filters.employeeId}</p>` : ''}
        </div>
        <p>No attendance records found for the selected period.</p>
        <div class="footer">
          <p>Generated on: ${new Date().toLocaleString()}</p>
        </div>
      </body>
      </html>
    `;
  }

  // Get headers from the first row
  const headers = Object.keys(reportData[0]);
  
  // Generate table rows
  const rows = reportData.map(row => {
    return `
      <tr>
        ${headers.map(header => `<td>${row[header] || ''}</td>`).join('')}
      </tr>
    `;
  }).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Attendance Report</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; margin-bottom: 20px; }
        .report-info { margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .footer { margin-top: 20px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>SAMS - Attendance Report</h1>
      </div>
      <div class="report-info">
        <p><strong>Period:</strong> ${startDate} to ${endDate}</p>
        ${filters.employeeId ? `<p><strong>Employee ID:</strong> ${filters.employeeId}</p>` : ''}
      </div>
      <table>
        <thead>
          <tr>
            ${headers.map(header => `<th>${header}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
      <div class="footer">
        <p>Generated on: ${new Date().toLocaleString()}</p>
      </div>
    </body>
    </html>
  `;
}

// Generate HTML template for leave report
function generateLeaveHTML(reportData, startDate, endDate, filters = {}) {
  if (!reportData || reportData.length === 0) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Leave Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 20px; }
          .report-info { margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .footer { margin-top: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>SAMS - Leave Report</h1>
        </div>
        <div class="report-info">
          <p><strong>Period:</strong> ${startDate} to ${endDate}</p>
          ${filters.employeeId ? `<p><strong>Employee ID:</strong> ${filters.employeeId}</p>` : ''}
        </div>
        <p>No leave records found for the selected period.</p>
        <div class="footer">
          <p>Generated on: ${new Date().toLocaleString()}</p>
        </div>
      </body>
      </html>
    `;
  }

  // Get headers from the first row
  const headers = Object.keys(reportData[0]);
  
  // Generate table rows
  const rows = reportData.map(row => {
    return `
      <tr>
        ${headers.map(header => `<td>${row[header] || ''}</td>`).join('')}
      </tr>
    `;
  }).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Leave Report</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; margin-bottom: 20px; }
        .report-info { margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .footer { margin-top: 20px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>SAMS - Leave Report</h1>
      </div>
      <div class="report-info">
        <p><strong>Period:</strong> ${startDate} to ${endDate}</p>
        ${filters.employeeId ? `<p><strong>Employee ID:</strong> ${filters.employeeId}</p>` : ''}
      </div>
      <table>
        <thead>
          <tr>
            ${headers.map(header => `<th>${header}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
      <div class="footer">
        <p>Generated on: ${new Date().toLocaleString()}</p>
      </div>
    </body>
    </html>
  `;
}

// Generate HTML template for summary report
function generateSummaryHTML(reportData, startDate, endDate, filters = {}) {
  if (!reportData || reportData.length === 0) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Summary Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 20px; }
          .report-info { margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .footer { margin-top: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>SAMS - Summary Report</h1>
        </div>
        <div class="report-info">
          <p><strong>Period:</strong> ${startDate} to ${endDate}</p>
          ${filters.employeeId ? `<p><strong>Employee ID:</strong> ${filters.employeeId}</p>` : ''}
        </div>
        <p>No summary data found for the selected period.</p>
        <div class="footer">
          <p>Generated on: ${new Date().toLocaleString()}</p>
        </div>
      </body>
      </html>
    `;
  }

  // Get headers from the first row
  const headers = Object.keys(reportData[0]);
  
  // Generate table rows
  const rows = reportData.map(row => {
    return `
      <tr>
        ${headers.map(header => `<td>${row[header] || ''}</td>`).join('')}
      </tr>
    `;
  }).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Summary Report</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; margin-bottom: 20px; }
        .report-info { margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .footer { margin-top: 20px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>SAMS - Summary Report</h1>
      </div>
      <div class="report-info">
        <p><strong>Period:</strong> ${startDate} to ${endDate}</p>
        ${filters.employeeId ? `<p><strong>Employee ID:</strong> ${filters.employeeId}</p>` : ''}
      </div>
      <table>
        <thead>
          <tr>
            ${headers.map(header => `<th>${header}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
      <div class="footer">
        <p>Generated on: ${new Date().toLocaleString()}</p>
      </div>
    </body>
    </html>
  `;
}

// Generate HTML template for combined report
function generateCombinedHTML(attendanceData, leaveData, summaryData, startDate, endDate, filters = {}) {
  // Generate individual HTML reports
  const attendanceHTML = generateAttendanceHTML(attendanceData, startDate, endDate, filters);
  const leaveHTML = generateLeaveHTML(leaveData, startDate, endDate, filters);
  const summaryHTML = generateSummaryHTML(summaryData, startDate, endDate, filters);

  // Extract content between body tags for each report
  const extractBodyContent = (html) => {
    const bodyStart = html.indexOf('<body>');
    const bodyEnd = html.indexOf('</body>');
    if (bodyStart !== -1 && bodyEnd !== -1) {
      return html.substring(bodyStart + 6, bodyEnd); // +6 to skip '<body>'
    }
    return '';
  };

  // Extract the main content from each report (excluding header and footer)
  const attendanceContent = extractBodyContent(attendanceHTML);
  const leaveContent = extractBodyContent(leaveHTML);
  const summaryContent = extractBodyContent(summaryHTML);

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Combined Report</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; margin-bottom: 20px; }
        .report-info { margin-bottom: 20px; }
        .section { margin-bottom: 40px; }
        .section-title { font-size: 20px; font-weight: bold; margin-bottom: 15px; color: #333; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .footer { margin-top: 20px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>SAMS - Combined Report</h1>
      </div>
      <div class="report-info">
        <p><strong>Period:</strong> ${startDate} to ${endDate}</p>
        ${filters.employeeId ? `<p><strong>Employee ID:</strong> ${filters.employeeId}</p>` : ''}
      </div>
      
      <div class="section">
        <div class="section-title">Attendance Report</div>
        ${attendanceContent}
      </div>
      
      <div class="section">
        <div class="section-title">Leave Report</div>
        ${leaveContent}
      </div>
      
      <div class="section">
        <div class="section-title">Summary Report</div>
        ${summaryContent}
      </div>
      
      <div class="footer">
        <p>Generated on: ${new Date().toLocaleString()}</p>
      </div>
    </body>
    </html>
  `;
}

// Export the generatePDF function
async function generatePDF(htmlContent) {
  let browser;
  try {
    // Launch Puppeteer with Chromium
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Set content and wait for it to load
    await page.setContent(htmlContent, {
      waitUntil: 'networkidle0'
    });
    
    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px'
      }
    });
    
    return pdfBuffer;
  } finally {
    // Close browser
    if (browser) {
      await browser.close();
    }
  }
}

// Main function to generate PDF for different report types
async function generateReportPDF(type, reportData, startDate, endDate, filters = {}) {
  let htmlContent;
  
  switch (type) {
    case 'attendance':
      htmlContent = generateAttendanceHTML(reportData, startDate, endDate, filters);
      break;
    case 'leave':
      htmlContent = generateLeaveHTML(reportData, startDate, endDate, filters);
      break;
    case 'summary':
      htmlContent = generateSummaryHTML(reportData, startDate, endDate, filters);
      break;
    case 'combined':
      // For combined reports, we need separate data for each type
      htmlContent = generateCombinedHTML(
        reportData.attendance || [], 
        reportData.leave || [], 
        reportData.summary || [],
        startDate, 
        endDate, 
        filters
      );
      break;
    default:
      throw new Error(`Unsupported report type: ${type}`);
  }
  
  return await generatePDF(htmlContent);
}

module.exports = {
  generateReportPDF,
  generateAttendanceHTML,
  generateLeaveHTML,
  generateSummaryHTML,
  generateCombinedHTML,
  generatePDF
};
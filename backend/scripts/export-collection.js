const mongoose = require('mongoose');
const fs = require('fs').promises;
const path = require('path');

// Import all models to register them with mongoose
const User = require('../src/models/User');
const Attendance = require('../src/models/Attendance');
const Branch = require('../src/models/Branch');
const Holiday = require('../src/models/Holiday');
const LeaveRequest = require('../src/models/LeaveRequest');
const Report = require('../src/models/Report');
const Announcement = require('../src/models/Announcement');

const connectDB = require('../src/config/database');

// Mapping of collection names to models
const collectionModels = {
  users: User,
  attendance: Attendance,
  branches: Branch,
  holidays: Holiday,
  leaverequests: LeaveRequest,
  reports: Report,
  announcements: Announcement
};

async function exportCollection(collectionName, outputDir = './exports') {
  try {
    // Validate collection name
    if (!collectionModels[collectionName.toLowerCase()]) {
      throw new Error(`Collection '${collectionName}' not found. Available collections: ${Object.keys(collectionModels).join(', ')}`);
    }

    const model = collectionModels[collectionName.toLowerCase()];
    
    // Connect to database
    await connectDB();
    
    console.log(`Exporting data from collection: ${collectionName}`);
    
    // Fetch all documents from the collection
    const documents = await model.find({});
    
    console.log(`Found ${documents.length} documents in collection '${collectionName}'`);
    
    // Create output directory if it doesn't exist
    await fs.mkdir(outputDir, { recursive: true });
    
    // Generate output filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${collectionName}_${timestamp}.json`;
    const filepath = path.join(outputDir, filename);
    
    // Convert documents to plain objects and stringify with proper formatting
    const jsonData = JSON.stringify(documents.map(doc => doc.toObject()), null, 2);
    
    // Write data to file
    await fs.writeFile(filepath, jsonData);
    
    console.log(`Data exported successfully to: ${filepath}`);
    console.log(`Exported ${documents.length} documents`);
    
    // Close the database connection
    await mongoose.connection.close();
    
    return filepath;
  } catch (error) {
    console.error('Error exporting collection:', error);
    process.exit(1);
  }
}

// Function to export all collections
async function exportAllCollections(outputDir = './exports') {
  try {
    await connectDB();
    
    // Create output directory
    await fs.mkdir(outputDir, { recursive: true });
    
    const results = [];
    
    for (const [collectionName, model] of Object.entries(collectionModels)) {
      console.log(`Exporting ${collectionName}...`);
      
      const documents = await model.find({});
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `${collectionName}_${timestamp}.json`;
      const filepath = path.join(outputDir, filename);
      
      const jsonData = JSON.stringify(documents.map(doc => doc.toObject()), null, 2);
      await fs.writeFile(filepath, jsonData);
      
      console.log(`Exported ${documents.length} documents to ${filepath}`);
      results.push({ collection: collectionName, count: documents.length, file: filepath });
    }
    
    // Create a summary file
    const summaryPath = path.join(outputDir, `export-summary_${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
    await fs.writeFile(summaryPath, JSON.stringify(results, null, 2));
    
    console.log('\nExport completed!');
    console.log('Summary:');
    results.forEach(result => {
      console.log(`  ${result.collection}: ${result.count} documents -> ${result.file}`);
    });
    console.log(`Summary saved to: ${summaryPath}`);
    
    await mongoose.connection.close();
    
    return results;
  } catch (error) {
    console.error('Error exporting all collections:', error);
    process.exit(1);
  }
}

// Command line interface
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage:');
    console.log('  node export-collection.js <collection-name> [output-directory]');
    console.log('  node export-collection.js all [output-directory]');
    console.log('  node export-collection.js --help');
    console.log('');
    console.log('Available collections:', Object.keys(collectionModels).join(', '));
    process.exit(0);
  }
  
  if (args[0] === '--help') {
    console.log('Usage:');
    console.log('  node export-collection.js <collection-name> [output-directory]');
    console.log('  node export-collection.js all [output-directory]');
    console.log('  node export-collection.js --help');
    console.log('');
    console.log('Examples:');
    console.log('  node export-collection.js users');
    console.log('  node export-collection.js attendance ./exports');
    console.log('  node export-collection.js all ./exports');
    console.log('');
    console.log('Available collections:', Object.keys(collectionModels).join(', '));
    process.exit(0);
  }
  
  const collectionName = args[0];
  const outputDir = args[1] || './exports';
  
  if (collectionName.toLowerCase() === 'all') {
    exportAllCollections(outputDir);
  } else {
    exportCollection(collectionName, outputDir);
  }
}

module.exports = { exportCollection, exportAllCollections };
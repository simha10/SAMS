require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');
const bcrypt = require('bcrypt');

const seedUsers = async () => {
  try {
    // Connect to database using the same connection string as in .env
    console.log('Connecting to MongoDB...');
    
    await mongoose.connect(process.env.MONGO_URI, {
      retryWrites: true,
      w: 'majority',
    });
    
    console.log('Connected to MongoDB');

    // Clear existing users
    await User.deleteMany({});
    console.log('Cleared existing users');

    // Create director with office location details
    const director = new User({
      empId: 'DIR001',
      name: 'John Director',
      email: 'director@company.com',
      password: 'director123', // Plain text, will be hashed by pre-save hook
      role: 'director',
      officeLocation: {
        lat: 26.913595,
        lng: 80.953481,
        radius: 50
      },
      isActive: true
    });

    await director.save();
    console.log('Created director:', director.name);

    // Create manager with office location details and manager relationship
    const manager = new User({
      empId: 'MGR001',
      name: 'Jane Manager',
      email: 'manager@company.com',
      password: 'manager123', // Plain text, will be hashed by pre-save hook
      role: 'manager',
      managerId: director._id,
      officeLocation: {
        lat: 26.913595,
        lng: 80.953481,
        radius: 50
      },
      isActive: true
    });

    await manager.save();
    console.log('Created manager:', manager.name);

    // Create employees with office location details and manager relationship
    const employees = [
      {
        empId: 'EMP001',
        name: 'Alice Employee',
        email: 'alice@company.com',
        password: 'employee123',
        role: 'employee',
        managerId: manager._id,
        officeLocation: {
          lat: 26.913595,
          lng: 80.953481,
          radius: 50
        },
        isActive: true
      },
      {
        empId: 'EMP002',
        name: 'Bob Employee',
        email: 'bob@company.com',
        password: 'employee123',
        role: 'employee',
        managerId: manager._id,
        officeLocation: {
          lat: 26.913595,
          lng: 80.953481,
          radius: 50
        },
        isActive: true
      },
      {
        empId: 'EMP003',
        name: 'Charlie Employee',
        email: 'charlie@company.com',
        password: 'employee123',
        role: 'employee',
        managerId: manager._id,
        officeLocation: {
          lat: 26.913595,
          lng: 80.953481,
          radius: 50
        },
        isActive: true
      }
    ];

    for (const empData of employees) {
      const employee = new User(empData);
      // Password will be hashed by pre-save hook
      await employee.save();
      console.log('Created employee:', employee.name);
    }

    console.log('Seeding completed successfully!');
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error seeding users:', error);
    process.exit(1);
  }
};

seedUsers();
// Load environment variables only when PLATFORM is not 'gcp'
if (process.env.PLATFORM !== 'gcp') {
    require('dotenv').config({ path: __dirname + '/../.env' });
}
const mongoose = require('mongoose');
const User = require('../src/models/User');
const Branch = require('../src/models/Branch');

const seedUsers = async () => {
  try {
    // Connect to database using the same connection string as in .env
    console.log('Connecting to MongoDB...');
    console.log('MONGO_URI:', process.env.MONGO_URI ? 'Found' : 'Not found');

    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI environment variable is not set');
    }

    await mongoose.connect(process.env.MONGO_URI, {
      retryWrites: true,
      w: 'majority',
    });

    console.log('Connected to MongoDB');

    // Clear existing users and branches
    await User.deleteMany({});
    await Branch.deleteMany({});
    console.log('Cleared existing users and branches');

    // Create branches with the provided coordinates
    const branch1 = new Branch({
      name: 'Old Office',
      location: {
        lat: 26.913662872166825,
        lng: 80.95351830268484
      },
      radius: 50,
      isActive: true
    });

    const branch2 = new Branch({
      name: 'New Office',
      location: {
        lat: 26.914835918849107,
        lng: 80.94982919387432
      },
      radius: 50,
      isActive: true
    });

    await branch1.save();
    await branch2.save();
    console.log('Created branches:', branch1.name, 'and', branch2.name);

    // Create director
    const director = new User({
      empId: 'LRMC001',
      name: 'LIM Rao',
      email: 'lim.rao@company.com',
      password: 'director123',
      role: 'director',
      dob: new Date('1980-05-15'),
      isActive: true
    });

    await director.save();
    console.log('Created director:', director.name);

    // Create manager
    const manager = new User({
      empId: 'LRMC002',
      name: 'Vikhas Gupta',
      email: 'vikhas.gupta@company.com',
      password: 'manager123',
      role: 'manager',
      managerId: director._id,
      dob: new Date('1985-08-22'),
      isActive: true
    });

    await manager.save();
    console.log('Created manager:', manager.name);

    // Create employees
    const employees = [
      {
        empId: 'LRMC003',
        name: 'Uday Singh',
        email: 'uday.singh@company.com',
        password: 'employee123',
        role: 'employee',
        managerId: manager._id,
        dob: new Date('1990-03-10'),
        isActive: true
      },
      {
        empId: 'LRMC004',
        name: 'Simhachalam M',
        email: 'simhachalam.m@company.com',
        password: 'employee123',
        role: 'employee',
        managerId: manager._id,
        dob: new Date('1992-11-25'),
        isActive: true
      },
      {
        empId: 'LRMC005',
        name: 'Haneef Sd',
        email: 'haneef.sd@company.com',
        password: 'employee123',
        role: 'employee',
        managerId: manager._id,
        dob: new Date('1988-07-18'),
        isActive: true
      }
    ];

    for (const empData of employees) {
      const employee = new User(empData);
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
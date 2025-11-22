const User = require('../models/User');

/**
 * Get today's birthdays
 * Returns list of employees with birthdays today
 */
async function getTodayBirthdays(req, res) {
  try {
    const today = new Date();
    const todayMonth = today.getMonth() + 1; // 0-based month
    const todayDay = today.getDate();

    // Find users with matching birthday (month and day)
    // Using aggregation for efficient filtering
    const birthdayUsers = await User.aggregate([
      {
        $match: {
          dateOfBirth: { $exists: true, $ne: null },
          isActive: true
        }
      },
      {
        $project: {
          empId: 1,
          name: 1,
          role: 1,
          dateOfBirth: 1,
          birthMonth: { $month: '$dateOfBirth' },
          birthDay: { $dayOfMonth: '$dateOfBirth' }
        }
      },
      {
        $match: {
          birthMonth: todayMonth,
          birthDay: todayDay
        }
      },
      {
        $project: {
          empId: 1,
          name: 1,
          role: 1,
          dateOfBirth: 1
        }
      },
      {
        $sort: { name: 1 }
      }
    ]);

    res.json({
      success: true,
      data: {
        count: birthdayUsers.length,
        birthdays: birthdayUsers.map(user => ({
          empId: user.empId,
          name: user.name,
          role: user.role,
          dateOfBirth: user.dateOfBirth
        }))
      }
    });
  } catch (error) {
    console.error('Get today birthdays error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

/**
 * Get upcoming birthdays (next 7 days)
 * Useful for planning celebrations
 */
async function getUpcomingBirthdays(req, res) {
  try {
    const { days = 7 } = req.query;
    const daysAhead = parseInt(days);

    const today = new Date();
    const birthdayUsers = [];

    // Check each day ahead
    for (let i = 0; i <= daysAhead; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() + i);
      
      const month = checkDate.getMonth() + 1;
      const day = checkDate.getDate();

      const users = await User.aggregate([
        {
          $match: {
            dateOfBirth: { $exists: true, $ne: null },
            isActive: true
          }
        },
        {
          $project: {
            empId: 1,
            name: 1,
            role: 1,
            dateOfBirth: 1,
            birthMonth: { $month: '$dateOfBirth' },
            birthDay: { $dayOfMonth: '$dateOfBirth' }
          }
        },
        {
          $match: {
            birthMonth: month,
            birthDay: day
          }
        },
        {
          $project: {
            empId: 1,
            name: 1,
            role: 1,
            dateOfBirth: 1,
            daysUntil: { $literal: i }
          }
        }
      ]);

      birthdayUsers.push(...users);
    }

    // Sort by days until birthday
    birthdayUsers.sort((a, b) => a.daysUntil - b.daysUntil);

    res.json({
      success: true,
      data: {
        count: birthdayUsers.length,
        upcomingBirthdays: birthdayUsers.map(user => ({
          empId: user.empId,
          name: user.name,
          role: user.role,
          dateOfBirth: user.dateOfBirth,
          daysUntil: user.daysUntil
        }))
      }
    });
  } catch (error) {
    console.error('Get upcoming birthdays error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

module.exports = {
  getTodayBirthdays,
  getUpcomingBirthdays
};

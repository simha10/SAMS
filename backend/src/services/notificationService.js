const axios = require('axios');
const NotificationLog = require('../models/NotificationLog');
const logger = require('../config/logger');

class NotificationService {
  constructor() {
    this.telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
    this.telegramChatId = process.env.TELEGRAM_CHAT_ID;
    this.brevoApiKey = process.env.BREVO_API_KEY;
  }

  // Send notification via Telegram
  async sendTelegram(message, chatId = null) {
    try {
      if (!this.telegramBotToken) {
        throw new Error('Telegram bot token not configured');
      }

      const targetChatId = chatId || this.telegramChatId;
      const url = `https://api.telegram.org/bot${this.telegramBotToken}/sendMessage`;
      
      const response = await axios.post(url, {
        chat_id: targetChatId,
        text: message,
        parse_mode: 'HTML'
      });

      return { success: true, data: response.data };
    } catch (error) {
      logger.error('Telegram notification error:', error);
      return { success: false, error: error.message };
    }
  }

  // Send notification via Brevo (email)
  async sendEmail(to, subject, htmlContent) {
    try {
      if (!this.brevoApiKey) {
        throw new Error('Brevo API key not configured');
      }

      const url = 'https://api.brevo.com/v3/smtp/email';
      
      const response = await axios.post(url, {
        sender: { email: 'noreply@company.com', name: 'GoFence Attendance' },
        to: [{ email: to }],
        subject,
        htmlContent
      }, {
        headers: {
          'api-key': this.brevoApiKey,
          'Content-Type': 'application/json'
        }
      });

      return { success: true, data: response.data };
    } catch (error) {
      logger.error('Email notification error:', error);
      return { success: false, error: error.message };
    }
  }

  // Send attendance flag notification to manager
  async sendAttendanceFlagNotification(employee, manager, flagData) {
    const message = `
🚨 <b>Attendance Alert</b>

Employee: ${employee.name} (${employee.empId})
Time: ${new Date(flagData.timestamp).toLocaleString()}
Location: ${flagData.lat}, ${flagData.lng}
Distance from office: ${flagData.distance}m
Reason: ${flagData.reason}

Please review this attendance record.
    `.trim();

    // Log notification
    const notification = new NotificationLog({
      type: 'attendance_flag',
      recipientId: manager._id,
      senderId: employee._id,
      title: 'Attendance Flag Alert',
      message,
      data: flagData,
      channel: 'telegram'
    });

    try {
      const result = await this.sendTelegram(message);
      
      if (result.success) {
        notification.status = 'sent';
        notification.sentAt = new Date();
      } else {
        notification.status = 'failed';
        notification.error = result.error;
      }
    } catch (error) {
      notification.status = 'failed';
      notification.error = error.message;
    }

    await notification.save();
    return notification;
  }

  // Send daily summary to manager
  async sendDailySummary(manager, summaryData) {
    const { date, present, absent, flagged, total } = summaryData;
    
    const message = `
📊 <b>Daily Attendance Summary - ${date}</b>

Manager: ${manager.name}
Team Size: ${total}

✅ Present: ${present}
❌ Absent: ${absent}
🚨 Flagged: ${flagged}

Attendance Rate: ${((present / total) * 100).toFixed(1)}%
    `.trim();

    // Log notification
    const notification = new NotificationLog({
      type: 'daily_summary',
      recipientId: manager._id,
      title: `Daily Summary - ${date}`,
      message,
      data: summaryData,
      channel: 'telegram'
    });

    try {
      const result = await this.sendTelegram(message);
      
      if (result.success) {
        notification.status = 'sent';
        notification.sentAt = new Date();
      } else {
        notification.status = 'failed';
        notification.error = result.error;
      }
    } catch (error) {
      notification.status = 'failed';
      notification.error = error.message;
    }

    await notification.save();
    return notification;
  }

  // Send leave request notification
  async sendLeaveRequestNotification(employee, manager, leaveRequest) {
    const message = `
📝 <b>Leave Request</b>

Employee: ${employee.name} (${employee.empId})
Type: ${leaveRequest.type.toUpperCase()}
Dates: ${leaveRequest.startDate} to ${leaveRequest.endDate}
Days: ${leaveRequest.days}
Reason: ${leaveRequest.reason}

Please review and approve/reject this request.
    `.trim();

    // Log notification
    const notification = new NotificationLog({
      type: 'leave_request',
      recipientId: manager._id,
      senderId: employee._id,
      title: 'New Leave Request',
      message,
      data: { leaveRequestId: leaveRequest._id },
      channel: 'telegram'
    });

    try {
      const result = await this.sendTelegram(message);
      
      if (result.success) {
        notification.status = 'sent';
        notification.sentAt = new Date();
      } else {
        notification.status = 'failed';
        notification.error = result.error;
      }
    } catch (error) {
      notification.status = 'failed';
      notification.error = error.message;
    }

    await notification.save();
    return notification;
  }

  // Get notifications for a user
  async getNotifications(userId, limit = 20, skip = 0) {
    return await NotificationLog.find({ recipientId: userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .populate('senderId', 'name empId')
      .lean();
  }
}

module.exports = new NotificationService();
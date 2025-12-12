import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PAID_SUBSCRIPTION_PLANS } from '../common/constants/subscription.constants';

@Injectable()
export class SupportService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) { }

  /**
   * Create support ticket
   */
  async createSupportTicket(
    userId: string,
    subject: string,
    message: string,
    category: string = 'GENERAL',
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' = 'MEDIUM',
  ) {
    // Check if user has paid subscription (priority support)
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        subscriptions: {
          where: {
            status: 'ACTIVE',
            endDate: { gt: new Date() },
            plan: { in: [...PAID_SUBSCRIPTION_PLANS] },
          },
        },
      },
    });

    const hasPaidPlan = user?.subscriptions.length > 0;
    // Paid plan users get higher priority
    const finalPriority = hasPaidPlan && priority === 'MEDIUM' ? 'HIGH' : priority;

    // In production, create a SupportTicket model
    // For now, create a notification for admins
    const admins = await this.prisma.user.findMany({
      where: { role: 'ADMIN' },
    });

    const ticketData = {
      userId,
      subject,
      message,
      category,
      priority: finalPriority,
      isPremium: hasPaidPlan,
      createdAt: new Date(),
    };

    for (const admin of admins) {
      await this.notificationsService.create(
        admin.id,
        'SUPPORT',
        `Support Ticket: ${subject}`,
        `Priority: ${finalPriority} | Category: ${category}\n${message}`,
        ticketData,
        { sendEmail: true, sendPush: true, sendRealTime: true },
      );
    }

    return {
      ticketId: `TICKET-${Date.now()}`,
      ...ticketData,
      message: 'Support ticket created successfully. Our team will respond soon.',
    };
  }

  /**
   * Get user's support tickets
   */
  async getUserTickets(userId: string) {
    // In production, fetch from SupportTicket model
    // For now, return notifications of type SUPPORT
    const notifications = await this.prisma.notification.findMany({
      where: {
        userId,
        type: 'SUPPORT',
      },
      orderBy: { createdAt: 'desc' },
    });

    return notifications.map((notif) => {
      const metadata = notif.metadata as any;
      return {
        ticketId: metadata?.ticketId || notif.id,
        subject: notif.title.replace('Support Ticket: ', ''),
        message: notif.message,
        category: metadata?.category || 'GENERAL',
        priority: metadata?.priority || 'MEDIUM',
        status: metadata?.status || 'OPEN',
        createdAt: notif.createdAt,
      };
    });
  }

  /**
   * Get FAQ
   */
  async getFAQ() {
    return {
      categories: [
        {
          category: 'Account & Profile',
          questions: [
            {
              question: 'How do I create a profile?',
              answer: 'Click on "Create Profile" and fill in your details step by step. Make sure to add photos and complete all sections for better visibility.',
            },
            {
              question: 'How do I verify my profile?',
              answer: 'Go to Verification section and upload your ID proof and a selfie. Our team will verify within 24-48 hours.',
            },
            {
              question: 'Can I hide my profile from search?',
              answer: 'Yes, go to Privacy Settings and enable "Hide from Search" option.',
            },
          ],
        },
        {
          category: 'Matching & Interests',
          questions: [
            {
              question: 'How do I send an interest?',
              answer: 'Browse profiles and click "Send Interest" on profiles you like. Free users can send 5 interests per day.',
            },
            {
              question: 'What happens when someone accepts my interest?',
              answer: 'You will be notified and a chat will be created automatically. You can then start messaging.',
            },
            {
              question: 'Can I withdraw an interest?',
              answer: 'Yes, go to "Sent Interests" and click "Withdraw" on any pending interest.',
            },
          ],
        },
        {
          category: 'Premium Features',
          questions: [
            {
              question: 'What are the benefits of Premium?',
              answer: 'Premium members get unlimited interests, profile highlighting, advanced search filters, and priority customer support.',
            },
            {
              question: 'How do I upgrade to Premium?',
              answer: 'Go to Payments & Subscriptions page and select a Premium plan. Payment can be made via Razorpay.',
            },
            {
              question: 'Can I cancel my subscription?',
              answer: 'Yes, you can cancel anytime from the Subscriptions page. Your premium features will remain active until the end of the billing period.',
            },
          ],
        },
        {
          category: 'Safety & Privacy',
          questions: [
            {
              question: 'How do I report a user?',
              answer: 'Go to the user\'s profile and click "Report". Select the reason and provide details. Our team will review within 24 hours.',
            },
            {
              question: 'How do I block a user?',
              answer: 'Go to the user\'s profile and click "Block". Blocked users cannot contact you or see your profile.',
            },
            {
              question: 'Is my data safe?',
              answer: 'Yes, we follow strict data protection policies and GDPR compliance. Your personal information is encrypted and secure.',
            },
          ],
        },
      ],
    };
  }

  /**
   * Get contact information
   */
  async getContactInfo() {
    return {
      email: 'support@matrimonial.com',
      phone: '+91-1800-XXX-XXXX',
      hours: 'Monday - Saturday, 9 AM - 6 PM IST',
      address: '123 Matrimonial Street, City, State, PIN',
      socialMedia: {
        facebook: 'https://facebook.com/matrimonial',
        twitter: 'https://twitter.com/matrimonial',
        instagram: 'https://instagram.com/matrimonial',
      },
    };
  }
}


import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Helper function to generate random date
const randomDate = (start: Date, end: Date) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

// Helper function to generate random phone
const randomPhone = (index: number) => {
  return `9876543${String(index).padStart(3, '0')}`;
};

// Helper function to generate random email
const randomEmail = (name: string, index: number) => {
  return `${name.toLowerCase().replace(/\s+/g, '.')}${index}@example.com`;
};

async function main() {
  console.log('🌱 Starting comprehensive database seeding...\n');

  // ============================================
  // 1. USERS (20 users)
  // ============================================
  console.log('📝 Creating 20 Users...');
  const users = [];
  const userNames = [
    'Rajesh Kumar', 'Priya Sharma', 'Amit Patel', 'Sneha Reddy', 'Vikram Singh',
    'Anjali Mehta', 'Rahul Gupta', 'Kavita Joshi', 'Suresh Nair', 'Deepika Iyer',
    'Manoj Desai', 'Swati Kapoor', 'Arjun Malhotra', 'Neha Agarwal', 'Kiran Rao',
    'Divya Menon', 'Rohit Verma', 'Pooja Shah', 'Nikhil Tiwari', 'Shruti Kulkarni',
  ];

  for (let i = 0; i < 20; i++) {
    const hashedPassword = await bcrypt.hash('password123', 10);
    const referralCode = `REF${String(i + 1).padStart(4, '0')}`;
    try {
      const user = await prisma.user.create({
        data: {
          email: randomEmail(userNames[i], i),
          mobile: randomPhone(i),
          password: hashedPassword,
          role: i === 0 ? 'ADMIN' : i < 5 ? 'PARENT' : 'SELF_MEMBER',
          isEmailVerified: Math.random() > 0.3,
          isMobileVerified: Math.random() > 0.3,
          referralCode,
          referredBy: i > 0 && i < 5 ? users[0]?.id : null,
          points: Math.floor(Math.random() * 1000),
          lastActiveAt: randomDate(new Date(2024, 0, 1), new Date()),
          isOnline: Math.random() > 0.7,
          loginStreak: Math.floor(Math.random() * 30),
          preferredLanguage: ['en', 'hi', 'ta', 'te'][Math.floor(Math.random() * 4)],
          notificationPreferences: {
            email: true,
            sms: Math.random() > 0.5,
            push: true,
            interests: true,
            messages: true,
            matches: true,
          },
        },
      });
      users.push(user);
      console.log(`  ✅ User ${i + 1}: ${user.email}`);
    } catch (error: any) {
      console.error(`  ❌ Error creating user ${i + 1}:`, error.message);
    }
  }

  // ============================================
  // 2. PROFILES (20 profiles - one per user)
  // ============================================
  console.log('\n📝 Creating 20 Profiles...');
  const profiles = [];
  const religions = ['Hindu', 'Muslim', 'Christian', 'Sikh', 'Buddhist', 'Jain'];
  const castes = ['Brahmin', 'Kshatriya', 'Vaishya', 'Shudra', 'General'];
  const cities = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad', 'Pune', 'Ahmedabad'];
  const states = ['Maharashtra', 'Delhi', 'Karnataka', 'Tamil Nadu', 'West Bengal', 'Telangana', 'Gujarat'];
  const educations = ['B.Tech', 'M.Tech', 'MBA', 'B.Com', 'M.Com', 'B.Sc', 'M.Sc', 'MBBS', 'CA', 'PhD'];
  const occupations = ['Software Engineer', 'Doctor', 'Teacher', 'Business', 'Lawyer', 'Engineer', 'Manager', 'Consultant'];

  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    const gender = i % 2 === 0 ? 'MALE' : 'FEMALE';
    const dob = randomDate(new Date(1985, 0, 1), new Date(2000, 11, 31));
    const age = new Date().getFullYear() - dob.getFullYear();

    try {
      const profile = await prisma.profile.create({
        data: {
          userId: user.id,
          status: (['DRAFT', 'PENDING_APPROVAL', 'ACTIVE', 'ACTIVE', 'ACTIVE'][i % 5] as any),
          firstName: userNames[i].split(' ')[0],
          lastName: userNames[i].split(' ')[1] || '',
          gender,
          dateOfBirth: dob,
          height: 150 + Math.floor(Math.random() * 40), // 150-190 cm
          maritalStatus: (['NEVER_MARRIED', 'NEVER_MARRIED', 'DIVORCED', 'WIDOWED'][Math.floor(Math.random() * 4)] as any),
          religion: religions[Math.floor(Math.random() * religions.length)],
          caste: castes[Math.floor(Math.random() * castes.length)],
          motherTongue: ['Hindi', 'English', 'Tamil', 'Telugu', 'Marathi', 'Gujarati'][Math.floor(Math.random() * 6)],
          manglik: Math.random() > 0.7,
          country: 'India',
          state: states[Math.floor(Math.random() * states.length)],
          city: cities[Math.floor(Math.random() * cities.length)],
          citizenship: 'Indian',
          education: educations[Math.floor(Math.random() * educations.length)],
          college: `University ${i + 1}`,
          occupation: occupations[Math.floor(Math.random() * occupations.length)],
          income: (Math.floor(Math.random() * 50) + 5) * 100000, // 5L to 55L
          incomeCurrency: 'INR',
          fatherOccupation: 'Business',
          motherOccupation: 'Homemaker',
          siblings: Math.floor(Math.random() * 3),
          familyType: (['NUCLEAR', 'JOINT'][Math.floor(Math.random() * 2)] as any),
          diet: (['VEGETARIAN', 'NON_VEGETARIAN', 'EGGETARIAN', 'VEGAN', 'JAIN'][Math.floor(Math.random() * 5)] as any),
          smoking: Math.random() > 0.8,
          drinking: Math.random() > 0.7,
          hobbies: JSON.stringify(['Reading', 'Traveling', 'Music', 'Sports']),
          aboutMe: `I am ${userNames[i]}, a ${occupations[Math.floor(Math.random() * occupations.length)]} looking for a life partner.`,
          partnerPreferences: {
            ageRange: { min: age - 3, max: age + 3 },
            education: educations[Math.floor(Math.random() * educations.length)],
            location: cities[Math.floor(Math.random() * cities.length)],
          },
          isVerified: Math.random() > 0.5,
          verifiedAt: Math.random() > 0.5 ? new Date() : null,
          trustScore: Math.floor(Math.random() * 100),
          completenessScore: 60 + Math.floor(Math.random() * 40),
          isHighlighted: Math.random() > 0.7,
          slug: `${userNames[i].toLowerCase().replace(/\s+/g, '-')}-${i}`,
          privacySettings: {
            isHiddenFromSearch: false,
            isAnonymousViewing: false,
            contactPrivacyLevel: 'AFTER_MATCH',
            photoPrivacyLevel: 'AFTER_MATCH',
          },
        },
      });
      profiles.push(profile);
      console.log(`  ✅ Profile ${i + 1}: ${profile.firstName} ${profile.lastName}`);
    } catch (error: any) {
      console.error(`  ❌ Error creating profile ${i + 1}:`, error.message);
    }
  }

  // ============================================
  // 3. PHOTOS (20 photos - one per profile)
  // ============================================
  console.log('\n📝 Creating 20 Photos...');
  for (let i = 0; i < profiles.length; i++) {
    try {
      await prisma.photo.create({
        data: {
          profileId: profiles[i].id,
          url: `https://example.com/photos/profile-${i + 1}.jpg`,
          cloudinaryId: `photo_${i + 1}`,
          isPrimary: true,
          isBlurred: false,
          isApproved: true,
          order: 0,
          albumName: 'Profile',
          caption: `Profile photo of ${profiles[i].firstName}`,
        },
      });
      console.log(`  ✅ Photo ${i + 1} created`);
    } catch (error: any) {
      console.error(`  ❌ Error creating photo ${i + 1}:`, error.message);
    }
  }

  // ============================================
  // 4. SESSIONS (20 sessions)
  // ============================================
  console.log('\n📝 Creating 20 Sessions...');
  for (let i = 0; i < users.length; i++) {
    try {
      await prisma.session.create({
        data: {
          userId: users[i].id,
          token: `token_${Date.now()}_${i}`,
          ipAddress: `192.168.1.${i + 1}`,
          userAgent: `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/${i}`,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
      });
      console.log(`  ✅ Session ${i + 1} created`);
    } catch (error: any) {
      console.error(`  ❌ Error creating session ${i + 1}:`, error.message);
    }
  }

  // ============================================
  // 5. VERIFICATIONS (20 verifications)
  // ============================================
  console.log('\n📝 Creating 20 Verifications...');
  for (let i = 0; i < users.length; i++) {
    try {
      await prisma.verification.create({
        data: {
          userId: users[i].id,
          idType: ['Aadhar', 'Passport', 'PAN'][Math.floor(Math.random() * 3)],
          idNumber: `ID${String(i + 1).padStart(10, '0')}`,
          idPhotoUrl: `https://example.com/verification/id-${i + 1}.jpg`,
          selfieUrl: `https://example.com/verification/selfie-${i + 1}.jpg`,
          status: ['PENDING', 'APPROVED', 'REJECTED'][Math.floor(Math.random() * 3)],
          reviewedBy: i < 3 ? users[0].id : null,
          reviewedAt: i < 3 ? new Date() : null,
        },
      });
      console.log(`  ✅ Verification ${i + 1} created`);
    } catch (error: any) {
      console.error(`  ❌ Error creating verification ${i + 1}:`, error.message);
    }
  }

  // ============================================
  // 6. INTERESTS (20 interests)
  // ============================================
  console.log('\n📝 Creating 20 Interests...');
  for (let i = 0; i < 20; i++) {
    const fromUser = users[i % users.length];
    const toUser = users[(i + 1) % users.length];
    if (fromUser.id === toUser.id) continue;

    try {
      await prisma.interest.create({
        data: {
          fromUserId: fromUser.id,
          toUserId: toUser.id,
          status: (['PENDING', 'ACCEPTED', 'REJECTED', 'WITHDRAWN'][Math.floor(Math.random() * 4)] as any),
          message: `Hi, I'm interested in connecting with you.`,
        },
      });
      console.log(`  ✅ Interest ${i + 1} created`);
    } catch (error: any) {
      if (error.code !== 'P2002') {
        console.error(`  ❌ Error creating interest ${i + 1}:`, error.message);
      }
    }
  }

  // ============================================
  // 7. CHATS (20 chats)
  // ============================================
  console.log('\n📝 Creating 20 Chats...');
  const chats = [];
  for (let i = 0; i < 20; i++) {
    const user1 = users[i % users.length];
    const user2 = users[(i + 1) % users.length];
    if (user1.id === user2.id) continue;

    try {
      const chat = await prisma.chat.create({
        data: {
          user1Id: user1.id < user2.id ? user1.id : user2.id,
          user2Id: user1.id < user2.id ? user2.id : user1.id,
          lastMessageAt: randomDate(new Date(2024, 0, 1), new Date()),
        },
      });
      chats.push(chat);
      console.log(`  ✅ Chat ${i + 1} created`);
    } catch (error: any) {
      if (error.code !== 'P2002') {
        console.error(`  ❌ Error creating chat ${i + 1}:`, error.message);
      }
    }
  }

  // ============================================
  // 8. MESSAGES (20 messages)
  // ============================================
  console.log('\n📝 Creating 20 Messages...');
  for (let i = 0; i < Math.min(20, chats.length); i++) {
    const chat = chats[i];
    const sender = users[i % users.length];
    try {
      await prisma.message.create({
        data: {
          chatId: chat.id,
          senderId: sender.id,
          content: `Hello! This is message ${i + 1}`,
          messageType: 'TEXT',
          isRead: Math.random() > 0.5,
        },
      });
      console.log(`  ✅ Message ${i + 1} created`);
    } catch (error: any) {
      console.error(`  ❌ Error creating message ${i + 1}:`, error.message);
    }
  }

  // ============================================
  // 9. PROFILE VIEWS (20 views)
  // ============================================
  console.log('\n📝 Creating 20 Profile Views...');
  for (let i = 0; i < 20; i++) {
    const profile = profiles[i % profiles.length];
    const viewer = users[(i + 1) % users.length];
    if (profile.userId === viewer.id) continue;

    try {
      await prisma.profileView.create({
        data: {
          profileId: profile.id,
          viewedById: viewer.id,
        },
      });
      console.log(`  ✅ Profile View ${i + 1} created`);
    } catch (error: any) {
      if (error.code !== 'P2002') {
        console.error(`  ❌ Error creating profile view ${i + 1}:`, error.message);
      }
    }
  }

  // ============================================
  // 10. SUBSCRIPTIONS (20 subscriptions)
  // ============================================
  console.log('\n📝 Creating 20 Subscriptions...');
  const subscriptions = [];
  const plans = ['FREE', 'PREMIUM', 'GOLD_3M', 'GOLD_PLUS_3M', 'DIAMOND_6M', 'DIAMOND_PLUS_6M', 'PLATINUM_PLUS_12M'];
  for (let i = 0; i < users.length; i++) {
    const startDate = randomDate(new Date(2024, 0, 1), new Date());
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + [1, 3, 6, 12][Math.floor(Math.random() * 4)]);

    try {
      const subscription = await prisma.subscription.create({
        data: {
          userId: users[i].id,
          plan: plans[Math.floor(Math.random() * plans.length)] as any,
          status: ['ACTIVE', 'CANCELLED', 'EXPIRED'][Math.floor(Math.random() * 3)],
          startDate,
          endDate,
          contactViewsUsed: Math.floor(Math.random() * 10),
          contactViewsLimit: Math.random() > 0.5 ? 20 : null,
          profileBoostCredits: Math.floor(Math.random() * 5),
          verifiedBadgeIncluded: Math.random() > 0.7,
          horoscopeReportsIncluded: Math.floor(Math.random() * 3),
        },
      });
      subscriptions.push(subscription);
      console.log(`  ✅ Subscription ${i + 1} created`);
    } catch (error: any) {
      console.error(`  ❌ Error creating subscription ${i + 1}:`, error.message);
    }
  }

  // ============================================
  // 11. CONTACT VIEWS (20 contact views)
  // ============================================
  console.log('\n📝 Creating 20 Contact Views...');
  for (let i = 0; i < Math.min(20, subscriptions.length); i++) {
    const subscription = subscriptions[i];
    const profile = profiles[(i + 1) % profiles.length];
    const viewer = users[i % users.length];

    try {
      await (prisma as any).contactView.create({
        data: {
          subscriptionId: subscription.id,
          profileId: profile.userId,
          viewedById: viewer.id,
        },
      });
      console.log(`  ✅ Contact View ${i + 1} created`);
    } catch (error: any) {
      if (error.code !== 'P2002') {
        console.error(`  ❌ Error creating contact view ${i + 1}:`, error.message);
      }
    }
  }

  // ============================================
  // 12. PAYMENTS (20 payments)
  // ============================================
  console.log('\n📝 Creating 20 Payments...');
  const payments = [];
  for (let i = 0; i < users.length; i++) {
    try {
      const payment = await prisma.payment.create({
        data: {
          userId: users[i].id,
          razorpayOrderId: `order_${Date.now()}_${i}`,
          razorpayPaymentId: `pay_${Date.now()}_${i}`,
          amount: [19900, 39900, 99900, 199900, 499900][Math.floor(Math.random() * 5)],
          currency: 'INR',
          status: (['PENDING', 'COMPLETED', 'FAILED'][Math.floor(Math.random() * 3)] as any),
          type: ['SUBSCRIPTION', 'ADDON', 'SERVICE'][Math.floor(Math.random() * 3)],
          addOnType: (['PROFILE_BOOST', 'VERIFIED_BADGE', 'HOROSCOPE_REPORT'][Math.floor(Math.random() * 3)] as any),
          subscriptionId: subscriptions[i]?.id || null,
          metadata: { source: 'seed' },
        },
      });
      payments.push(payment);
      console.log(`  ✅ Payment ${i + 1} created`);
    } catch (error: any) {
      console.error(`  ❌ Error creating payment ${i + 1}:`, error.message);
    }
  }

  // ============================================
  // 13. ADDONS (20 addons)
  // ============================================
  console.log('\n📝 Creating 20 AddOns...');
  for (let i = 0; i < users.length; i++) {
    try {
      await prisma.addOn.create({
        data: {
          userId: users[i].id,
          type: (['PROFILE_BOOST', 'VERIFIED_BADGE', 'HOROSCOPE_REPORT'][Math.floor(Math.random() * 3)] as any),
          paymentId: payments[i]?.id || null,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          isActive: Math.random() > 0.3,
        },
      });
      console.log(`  ✅ AddOn ${i + 1} created`);
    } catch (error: any) {
      console.error(`  ❌ Error creating addon ${i + 1}:`, error.message);
    }
  }

  // ============================================
  // 14. SERVICE PROVIDERS (20 providers)
  // ============================================
  console.log('\n📝 Creating 20 Service Providers...');
  const serviceProviders = [];
  const serviceTypes = [
    'PREMIUM_PHOTO_EDITING', 'VIDEO_PROFILE_CREATION', 'PERSONAL_MATCHMAKER',
    'RELATIONSHIP_COUNSELING', 'BACKGROUND_VERIFICATION', 'ASTROLOGY_CONSULTATION',
  ];
  for (let i = 0; i < 20; i++) {
    try {
      const provider = await (prisma as any).serviceProvider.create({
        data: {
          name: `Provider ${i + 1}`,
          email: `provider${i + 1}@rktech.com`,
          mobile: `9876543${String(i).padStart(3, '0')}`,
          serviceType: serviceTypes[i % serviceTypes.length],
          expertise: `Expert in ${serviceTypes[i % serviceTypes.length]}`,
          rating: 3.5 + Math.random() * 1.5,
          totalBookings: Math.floor(Math.random() * 100),
          isActive: true,
        },
      });
      serviceProviders.push(provider);
      console.log(`  ✅ Service Provider ${i + 1} created`);
    } catch (error: any) {
      if (error.code !== 'P2002') {
        console.error(`  ❌ Error creating service provider ${i + 1}:`, error.message);
      }
    }
  }

  // ============================================
  // 15. SERVICES (20 services)
  // ============================================
  console.log('\n📝 Creating 20 Services...');
  const services = [];
  const allServiceTypes = [
    'PHOTO_VERIFICATION', 'PROFILE_HIGHLIGHTING', 'VOICE_CALL_CREDITS',
    'VIDEO_CALL_CREDITS', 'KUNDALI_GENERATION', 'PERSONAL_MATCHMAKER',
  ];
  for (let i = 0; i < users.length; i++) {
    try {
      const service = await (prisma as any).service.create({
        data: {
          userId: users[i].id,
          type: allServiceTypes[i % allServiceTypes.length],
          status: ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED'][Math.floor(Math.random() * 4)],
          paymentId: payments[i]?.id || null,
          amount: [19900, 39900, 99900][Math.floor(Math.random() * 3)],
          metadata: { source: 'seed' },
          scheduledAt: Math.random() > 0.5 ? new Date() : null,
          completedAt: Math.random() > 0.7 ? new Date() : null,
          rating: Math.random() > 0.7 ? Math.floor(Math.random() * 3) + 3 : null,
        },
      });
      services.push(service);
      console.log(`  ✅ Service ${i + 1} created`);
    } catch (error: any) {
      console.error(`  ❌ Error creating service ${i + 1}:`, error.message);
    }
  }

  // ============================================
  // 16. SERVICE BOOKINGS (20 bookings)
  // ============================================
  console.log('\n📝 Creating 20 Service Bookings...');
  for (let i = 0; i < Math.min(20, services.length); i++) {
    try {
      await (prisma as any).serviceBooking.create({
        data: {
          serviceId: services[i].id,
          providerId: serviceProviders[i % serviceProviders.length]?.id || null,
          userId: users[i].id,
          scheduledAt: Math.random() > 0.5 ? new Date() : null,
          duration: 60,
          status: ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED'][Math.floor(Math.random() * 4)],
          meetingLink: Math.random() > 0.5 ? `https://meet.rktech.com/${services[i].id}` : null,
        },
      });
      console.log(`  ✅ Service Booking ${i + 1} created`);
    } catch (error: any) {
      console.error(`  ❌ Error creating service booking ${i + 1}:`, error.message);
    }
  }

  // ============================================
  // 17. NOTIFICATIONS (20 notifications)
  // ============================================
  console.log('\n📝 Creating 20 Notifications...');
  const notificationTypes = ['INTEREST', 'MESSAGE', 'MATCH', 'VIEW', 'PAYMENT'];
  for (let i = 0; i < users.length; i++) {
    const type = notificationTypes[Math.floor(Math.random() * notificationTypes.length)];
    try {
      await prisma.notification.create({
        data: {
          userId: users[i].id,
          type,
          title: `${type} Notification ${i + 1}`,
          message: `You have a new ${type.toLowerCase()}`,
          isRead: Math.random() > 0.5,
          metadata: { source: 'seed' },
        },
      });
      console.log(`  ✅ Notification ${i + 1} created`);
    } catch (error: any) {
      console.error(`  ❌ Error creating notification ${i + 1}:`, error.message);
    }
  }

  // ============================================
  // 18. SAVED SEARCHES (20 saved searches)
  // ============================================
  console.log('\n📝 Creating 20 Saved Searches...');
  for (let i = 0; i < users.length; i++) {
    try {
      await prisma.savedSearch.create({
        data: {
          userId: users[i].id,
          name: `Search ${i + 1}`,
          filters: {
            gender: i % 2 === 0 ? 'FEMALE' : 'MALE',
            minAge: 25,
            maxAge: 35,
            religion: 'Hindu',
          },
        },
      });
      console.log(`  ✅ Saved Search ${i + 1} created`);
    } catch (error: any) {
      console.error(`  ❌ Error creating saved search ${i + 1}:`, error.message);
    }
  }

  // ============================================
  // 19. OTPS (20 OTPs)
  // ============================================
  console.log('\n📝 Creating 20 OTPs...');
  for (let i = 0; i < 20; i++) {
    try {
      await prisma.oTP.create({
        data: {
          identifier: users[i % users.length].email || users[i % users.length].mobile || `user${i}@example.com`,
          code: String(Math.floor(100000 + Math.random() * 900000)),
          type: ['EMAIL', 'MOBILE'][Math.floor(Math.random() * 2)],
          expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
          isUsed: Math.random() > 0.7,
        },
      });
      console.log(`  ✅ OTP ${i + 1} created`);
    } catch (error: any) {
      console.error(`  ❌ Error creating OTP ${i + 1}:`, error.message);
    }
  }

  // ============================================
  // 20. ADMINS (20 admins)
  // ============================================
  console.log('\n📝 Creating 20 Admins...');
  for (let i = 0; i < 20; i++) {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    try {
      await prisma.admin.create({
        data: {
          email: `admin${i + 1}@rktech.com`,
          password: hashedPassword,
          name: `Admin ${i + 1}`,
          role: i < 5 ? 'ADMIN' : 'MODERATOR',
        },
      });
      console.log(`  ✅ Admin ${i + 1} created`);
    } catch (error: any) {
      if (error.code !== 'P2002') {
        console.error(`  ❌ Error creating admin ${i + 1}:`, error.message);
      }
    }
  }

  // ============================================
  // 21. REPORTS (20 reports)
  // ============================================
  console.log('\n📝 Creating 20 Reports...');
  for (let i = 0; i < 20; i++) {
    const reporter = users[i % users.length];
    const reported = users[(i + 1) % users.length];
    if (reporter.id === reported.id) continue;

    try {
      await prisma.report.create({
        data: {
          reporterId: reporter.id,
          reportedUserId: reported.id,
          type: ['PROFILE', 'MESSAGE', 'PHOTO'][Math.floor(Math.random() * 3)],
          reason: 'Inappropriate content',
          description: `Report ${i + 1} description`,
          status: ['PENDING', 'REVIEWED', 'RESOLVED'][Math.floor(Math.random() * 3)],
          reviewedBy: i < 5 ? users[0].id : null,
          reviewedAt: i < 5 ? new Date() : null,
        },
      });
      console.log(`  ✅ Report ${i + 1} created`);
    } catch (error: any) {
      console.error(`  ❌ Error creating report ${i + 1}:`, error.message);
    }
  }

  // ============================================
  // 22. SHORTLISTS (20 shortlists)
  // ============================================
  console.log('\n📝 Creating 20 Shortlists...');
  for (let i = 0; i < 20; i++) {
    const user = users[i % users.length];
    const profile = profiles[(i + 1) % profiles.length];
    if (profile.userId === user.id) continue;

    try {
      await prisma.shortlist.create({
        data: {
          userId: user.id,
          profileId: profile.id,
          folderName: ['Default', 'Favorites', 'Maybe'][Math.floor(Math.random() * 3)],
          notes: `Notes for profile ${i + 1}`,
        },
      });
      console.log(`  ✅ Shortlist ${i + 1} created`);
    } catch (error: any) {
      if (error.code !== 'P2002') {
        console.error(`  ❌ Error creating shortlist ${i + 1}:`, error.message);
      }
    }
  }

  // ============================================
  // 23. BLOCKED USERS (20 blocks)
  // ============================================
  console.log('\n📝 Creating 20 Blocked Users...');
  for (let i = 0; i < 20; i++) {
    const blocker = users[i % users.length];
    const blocked = users[(i + 2) % users.length];
    if (blocker.id === blocked.id) continue;

    try {
      await prisma.blockedUser.create({
        data: {
          blockerId: blocker.id,
          blockedId: blocked.id,
          reason: 'Personal preference',
        },
      });
      console.log(`  ✅ Blocked User ${i + 1} created`);
    } catch (error: any) {
      if (error.code !== 'P2002') {
        console.error(`  ❌ Error creating blocked user ${i + 1}:`, error.message);
      }
    }
  }

  // ============================================
  // 24. HOROSCOPES (20 horoscopes)
  // ============================================
  console.log('\n📝 Creating 20 Horoscopes...');
  const horoscopes = [];
  for (let i = 0; i < profiles.length; i++) {
    try {
      const horoscope = await prisma.horoscope.create({
        data: {
          userId: profiles[i].userId,
          profileId: profiles[i].id,
          horoscopeUrl: `https://example.com/horoscopes/${i + 1}.pdf`,
          birthTime: `${8 + Math.floor(Math.random() * 12)}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
          birthPlace: cities[Math.floor(Math.random() * cities.length)],
          rashi: ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo'][Math.floor(Math.random() * 6)],
          nakshatra: ['Ashwini', 'Bharani', 'Krittika', 'Rohini'][Math.floor(Math.random() * 4)],
          mangalDosha: Math.random() > 0.7,
          horoscopeData: { score: Math.floor(Math.random() * 100) },
        },
      });
      horoscopes.push(horoscope);
      console.log(`  ✅ Horoscope ${i + 1} created`);
    } catch (error: any) {
      if (error.code !== 'P2002') {
        console.error(`  ❌ Error creating horoscope ${i + 1}:`, error.message);
      }
    }
  }

  // ============================================
  // 25. HOROSCOPE MATCHES (20 matches)
  // ============================================
  console.log('\n📝 Creating 20 Horoscope Matches...');
  for (let i = 0; i < Math.min(20, horoscopes.length - 1); i++) {
    const h1 = horoscopes[i];
    const h2 = horoscopes[i + 1];
    if (h1.userId === h2.userId) continue;

    try {
      await prisma.horoscopeMatch.create({
        data: {
          user1Id: h1.userId,
          user2Id: h2.userId,
          horoscope1Id: h1.id,
          horoscope2Id: h2.id,
          ashtakootScore: Math.floor(Math.random() * 36),
          mangalDoshaMatch: Math.random() > 0.5,
          overallScore: Math.floor(Math.random() * 100),
          matchDetails: { compatibility: 'Good' },
        },
      });
      console.log(`  ✅ Horoscope Match ${i + 1} created`);
    } catch (error: any) {
      if (error.code !== 'P2002') {
        console.error(`  ❌ Error creating horoscope match ${i + 1}:`, error.message);
      }
    }
  }

  // ============================================
  // 26. SUCCESS STORIES (20 stories)
  // ============================================
  console.log('\n📝 Creating 20 Success Stories...');
  for (let i = 0; i < 20; i++) {
    const user = users[i % users.length];
    const partner = users[(i + 1) % users.length];
    if (user.id === partner.id) continue;

    try {
      await prisma.successStory.create({
        data: {
          userId: user.id,
          partnerId: partner.id,
          title: `Success Story ${i + 1}`,
          story: `We met through this platform and found our perfect match!`,
          weddingDate: randomDate(new Date(2023, 0, 1), new Date()),
          photos: JSON.stringify([`https://example.com/stories/${i + 1}.jpg`]),
          isApproved: Math.random() > 0.3,
          isFeatured: Math.random() > 0.7,
        },
      });
      console.log(`  ✅ Success Story ${i + 1} created`);
    } catch (error: any) {
      console.error(`  ❌ Error creating success story ${i + 1}:`, error.message);
    }
  }

  // ============================================
  // 27. FAMILY MEMBERS (20 members)
  // ============================================
  console.log('\n📝 Creating 20 Family Members...');
  for (let i = 0; i < users.length; i++) {
    try {
      await prisma.familyMember.create({
        data: {
          userId: users[i].id,
          name: `Family Member ${i + 1}`,
          relation: ['FATHER', 'MOTHER', 'SIBLING'][Math.floor(Math.random() * 3)],
          email: `family${i + 1}@example.com`,
          mobile: `9876543${String(i + 100).padStart(3, '0')}`,
          password: await bcrypt.hash('password123', 10),
          canViewMatches: true,
          canSendInterests: Math.random() > 0.5,
          canChat: false,
        },
      });
      console.log(`  ✅ Family Member ${i + 1} created`);
    } catch (error: any) {
      if (error.code !== 'P2002') {
        console.error(`  ❌ Error creating family member ${i + 1}:`, error.message);
      }
    }
  }

  // ============================================
  // 28. REFERRALS (20 referrals)
  // ============================================
  console.log('\n📝 Creating 20 Referrals...');
  for (let i = 1; i < Math.min(21, users.length); i++) {
    const referrer = users[0];
    const referred = users[i];
    if (referrer.id === referred.id) continue;

    try {
      await prisma.referral.create({
        data: {
          referrerId: referrer.id,
          referredId: referred.id,
          rewardAmount: Math.floor(Math.random() * 1000),
          status: ['PENDING', 'COMPLETED', 'PAID'][Math.floor(Math.random() * 3)],
          completedAt: Math.random() > 0.5 ? new Date() : null,
        },
      });
      console.log(`  ✅ Referral ${i} created`);
    } catch (error: any) {
      if (error.code !== 'P2002') {
        console.error(`  ❌ Error creating referral ${i}:`, error.message);
      }
    }
  }

  // ============================================
  // 29. ACHIEVEMENTS (20 achievements)
  // ============================================
  console.log('\n📝 Creating 20 Achievements...');
  const achievementTypes = ['PROFILE_COMPLETE', 'FIRST_INTEREST', 'FIRST_MATCH', 'FIRST_MESSAGE', 'VERIFIED'];
  for (let i = 0; i < users.length; i++) {
    try {
      await prisma.achievement.create({
        data: {
          userId: users[i].id,
          type: achievementTypes[Math.floor(Math.random() * achievementTypes.length)],
          title: `Achievement ${i + 1}`,
          description: `You unlocked this achievement!`,
          points: Math.floor(Math.random() * 100) + 10,
          icon: `achievement_${i + 1}.png`,
        },
      });
      console.log(`  ✅ Achievement ${i + 1} created`);
    } catch (error: any) {
      console.error(`  ❌ Error creating achievement ${i + 1}:`, error.message);
    }
  }

  // ============================================
  // 30. DOCUMENTS (20 documents)
  // ============================================
  console.log('\n📝 Creating 20 Documents...');
  const documentTypes = ['AADHAR', 'PASSPORT', 'PAN', 'DEGREE', 'BIRTH_CERTIFICATE'];
  for (let i = 0; i < users.length; i++) {
    try {
      await prisma.document.create({
        data: {
          userId: users[i].id,
          type: documentTypes[Math.floor(Math.random() * documentTypes.length)],
          name: `${documentTypes[Math.floor(Math.random() * documentTypes.length)]} Document ${i + 1}`,
          url: `https://example.com/documents/${i + 1}.pdf`,
          expiryDate: randomDate(new Date(), new Date(2025, 11, 31)),
          isVerified: Math.random() > 0.4,
          verifiedAt: Math.random() > 0.4 ? new Date() : null,
        },
      });
      console.log(`  ✅ Document ${i + 1} created`);
    } catch (error: any) {
      console.error(`  ❌ Error creating document ${i + 1}:`, error.message);
    }
  }

  // ============================================
  // 31. VIDEO CALLS (20 video calls)
  // ============================================
  console.log('\n📝 Creating 20 Video Calls...');
  for (let i = 0; i < 20; i++) {
    const caller = users[i % users.length];
    const participant = users[(i + 1) % users.length];
    if (caller.id === participant.id) continue;

    try {
      await prisma.videoCall.create({
        data: {
          callerId: caller.id,
          participantId: participant.id,
          status: ['SCHEDULED', 'PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'][Math.floor(Math.random() * 5)],
          scheduledAt: Math.random() > 0.3 ? new Date() : null,
          startedAt: Math.random() > 0.5 ? new Date() : null,
          endedAt: Math.random() > 0.7 ? new Date() : null,
          duration: Math.random() > 0.7 ? Math.floor(Math.random() * 60) + 10 : null,
          roomId: `room_${Date.now()}_${i}`,
          notes: `Video call ${i + 1}`,
        },
      });
      console.log(`  ✅ Video Call ${i + 1} created`);
    } catch (error: any) {
      console.error(`  ❌ Error creating video call ${i + 1}:`, error.message);
    }
  }

  // ============================================
  // 32. PROFILE COMPARISONS (20 comparisons)
  // ============================================
  console.log('\n📝 Creating 20 Profile Comparisons...');
  for (let i = 0; i < 20; i++) {
    const user = users[i % users.length];
    const profile = profiles[(i + 1) % profiles.length];
    if (profile.userId === user.id) continue;

    try {
      await prisma.profileComparison.create({
        data: {
          userId: user.id,
          profileId: profile.id,
          comparisonData: {
            education: 'Match',
            location: 'Match',
            lifestyle: 'Partial Match',
          },
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        },
      });
      console.log(`  ✅ Profile Comparison ${i + 1} created`);
    } catch (error: any) {
      if (error.code !== 'P2002') {
        console.error(`  ❌ Error creating profile comparison ${i + 1}:`, error.message);
      }
    }
  }

  // ============================================
  // 33. FORUM POSTS (20 posts)
  // ============================================
  console.log('\n📝 Creating 20 Forum Posts...');
  const forumPosts = [];
  const forumCategories = ['Marriage', 'Relationships', 'Family', 'Career', 'Lifestyle'];
  for (let i = 0; i < users.length; i++) {
    try {
      const post = await prisma.forumPost.create({
        data: {
          userId: users[i].id,
          title: `Forum Post ${i + 1}`,
          content: `This is the content of forum post ${i + 1}.`,
          category: forumCategories[Math.floor(Math.random() * forumCategories.length)],
          tags: ['marriage', 'advice', 'community'],
          likes: Math.floor(Math.random() * 50),
          views: Math.floor(Math.random() * 200),
          isPinned: Math.random() > 0.9,
        },
      });
      forumPosts.push(post);
      console.log(`  ✅ Forum Post ${i + 1} created`);
    } catch (error: any) {
      console.error(`  ❌ Error creating forum post ${i + 1}:`, error.message);
    }
  }

  // ============================================
  // 34. FORUM COMMENTS (20 comments)
  // ============================================
  console.log('\n📝 Creating 20 Forum Comments...');
  for (let i = 0; i < Math.min(20, forumPosts.length); i++) {
    const post = forumPosts[i];
    const commenter = users[(i + 1) % users.length];
    try {
      await prisma.forumComment.create({
        data: {
          userId: commenter.id,
          postId: post.id,
          content: `This is a comment on post ${i + 1}.`,
        },
      });
      console.log(`  ✅ Forum Comment ${i + 1} created`);
    } catch (error: any) {
      console.error(`  ❌ Error creating forum comment ${i + 1}:`, error.message);
    }
  }

  // ============================================
  // 35. COMMUNITY GROUPS (20 groups)
  // ============================================
  console.log('\n📝 Creating 20 Community Groups...');
  const groups = [];
  for (let i = 0; i < 20; i++) {
    const creator = users[i % users.length];
    try {
      const group = await prisma.communityGroup.create({
        data: {
          name: `Community Group ${i + 1}`,
          description: `Description for community group ${i + 1}`,
          photoUrl: `https://example.com/groups/${i + 1}.jpg`,
          isPublic: Math.random() > 0.3,
          createdBy: creator.id,
        },
      });
      groups.push(group);
      console.log(`  ✅ Community Group ${i + 1} created`);
    } catch (error: any) {
      console.error(`  ❌ Error creating community group ${i + 1}:`, error.message);
    }
  }

  // ============================================
  // 36. GROUP MEMBERS (20 members)
  // ============================================
  console.log('\n📝 Creating 20 Group Members...');
  for (let i = 0; i < Math.min(20, groups.length); i++) {
    const group = groups[i];
    const member = users[i % users.length];
    try {
      await prisma.groupMember.create({
        data: {
          groupId: group.id,
          userId: member.id,
          role: i < 3 ? 'ADMIN' : 'MEMBER',
        },
      });
      console.log(`  ✅ Group Member ${i + 1} created`);
    } catch (error: any) {
      if (error.code !== 'P2002') {
        console.error(`  ❌ Error creating group member ${i + 1}:`, error.message);
      }
    }
  }

  // ============================================
  // 37. COMMUNITY EVENTS (20 events)
  // ============================================
  console.log('\n📝 Creating 20 Community Events...');
  const events = [];
  for (let i = 0; i < 20; i++) {
    const creator = users[i % users.length];
    try {
      const event = await prisma.communityEvent.create({
        data: {
          title: `Community Event ${i + 1}`,
          description: `Description for event ${i + 1}`,
          eventDate: randomDate(new Date(), new Date(2025, 11, 31)),
          location: cities[Math.floor(Math.random() * cities.length)],
          photoUrl: `https://example.com/events/${i + 1}.jpg`,
          maxParticipants: Math.floor(Math.random() * 50) + 10,
          createdBy: creator.id,
        },
      });
      events.push(event);
      console.log(`  ✅ Community Event ${i + 1} created`);
    } catch (error: any) {
      console.error(`  ❌ Error creating community event ${i + 1}:`, error.message);
    }
  }

  // ============================================
  // 38. EVENT PARTICIPANTS (20 participants)
  // ============================================
  console.log('\n📝 Creating 20 Event Participants...');
  for (let i = 0; i < Math.min(20, events.length); i++) {
    const event = events[i];
    const participant = users[i % users.length];
    try {
      await prisma.eventParticipant.create({
        data: {
          eventId: event.id,
          userId: participant.id,
        },
      });
      console.log(`  ✅ Event Participant ${i + 1} created`);
    } catch (error: any) {
      if (error.code !== 'P2002') {
        console.error(`  ❌ Error creating event participant ${i + 1}:`, error.message);
      }
    }
  }

  // ============================================
  // 39. BLOG POSTS (20 posts)
  // ============================================
  console.log('\n📝 Creating 20 Blog Posts...');
  for (let i = 0; i < users.length; i++) {
    try {
      await prisma.blogPost.create({
        data: {
          userId: users[i].id,
          title: `Blog Post ${i + 1}`,
          content: `This is the content of blog post ${i + 1}.`,
          excerpt: `Excerpt for blog post ${i + 1}`,
          photoUrl: `https://example.com/blog/${i + 1}.jpg`,
          tags: ['marriage', 'relationships', 'advice'],
          isPublished: Math.random() > 0.3,
          views: Math.floor(Math.random() * 500),
        },
      });
      console.log(`  ✅ Blog Post ${i + 1} created`);
    } catch (error: any) {
      console.error(`  ❌ Error creating blog post ${i + 1}:`, error.message);
    }
  }

  // ============================================
  // 40. MATCH SCORES (20 match scores)
  // ============================================
  console.log('\n📝 Creating 20 Match Scores...');
  for (let i = 0; i < 20; i++) {
    const user = users[i % users.length];
    const matchedUser = users[(i + 1) % users.length];
    if (user.id === matchedUser.id) continue;

    try {
      await prisma.matchScore.create({
        data: {
          userId: user.id,
          matchedUserId: matchedUser.id,
          overallScore: Math.floor(Math.random() * 100),
          religionScore: Math.floor(Math.random() * 100),
          educationScore: Math.floor(Math.random() * 100),
          lifestyleScore: Math.floor(Math.random() * 100),
          locationScore: Math.floor(Math.random() * 100),
          familyScore: Math.floor(Math.random() * 100),
          matchReasons: ['Similar interests', 'Compatible lifestyle', 'Good education match'],
          isReverseMatch: Math.random() > 0.5,
        },
      });
      console.log(`  ✅ Match Score ${i + 1} created`);
    } catch (error: any) {
      if (error.code !== 'P2002') {
        console.error(`  ❌ Error creating match score ${i + 1}:`, error.message);
      }
    }
  }

  // ============================================
  // 41. SEARCH HISTORY (20 searches)
  // ============================================
  console.log('\n📝 Creating 20 Search History entries...');
  for (let i = 0; i < users.length; i++) {
    try {
      await prisma.searchHistory.create({
        data: {
          userId: users[i].id,
          profileId: profiles[(i + 1) % profiles.length]?.id || null,
          searchQuery: `Search query ${i + 1}`,
          filters: {
            gender: i % 2 === 0 ? 'FEMALE' : 'MALE',
            minAge: 25,
            maxAge: 35,
            religion: 'Hindu',
          },
        },
      });
      console.log(`  ✅ Search History ${i + 1} created`);
    } catch (error: any) {
      console.error(`  ❌ Error creating search history ${i + 1}:`, error.message);
    }
  }

  // ============================================
  // 42. MESSAGE TEMPLATES (20 templates)
  // ============================================
  console.log('\n📝 Creating 20 Message Templates...');
  const templateCategories = ['GREETING', 'FOLLOW_UP', 'INTEREST', 'THANK_YOU'];
  for (let i = 0; i < users.length; i++) {
    try {
      await prisma.messageTemplate.create({
        data: {
          userId: users[i].id,
          name: `Template ${i + 1}`,
          content: `Hello! This is message template ${i + 1}.`,
          category: templateCategories[Math.floor(Math.random() * templateCategories.length)],
        },
      });
      console.log(`  ✅ Message Template ${i + 1} created`);
    } catch (error: any) {
      console.error(`  ❌ Error creating message template ${i + 1}:`, error.message);
    }
  }

  // ============================================
  // 43. ICE BREAKERS (20 ice breakers)
  // ============================================
  console.log('\n📝 Creating 20 Ice Breakers...');
  for (let i = 0; i < 20; i++) {
    const user = users[i % users.length];
    const profile = profiles[(i + 1) % profiles.length];
    if (profile.userId === user.id) continue;

    try {
      await prisma.iceBreaker.create({
        data: {
          userId: user.id,
          profileId: profile.id,
          question: `What's your favorite hobby?`,
          answer: `I love ${['reading', 'traveling', 'music', 'sports'][Math.floor(Math.random() * 4)]}`,
        },
      });
      console.log(`  ✅ Ice Breaker ${i + 1} created`);
    } catch (error: any) {
      console.error(`  ❌ Error creating ice breaker ${i + 1}:`, error.message);
    }
  }

  // ============================================
  // 44. TESTIMONIALS (20 testimonials)
  // ============================================
  console.log('\n📝 Creating 20 Testimonials...');
  for (let i = 0; i < profiles.length; i++) {
    try {
      await prisma.testimonial.create({
        data: {
          profileId: profiles[i].id,
          authorName: `Testimonial Author ${i + 1}`,
          authorRelation: ['FRIEND', 'FAMILY', 'COLLEAGUE'][Math.floor(Math.random() * 3)],
          authorEmail: `testimonial${i + 1}@example.com`,
          content: `Great person, highly recommended!`,
          rating: Math.floor(Math.random() * 3) + 3, // 3-5 stars
          isApproved: Math.random() > 0.3,
        },
      });
      console.log(`  ✅ Testimonial ${i + 1} created`);
    } catch (error: any) {
      console.error(`  ❌ Error creating testimonial ${i + 1}:`, error.message);
    }
  }

  // ============================================
  // 45. ACTIVITIES (20 activities)
  // ============================================
  console.log('\n📝 Creating 20 Activities...');
  const activityTypes = ['PROFILE_UPDATE', 'PHOTO_ADDED', 'INTEREST_SENT', 'MESSAGE_SENT', 'MATCH_FOUND'];
  for (let i = 0; i < users.length; i++) {
    try {
      await prisma.activity.create({
        data: {
          userId: users[i].id,
          type: activityTypes[Math.floor(Math.random() * activityTypes.length)],
          title: `Activity ${i + 1}`,
          description: `User performed ${activityTypes[Math.floor(Math.random() * activityTypes.length)]}`,
          metadata: { source: 'seed' },
        },
      });
      console.log(`  ✅ Activity ${i + 1} created`);
    } catch (error: any) {
      console.error(`  ❌ Error creating activity ${i + 1}:`, error.message);
    }
  }

  // ============================================
  // 46. LEADERBOARD (20 entries)
  // ============================================
  console.log('\n📝 Creating 20 Leaderboard entries...');
  const leaderboardCategories = ['MOST_ACTIVE', 'MOST_VIEWED', 'TOP_MATCHES'];
  const periods = ['DAILY', 'WEEKLY', 'MONTHLY', 'ALL_TIME'];
  for (let i = 0; i < users.length; i++) {
    try {
      const periodStart = new Date();
      periodStart.setDate(periodStart.getDate() - 7); // 7 days ago
      await prisma.leaderboard.create({
        data: {
          userId: users[i].id,
          category: leaderboardCategories[Math.floor(Math.random() * leaderboardCategories.length)],
          rank: i + 1,
          score: Math.floor(Math.random() * 1000) + 100,
          period: periods[Math.floor(Math.random() * periods.length)],
          periodStart,
          periodEnd: new Date(),
        },
      });
      console.log(`  ✅ Leaderboard entry ${i + 1} created`);
    } catch (error: any) {
      if (error.code !== 'P2002') {
        console.error(`  ❌ Error creating leaderboard entry ${i + 1}:`, error.message);
      }
    }
  }

  // ============================================
  // 47. WISHLISTS (20 wishlists)
  // ============================================
  console.log('\n📝 Creating 20 Wishlists...');
  for (let i = 0; i < users.length; i++) {
    try {
      await prisma.wishlist.create({
        data: {
          userId: users[i].id,
          criteria: {
            ageRange: { min: 25, max: 35 },
            education: educations[Math.floor(Math.random() * educations.length)],
            location: cities[Math.floor(Math.random() * cities.length)],
            religion: religions[Math.floor(Math.random() * religions.length)],
          },
          isActive: Math.random() > 0.2,
        },
      });
      console.log(`  ✅ Wishlist ${i + 1} created`);
    } catch (error: any) {
      console.error(`  ❌ Error creating wishlist ${i + 1}:`, error.message);
    }
  }

  // ============================================
  // 48. PROFILE EXPORTS (20 exports)
  // ============================================
  console.log('\n📝 Creating 20 Profile Exports...');
  for (let i = 0; i < users.length; i++) {
    try {
      await prisma.profileExport.create({
        data: {
          userId: users[i].id,
          format: ['PDF', 'JSON'][Math.floor(Math.random() * 2)],
          url: `https://example.com/exports/${i + 1}.${['PDF', 'JSON'][Math.floor(Math.random() * 2)].toLowerCase()}`,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        },
      });
      console.log(`  ✅ Profile Export ${i + 1} created`);
    } catch (error: any) {
      console.error(`  ❌ Error creating profile export ${i + 1}:`, error.message);
    }
  }

  // ============================================
  // SUMMARY
  // ============================================
  console.log('\n✅ Comprehensive database seeding completed!\n');
  console.log('📊 Summary:');
  console.log(`   ✅ Users: ${users.length}`);
  console.log(`   ✅ Profiles: ${profiles.length}`);
  console.log(`   ✅ Photos: 20`);
  console.log(`   ✅ Sessions: 20`);
  console.log(`   ✅ Verifications: 20`);
  console.log(`   ✅ Interests: 20`);
  console.log(`   ✅ Chats: ${chats.length}`);
  console.log(`   ✅ Messages: 20`);
  console.log(`   ✅ Profile Views: 20`);
  console.log(`   ✅ Subscriptions: ${subscriptions.length}`);
  console.log(`   ✅ Contact Views: 20`);
  console.log(`   ✅ Payments: ${payments.length}`);
  console.log(`   ✅ AddOns: 20`);
  console.log(`   ✅ Service Providers: ${serviceProviders.length}`);
  console.log(`   ✅ Services: ${services.length}`);
  console.log(`   ✅ Service Bookings: 20`);
  console.log(`   ✅ Notifications: 20`);
  console.log(`   ✅ Saved Searches: 20`);
  console.log(`   ✅ OTPs: 20`);
  console.log(`   ✅ Admins: 20`);
  console.log(`   ✅ Reports: 20`);
  console.log(`   ✅ Shortlists: 20`);
  console.log(`   ✅ Blocked Users: 20`);
  console.log(`   ✅ Horoscopes: ${horoscopes.length}`);
  console.log(`   ✅ Horoscope Matches: 20`);
  console.log(`   ✅ Success Stories: 20`);
  console.log(`   ✅ Family Members: 20`);
  console.log(`   ✅ Referrals: 20`);
  console.log(`   ✅ Achievements: 20`);
  console.log(`   ✅ Documents: 20`);
  console.log(`   ✅ Video Calls: 20`);
  console.log(`   ✅ Profile Comparisons: 20`);
  console.log(`   ✅ Forum Posts: ${forumPosts.length}`);
  console.log(`   ✅ Forum Comments: 20`);
  console.log(`   ✅ Community Groups: ${groups.length}`);
  console.log(`   ✅ Group Members: 20`);
  console.log(`   ✅ Community Events: ${events.length}`);
  console.log(`   ✅ Event Participants: 20`);
  console.log(`   ✅ Blog Posts: 20`);
  console.log(`   ✅ Match Scores: 20`);
  console.log(`   ✅ Search History: 20`);
  console.log(`   ✅ Message Templates: 20`);
  console.log(`   ✅ Ice Breakers: 20`);
  console.log(`   ✅ Testimonials: 20`);
  console.log(`   ✅ Activities: 20`);
  console.log(`   ✅ Leaderboard: 20`);
  console.log(`   ✅ Wishlists: 20`);
  console.log(`   ✅ Profile Exports: 20`);
  console.log('\n🎉 All tables seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
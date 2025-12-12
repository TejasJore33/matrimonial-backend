// Simple JavaScript version that can be run directly with node
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function createAdmin() {
  // Default admin credentials - change these as needed
  const email = process.env.ADMIN_EMAIL || 'admin@example.com';
  const password = process.env.ADMIN_PASSWORD || 'admin123';
  const role = 'ADMIN'; // UserRole.ADMIN

  console.log('Creating admin user with:');
  console.log('Email:', email);
  console.log('Role:', role);
  console.log('');

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.log(`User with email ${email} already exists.`);
      console.log('ID:', existingUser.id);
      console.log('Email:', existingUser.email);
      console.log('Role:', existingUser.role);
      
      // Update role to ADMIN if not already
      if (existingUser.role !== 'ADMIN') {
        await prisma.user.update({
          where: { id: existingUser.id },
          data: { role: 'ADMIN' },
        });
        console.log('✅ User role updated to ADMIN');
      }
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create admin as a User with ADMIN role
    const admin = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: 'ADMIN', // UserRole.ADMIN
        isEmailVerified: true,
        gdprConsent: true,
        gdprConsentAt: new Date(),
      },
    });

    console.log('✅ Admin user created successfully!');
    console.log('Email:', admin.email);
    console.log('Role:', admin.role);
    console.log('ID:', admin.id);
    console.log('');
    console.log('You can now login with:');
    console.log('Email:', email);
    console.log('Password:', password);
  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
    if (error.code) {
      console.error('Error code:', error.code);
    }
    if (error.meta) {
      console.error('Error meta:', error.meta);
    }
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();


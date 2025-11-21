const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function createLiliumAccount() {
  try {
    console.log('Creating Lilium internal team account...');

    // Hash the password
    const hashedPassword = await bcrypt.hash('lilium@123', 10);
    console.log('Password hashed successfully');

    // Create or update the Lilium account
    const user = await prisma.user.upsert({
      where: { email: 'lilium@lilium.iq' },
      update: {
        password: hashedPassword,
        name: 'Lilium Team',
        businessName: 'Lilium Development',
        phone: '+9647901234567',
        role: 'SUPER_ADMIN',
        zones: ['KARKH', 'RUSAFA'],
        isActive: true,
        emailVerified: true,
        phoneVerified: true,
      },
      create: {
        email: 'lilium@lilium.iq',
        password: hashedPassword,
        name: 'Lilium Team',
        businessName: 'Lilium Development',
        phone: '+9647901234567',
        role: 'SUPER_ADMIN',
        zones: ['KARKH', 'RUSAFA'],
        isActive: true,
        emailVerified: true,
        phoneVerified: true,
      },
    });

    console.log('✅ Lilium account created successfully!');
    console.log('Account details:');
    console.log('=====================================');
    console.log('Email: lilium@lilium.iq');
    console.log('Password: lilium@123');
    console.log('Role: SUPER_ADMIN');
    console.log('ID:', user.id);
    console.log('=====================================');
    console.log('\n🔐 This account can:');
    console.log('1. Login to dashboard at /api/auth/login/dashboard');
    console.log('2. Login to internal API at /api/internal/login');
    console.log('3. Create vendor and shop owner accounts through internal API');
    console.log('\n📌 Internal API Endpoints:');
    console.log('- POST /api/internal/login - Login to internal system');
    console.log('- POST /api/internal/users/vendor - Create vendor account');
    console.log('- POST /api/internal/users/shop-owner - Create shop owner account');
    console.log('- POST /api/internal/companies - Create company');
    console.log('- GET /api/internal/users - List all users');

  } catch (error) {
    console.error('❌ Error creating Lilium account:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createLiliumAccount();
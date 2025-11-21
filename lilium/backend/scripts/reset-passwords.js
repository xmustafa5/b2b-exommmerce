const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  // Default password for all users
  const defaultPassword = 'Test@123';
  const hashedPassword = await bcrypt.hash(defaultPassword, 10);

  // Update all users with the default password
  const result = await prisma.user.updateMany({
    data: {
      password: hashedPassword
    }
  });

  console.log(`Updated ${result.count} users with password: ${defaultPassword}`);

  // Also make sure lilium@lilium.iq has the correct password
  const liliumPassword = await bcrypt.hash('lilium@123', 10);
  await prisma.user.update({
    where: { email: 'lilium@lilium.iq' },
    data: { password: liliumPassword }
  });

  console.log('Reset lilium@lilium.iq password to: lilium@123');

  // List all users
  const users = await prisma.user.findMany({
    select: {
      email: true,
      role: true,
      name: true
    }
  });

  console.log('\nAll users now have these credentials:');
  users.forEach(user => {
    const password = user.email === 'lilium@lilium.iq' ? 'lilium@123' : defaultPassword;
    console.log(`  ${user.email} (${user.role}): ${password}`);
  });
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());

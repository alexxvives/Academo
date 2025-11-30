import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create platform settings
  await prisma.platformSettings.upsert({
    where: { id: 'platform_settings' },
    update: {},
    create: {
      id: 'platform_settings',
      defaultMaxWatchTimeMultiplier: 2.0,
    },
  });

  console.log('✅ Platform settings created');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@academyhive.com' },
    update: {},
    create: {
      email: 'admin@academyhive.com',
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
    },
  });

  console.log('✅ Admin user created: admin@academyhive.com / admin123');

  // Create teacher user
  const teacherPassword = await bcrypt.hash('teacher123', 12);
  const teacher = await prisma.user.upsert({
    where: { email: 'teacher@example.com' },
    update: {},
    create: {
      email: 'teacher@example.com',
      password: teacherPassword,
      firstName: 'John',
      lastName: 'Teacher',
      role: 'TEACHER',
    },
  });

  console.log('✅ Teacher user created: teacher@example.com / teacher123');

  // Create student user
  const studentPassword = await bcrypt.hash('student123', 12);
  const student = await prisma.user.upsert({
    where: { email: 'student@example.com' },
    update: {},
    create: {
      email: 'student@example.com',
      password: studentPassword,
      firstName: 'Jane',
      lastName: 'Student',
      role: 'STUDENT',
    },
  });

  console.log('✅ Student user created: student@example.com / student123');

  // Create demo academy
  const academy = await prisma.academy.upsert({
    where: { id: 'demo-academy' },
    update: {},
    create: {
      id: 'demo-academy',
      name: 'Demo Academy',
      description: 'A demonstration academy for testing',
      ownerId: teacher.id,
      defaultMaxWatchTimeMultiplier: 2.0,
    },
  });

  console.log('✅ Demo academy created');

  // Create demo class
  const demoClass = await prisma.class.upsert({
    where: { id: 'demo-class' },
    update: {},
    create: {
      id: 'demo-class',
      name: 'Introduction to Programming',
      description: 'Learn the basics of programming',
      academyId: academy.id,
    },
  });

  console.log('✅ Demo class created');

  // Enroll student in demo class
  await prisma.classEnrollment.upsert({
    where: {
      classId_studentId: {
        classId: demoClass.id,
        studentId: student.id,
      },
    },
    update: {},
    create: {
      classId: demoClass.id,
      studentId: student.id,
    },
  });

  console.log('✅ Student enrolled in demo class');

  // Approve student membership
  await prisma.academyMembership.upsert({
    where: {
      userId_academyId: {
        userId: student.id,
        academyId: academy.id,
      },
    },
    update: {},
    create: {
      userId: student.id,
      academyId: academy.id,
      status: 'APPROVED',
      approvedAt: new Date(),
    },
  });

  console.log('✅ Student membership approved');

  console.log('\n✨ Seeding completed!\n');
  console.log('You can now login with:');
  console.log('  Admin:   admin@academyhive.com / admin123');
  console.log('  Teacher: teacher@example.com / teacher123');
  console.log('  Student: student@example.com / student123\n');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

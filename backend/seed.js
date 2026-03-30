/**
 * Seed script to create test users in the database
 */
const bcrypt = require('bcryptjs');
const { dbRun, initializeDatabase } = require('./config/database');

async function seedDatabase() {
  console.log('🌱 Seeding database with test data...\n');

  try {
    // Initialize database first
    await initializeDatabase();

    // Create test users
    const testUsers = [
      {
        email: 'student@axis.com',
        password: 'student123',
        role: 'student',
        firstName: 'John',
        lastName: 'Doe'
      },
      {
        email: 'teacher@axis.com',
        password: 'teacher123',
        role: 'teacher',
        firstName: 'Jane',
        lastName: 'Smith'
      },
      {
        email: 'admin@axis.com',
        password: 'admin123',
        role: 'admin',
        firstName: 'Admin',
        lastName: 'User'
      }
    ];

    for (const user of testUsers) {
      // Hash password
      const password_hash = await bcrypt.hash(user.password, 10);

      // Insert user
      await dbRun(`
        INSERT OR IGNORE INTO users (email, password_hash, role, first_name, last_name)
        VALUES (?, ?, ?, ?, ?)
      `, [user.email, password_hash, user.role, user.firstName, user.lastName]);

      console.log(`✓ Created ${user.role}: ${user.email} / ${user.password}`);
    }

    // Seed career paths
    const careerPaths = [
      {
        name: 'Software Engineer',
        description: 'Design, develop, and maintain software applications and systems',
        required_skills: 'Math,Physics,English,Computer Science,Logic',
        average_salary: '$70,000 - $120,000',
        growth_outlook: 'Excellent - 22% growth expected'
      },
      {
        name: 'Data Scientist',
        description: 'Analyze and interpret complex data to help organizations make decisions',
        required_skills: 'Math,Statistics,English,Computer Science,Physics',
        average_salary: '$80,000 - $130,000',
        growth_outlook: 'Excellent - 31% growth expected'
      },
      {
        name: 'Medical Doctor',
        description: 'Diagnose and treat illnesses, provide medical care to patients',
        required_skills: 'Biology,Chemistry,Physics,English,Math',
        average_salary: '$150,000 - $250,000',
        growth_outlook: 'Very Good - 16% growth expected'
      },
      {
        name: 'Pharmacist',
        description: 'Dispense medications and advise patients on proper medication use',
        required_skills: 'Chemistry,Biology,Math,English,Physics',
        average_salary: '$100,000 - $140,000',
        growth_outlook: 'Good - 6% growth expected'
      },
      {
        name: 'Civil Engineer',
        description: 'Design, build, and maintain infrastructure like roads, bridges, and buildings',
        required_skills: 'Math,Physics,Chemistry,English,Engineering',
        average_salary: '$70,000 - $110,000',
        growth_outlook: 'Good - 8% growth expected'
      },
      {
        name: 'Science Teacher',
        description: 'Educate students in scientific subjects and inspire scientific thinking',
        required_skills: 'Biology,Chemistry,Physics,Math,English',
        average_salary: '$45,000 - $75,000',
        growth_outlook: 'Good - 8% growth expected'
      }
    ];

    for (const career of careerPaths) {
      await dbRun(`
        INSERT OR IGNORE INTO career_paths (name, description, required_skills, average_salary, growth_outlook)
        VALUES (?, ?, ?, ?, ?)
      `, [career.name, career.description, career.required_skills, career.average_salary, career.growth_outlook]);
    }

    console.log('✓ Created 6 career pathways');

    console.log('\n✅ Database seeded successfully!\n');
    console.log('📝 Test Credentials:');
    console.log('=====================================');
    console.log('Student Account:');
    console.log('  Email: student@axis.com');
    console.log('  Password: student123');
    console.log('');
    console.log('Teacher Account:');
    console.log('  Email: teacher@axis.com');
    console.log('  Password: teacher123');
    console.log('');
    console.log('Admin Account:');
    console.log('  Email: admin@axis.com');
    console.log('  Password: admin123');
    console.log('=====================================\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();

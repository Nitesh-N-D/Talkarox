import bcrypt from 'bcryptjs';
import pool from '../config/db.js';

async function seed() {
  console.log('Seeding demo data...');

  const passwordHash = await bcrypt.hash('password123', 12);

  // Demo school
  const { rows: schoolRows } = await pool.query(
    `INSERT INTO schools (name, address) VALUES ($1, $2) RETURNING id`,
    ['Sunflower Public School', 'Chennai, Tamil Nadu']
  );
  const schoolId = schoolRows[0].id;
  console.log(`✓ Created school: ${schoolId}`);

  // Admin
  const { rows: adminRows } = await pool.query(
    `INSERT INTO users (full_name, email, password_hash, role, school_id, email_verified, onboarding_complete)
     VALUES ($1, $2, $3, 'ADMIN', $4, true, true) RETURNING id`,
    ['Priya Admin', 'admin@demo.talkarox.app', passwordHash, schoolId]
  );
  await pool.query('UPDATE schools SET created_by = $1 WHERE id = $2', [adminRows[0].id, schoolId]);
  console.log('✓ Created admin: admin@demo.talkarox.app / password123');

  // Teachers
  const teacherData = [
    { name: 'Anita Sharma', email: 'anita.teacher@demo.talkarox.app', bio: 'Mathematics, Grade 8–9' },
    { name: 'Ravi Kumar', email: 'ravi.teacher@demo.talkarox.app', bio: 'Science, Grade 6–8' },
  ];
  const teacherIds = [];
  for (const t of teacherData) {
    const { rows } = await pool.query(
      `INSERT INTO users (full_name, email, password_hash, role, school_id, bio, email_verified, onboarding_complete)
       VALUES ($1, $2, $3, 'TEACHER', $4, $5, true, true) RETURNING id`,
      [t.name, t.email, passwordHash, schoolId, t.bio]
    );
    teacherIds.push(rows[0].id);

    await pool.query(
      `INSERT INTO office_hours (teacher_id, day_of_week, start_time, end_time, available_for) VALUES
       ($1, 1, '16:00', '18:00', 'PARENTS'),
       ($1, 3, '16:00', '18:00', 'PARENTS'),
       ($1, 5, '14:00', '16:00', 'BOTH')`,
      [rows[0].id]
    );
  }
  console.log(`✓ Created ${teacherIds.length} teachers with office hours`);

  // Parent
  const { rows: parentRows } = await pool.query(
    `INSERT INTO users (full_name, email, password_hash, role, school_id, email_verified, onboarding_complete)
     VALUES ($1, $2, $3, 'PARENT', $4, true, true) RETURNING id`,
    ['Lakshmi Parent', 'lakshmi.parent@demo.talkarox.app', passwordHash, schoolId]
  );
  console.log('✓ Created parent: lakshmi.parent@demo.talkarox.app / password123');

  // Student
  const { rows: studentRows } = await pool.query(
    `INSERT INTO students (full_name, school_id, grade, section) VALUES ($1, $2, '8', 'A') RETURNING id`,
    ['Arjun Kumar', schoolId]
  );
  await pool.query('INSERT INTO student_parents (student_id, parent_id) VALUES ($1, $2)', [studentRows[0].id, parentRows[0].id]);
  await pool.query('INSERT INTO student_teachers (student_id, teacher_id, subject) VALUES ($1, $2, $3)', [studentRows[0].id, teacherIds[0], 'Mathematics']);
  console.log('✓ Created student and linked to parent + teacher');

  // Sample message thread with realistic timestamp gaps, so the computed
  // "average response time" feature has real data to calculate from rather
  // than messages that all land at the same instant.
  await pool.query(
    `INSERT INTO messages (sender_id, recipient_id, student_id, content, category, created_at) VALUES
     ($1, $2, $3, 'Hi! Just wanted to check how Arjun is doing in math this term.', 'ACADEMIC', now() - interval '3 days 2 hours'),
     ($2, $1, $3, 'He''s doing well! Strong on algebra, could use a bit more practice with geometry.', 'ACADEMIC', now() - interval '3 days'),
     ($1, $2, $3, 'That''s great to hear. Any specific worksheets you''d recommend for geometry practice?', 'ACADEMIC', now() - interval '1 day 4 hours'),
     ($2, $1, $3, 'I''ll share a worksheet packet by Friday. He should focus on angle relationships first.', 'ACADEMIC', now() - interval '1 day 3 hours')`,
    [parentRows[0].id, teacherIds[0], studentRows[0].id]
  );
  console.log('✓ Created sample message thread with realistic timestamps');

  // Sample announcement
  await pool.query(
    `INSERT INTO announcements (school_id, author_id, title, content, type, target, pinned) VALUES
     ($1, $2, 'Welcome to Talkarox!', 'This is your school''s new communication platform. Reach out to teachers directly through here.', 'INFO', 'SCHOOL_WIDE', true)`,
    [schoolId, adminRows[0].id]
  );
  console.log('✓ Created welcome announcement');

  console.log('\n🎉 Seed complete! Demo accounts (password: password123):');
  console.log('   Admin:   admin@demo.talkarox.app');
  console.log('   Teacher: anita.teacher@demo.talkarox.app');
  console.log('   Parent:  lakshmi.parent@demo.talkarox.app');

  await pool.end();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});

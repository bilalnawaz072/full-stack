const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL is missing in environment variables!');
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function initDatabase() {
  console.log('Connecting to Neon PostgreSQL database using Prisma 7 ORM...');
  try {
    // Run a query to check connection health
    await prisma.$queryRaw`SELECT 1`;
    console.log('Successfully connected to PostgreSQL using Prisma 7 ORM!');
    
    // Seed default lists and task if empty
    await seedDefaultData();
  } catch (err) {
    console.error('Failed to connect to PostgreSQL via Prisma:', err.message);
    throw err;
  }
}

async function seedDefaultData() {
  try {
    const listCount = await prisma.list.count();
    if (listCount === 0) {
      console.log('Database is empty. Seeding default board lists...');
      
      await prisma.$transaction([
        prisma.list.create({
          data: {
            id: 'todo',
            title: 'To Do',
            position: 1,
            tasks: {
              create: [
                {
                  id: 'task-sample-1',
                  title: 'Welcome to TaskFlow! 🚀',
                  description: 'This is a sample task card. Feel free to drag me to "In Progress" or "Completed"! Double click or click edit to see checklists and due dates.',
                  priority: 'High',
                  due_date: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
                  position: 1,
                  checklist: [
                    { id: 'sub-1', text: 'Create a new list', completed: false },
                    { id: 'sub-2', text: 'Drag a card to In Progress', completed: false }
                  ]
                }
              ]
            }
          }
        }),
        prisma.list.create({
          data: {
            id: 'inprogress',
            title: 'In Progress',
            position: 2
          }
        }),
        prisma.list.create({
          data: {
            id: 'done',
            title: 'Completed',
            position: 3
          }
        })
      ]);
      console.log('Default lists and tasks seeded successfully!');
    }
  } catch (err) {
    console.error('Failed to seed default data:', err.message);
  }
}

module.exports = {
  prisma,
  initDatabase
};

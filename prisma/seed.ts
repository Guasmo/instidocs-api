import 'dotenv/config';
import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL;

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });


async function main() {
    console.log('Start seeding...');

    // 1. Clean the database
    await prisma.document.deleteMany();
    await prisma.course.deleteMany();
    await prisma.user.deleteMany();

    // 2. Create Users
    const password = await bcrypt.hash('123456', 10);

    // Admin
    const admin = await prisma.user.create({
        data: {
            email: 'admin@instidocs.com',
            password,
            fullName: 'Admin User',
            role: Role.ADMIN,
        },
    });

    // Teacher 1
    const teacher1 = await prisma.user.create({
        data: {
            email: 'teacher1@instidocs.com',
            password,
            fullName: 'Profesor Juan Pérez',
            role: Role.TEACHER,
        },
    });

    // Teacher 2
    const teacher2 = await prisma.user.create({
        data: {
            email: 'teacher2@instidocs.com',
            password,
            fullName: 'Profesora María López',
            role: Role.TEACHER,
        },
    });

    // Student 1
    const student1 = await prisma.user.create({
        data: {
            email: 'student1@instidocs.com',
            password,
            fullName: 'Estudiante Carlos',
            role: Role.STUDENT,
        },
    });

    // Student 2
    const student2 = await prisma.user.create({
        data: {
            email: 'student2@instidocs.com',
            password,
            fullName: 'Estudiante Ana',
            role: Role.STUDENT,
        },
    });

    // 3. Create Courses
    const course1 = await prisma.course.create({
        data: {
            name: 'Matemáticas Avanzadas',
            description: 'Curso de cálculo y álgebra lineal.',
            teacherId: teacher1.id,
            students: {
                connect: [{ id: student1.id }, { id: student2.id }],
            },
        },
    });

    const course2 = await prisma.course.create({
        data: {
            name: 'Física I',
            description: 'Introducción a la mecánica clásica.',
            teacherId: teacher1.id,
            students: {
                connect: [{ id: student1.id }],
            },
        },
    });

    const course3 = await prisma.course.create({
        data: {
            name: 'Programación Web',
            description: 'Desarrollo frontend y backend con React y NestJS.',
            teacherId: teacher2.id,
            students: {
                connect: [{ id: student2.id }],
            },
        },
    });

    console.log('Seeding finished.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

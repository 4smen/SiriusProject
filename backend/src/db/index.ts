import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

export let db: any = null;

export const initDB = async () => {
    db = await open({
        filename: './database.sqlite',
        driver: sqlite3.Database
    });

    console.log('нашли нашу дб-шечку');

    await db.exec('PRAGMA foreign_keys = ON');

    // //админ
    // const adminExists = await db.get(
    //     'SELECT * FROM admins WHERE username = ?',
    //     ['admin']
    // );

    // if (!adminExists) {
    //     const hashedPassword = await bcrypt.hash('123', 10);

    //     await db.run(
    //         'INSERT INTO admins (username, password) VALUES (?, ?)',
    //         ['admin', hashedPassword]
    //     );
    //     console.log('создан администратор: login=admin, password=123');
    // }
    
    // таблица пользователей
    await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL UNIQUE,
        passwordHash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
        createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('пользователи');

    // таблица проектов
    await db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        createdBy INTEGER NOT NULL,
        createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (createdBy) REFERENCES users(id) ON DELETE RESTRICT
      )
    `);
    console.log('проекты');

    // таблица участников проектов
    await db.exec(`
      CREATE TABLE IF NOT EXISTS project_members (
        projectId INTEGER NOT NULL,
        userId INTEGER NOT NULL,
        joinedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (projectId, userId),
        FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('участники проектов');

    //таблица задач
    await db.exec(`
      CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        projectId INTEGER NOT NULL,
        userId INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        startDate TEXT,
        deadline TEXT, 
        status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'rejected', 'in_progress', 'completed')),
        createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        reviewedAt TEXT,
        reviewedBy INTEGER,
        completedAt TEXT,
        FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (reviewedBy) REFERENCES users(id) ON DELETE SET NULL,
        CHECK (deadline IS NULL OR startDate IS NULL OR deadline >= startDate),
        CHECK ((status = 'completed') = (completedAt IS NOT NULL))
      )
    `);
    console.log('задачи');

    //индексочки мои любимые
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_tasks_user_status ON tasks(userId, status)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_tasks_project_status ON tasks(projectId, status)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_tasks_deadline ON tasks(deadline) WHERE deadline IS NOT NULL`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_tasks_pending ON tasks(createdAt) WHERE status = 'pending'`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_projects_createdBy ON projects(createdBy)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_members_userId ON project_members(userId)`);

    console.log('индексы');

    //админ
    const admin = await db.get(`SELECT id FROM users WHERE role = 'admin' LIMIT 1`);
    if (!admin) {
        const password = process.env.ADMIN_PASSWORD;
        if (!password) {
            throw new Error('Задай ADMIN_PASSWORD для создания первого администратора');
        }
        await db.run(
            `INSERT INTO users (username, email, passwordHash, role) VALUES (?, ?, ?, 'admin')`,
            ['admin', 'admin@local', await bcrypt.hash(password, 10)]
        );
        console.log('создан администратор');
    }

    console.log('дб-шечка готова');
};
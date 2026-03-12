import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import bcrypt from 'bcryptjs';

export let db: any = null;

//основная функция инициализации бд
export const initDB = async () => {
    //подключение
    db = await open({
        filename: './database.sqlite',
        driver: sqlite3.Database
    });

    console.log('нашли нашу дб-шечку');

    //таблица задач
    await db.exec(`
      CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL,
        projectId INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        deadline TEXT,
        isCompleted BOOLEAN DEFAULT 0,
        isEdited BOOLEAN DEFAULT 0,
        createdAt DATETIME,
        completedAt DATETIME, 
        requestId INTEGER UNIQUE,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE,
        FOREIGN KEY (requestId) REFERENCES task_requests(id) ON DELETE SET NULL
      )
      `);
    console.log('табличечка tasks создана иль проверена');

    //таблица аномалий
    await db.exec(`
    CREATE TABLE IF NOT EXISTS anomalies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER NOT NULL,
      username TEXT NOT NULL,
      task_text TEXT NOT NULL,
      active_hours REAL NOT NULL,
      estimated_hours REAL NOT NULL,
      deviation REAL NOT NULL,
      detected_at TEXT NOT NULL,
      is_resolved INTEGER DEFAULT 0,
      resolved_at TEXT,
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
    )
  `);
    console.log('табличечка anomalies создана иль проверена');

    //админ
    const adminExists = await db.get(
        'SELECT * FROM admins WHERE username = ?',
        ['admin']
    );

    if (!adminExists) {
        const hashedPassword = await bcrypt.hash('123', 10);

        await db.run(
            'INSERT INTO admins (username, password) VALUES (?, ?)',
            ['admin', hashedPassword]
        );
        console.log('создан администратор: login=admin, password=123');
    }
    
    // таблица пользователей
    await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      isAdmin BOOLEAN DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    `);

    // таблица проектов
    await db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      createdBy INTEGER NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (createdBy) REFERENCES users(id) ON DELETE CASCADE
    )
    `);

    // таблица запросов на создание задач (для модерации админом)
    await db.exec(`
      CREATE TABLE IF NOT EXISTS task_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL,
        projectId INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        deadline TEXT,
        status TEXT DEFAULT 'pending',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        reviewedAt DATETIME,
        reviewedBy INTEGER,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE,
        FOREIGN KEY (reviewedBy) REFERENCES users(id) ON DELETE SET NULL
      )
      `);

    //индексочки мои любимые
    await db.exec('CREATE INDEX IF NOT EXISTS idx_tasks_userId ON tasks(userId)');
    await db.exec('CREATE INDEX IF NOT EXISTS idx_tasks_projectId ON tasks(projectId)');
    await db.exec('CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(isCompleted)');
    await db.exec('CREATE INDEX IF NOT EXISTS idx_tasks_created ON tasks(createdAt)');
    await db.exec('CREATE INDEX IF NOT EXISTS idx_tasks_deadline ON tasks(deadline)');
    await db.exec('CREATE INDEX IF NOT EXISTS idx_tasks_requestId ON tasks(requestId)');

    await db.exec('CREATE INDEX IF NOT EXISTS idx_projects_createdBy ON projects(createdBy)');
    await db.exec('CREATE INDEX IF NOT EXISTS idx_projects_createdAt ON projects(createdAt)');

    await db.exec('CREATE INDEX IF NOT EXISTS idx_requests_userId ON task_requests(userId)');
    await db.exec('CREATE INDEX IF NOT EXISTS idx_requests_projectId ON task_requests(projectId)');
    await db.exec('CREATE INDEX IF NOT EXISTS idx_requests_status ON task_requests(status)');
    await db.exec('CREATE INDEX IF NOT EXISTS idx_requests_createdAt ON task_requests(createdAt)');

    await db.exec('CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)');
    await db.exec('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');
    await db.exec('CREATE INDEX IF NOT EXISTS idx_users_isAdmin ON users(isAdmin)');

    console.log('индексы готовы');
    console.log('дб-шечка готова');
};
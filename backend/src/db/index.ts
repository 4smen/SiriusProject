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
      username TEXT NOT NULL,
      email TEXT NOT NULL,
      text TEXT NOT NULL, 
      isCompleted BOOLEAN DEFAULT 0,
      isEdited BOOLEAN DEFAULT 0,
      createdAt DATETIME
    )
  `);
    console.log('табличечка tasks создана иль проверена');

    //таблица админа
    await db.exec(`
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL
    )
  `);
    console.log('табличечка admins создана иль проверена');

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

    //индексочки мои любимые
    await db.exec('CREATE INDEX IF NOT EXISTS idx_username ON tasks(username)');
    await db.exec('CREATE INDEX IF NOT EXISTS idx_email ON tasks(email)');
    await db.exec('CREATE INDEX IF NOT EXISTS idx_status ON tasks(isCompleted)');
    await db.exec('CREATE INDEX IF NOT EXISTS idx_created ON tasks(createdAt)');

    console.log('индексы готовы');
    console.log('дб-шечка готова');
};
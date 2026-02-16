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
      id INTEGER PRIMARY KEY AUTOINCREMENT,     -- Уникальный ID задачи
      username TEXT NOT NULL,                   -- Имя пользователя
      email TEXT NOT NULL,                      -- Email
      text TEXT NOT NULL,                       -- Текст задачи
      isCompleted BOOLEAN DEFAULT 0,            -- Выполнена ли задача (0/1)
      isEdited BOOLEAN DEFAULT 0,               -- Редактировал ли админ
      createdAt DATETIME DEFAULT (datetime('now', '+3 hours')) -- Дата создания
    )
  `);
    console.log('табличечка tasks создана иль проверена');

    //таблица админа
    await db.exec(`
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,     -- Уникальный ID админа
      username TEXT UNIQUE NOT NULL,            -- Логин (уникальный)
      password TEXT NOT NULL                    -- Хешированный пароль
    )
  `);
    console.log('табличечка admins создана иль проверена');

    //таблица аномалий
    await db.exec(`
    CREATE TABLE IF NOT EXISTS anomalies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,     -- Уникальный ID аномалии
      task_id INTEGER NOT NULL,                 -- ID задачи
      username TEXT NOT NULL,                    -- Имя пользователя
      task_text TEXT NOT NULL,                   -- Текст задачи
      active_hours REAL NOT NULL,                -- Фактическое время выполнения
      estimated_hours REAL NOT NULL,             -- Прогнозируемое время
      deviation REAL NOT NULL,                    -- Отклонение (во сколько раз)
      detected_at TEXT NOT NULL,                  -- Когда обнаружена
      is_resolved INTEGER DEFAULT 0,              -- Решена ли аномалия (0/1)
      resolved_at TEXT,                           -- Когда решена
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
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initDB = exports.db = void 0;
const sqlite3_1 = __importDefault(require("sqlite3"));
const sqlite_1 = require("sqlite");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
exports.db = null;
//инициализация бд
const initDB = async () => {
    exports.db = await (0, sqlite_1.open)({
        filename: './database.db',
        driver: sqlite3_1.default.Database
    });
    console.log('нашли нашу дб-шечку');
    //таблица задач
    await exports.db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,     -- Уникальный ID задачи
      username TEXT NOT NULL,                   -- Имя пользователя
      email TEXT NOT NULL,                      -- Email
      text TEXT NOT NULL,                       -- Текст задачи
      isCompleted BOOLEAN DEFAULT 0,            -- Выполнена ли задача (0/1)
      isEdited BOOLEAN DEFAULT 0,               -- Редактировал ли админ
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP -- Дата создания
    )
  `);
    console.log('табличечка tasks создана иль проверена');
    //таблица администраторов
    await exports.db.exec(`
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,     -- Уникальный ID админа
      username TEXT UNIQUE NOT NULL,            -- Логин (уникальный)
      password TEXT NOT NULL                    -- Хешированный пароль
    )
  `);
    console.log('табличечка admins создана иль проверена');
    //администратор
    const adminExists = await exports.db.get('SELECT * FROM admins WHERE username = ?', ['admin']);
    if (!adminExists) {
        const hashedPassword = await bcryptjs_1.default.hash('123', 10);
        await exports.db.run('INSERT INTO admins (username, password) VALUES (?, ?)', ['admin', hashedPassword]);
        console.log('👑 Создан администратор: login=admin, password=123');
    }
    //индексочки мои любимые
    await exports.db.exec('CREATE INDEX IF NOT EXISTS idx_username ON tasks(username)');
    await exports.db.exec('CREATE INDEX IF NOT EXISTS idx_email ON tasks(email)');
    await exports.db.exec('CREATE INDEX IF NOT EXISTS idx_status ON tasks(isCompleted)');
    await exports.db.exec('CREATE INDEX IF NOT EXISTS idx_created ON tasks(createdAt)');
    console.log('индексы готовы');
    console.log('дб-шечка готова');
};
exports.initDB = initDB;

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('подключение к базе:', dbPath);
console.log('добавление колонки startDate в таблицу tasks...\n');

db.run('DROP TABLE IF EXISTS admins', (err) => {
    if (err) {
        console.error('❌ ошибка удаления admins:', err.message);
        } else {
    console.log('✅ таблица admins удалена (или её не было)');
        }
});

db.run('DROP TABLE IF EXISTS anomalies', (err) => {
    if (err) {
        console.error('❌ ошибка удаления anomalies:', err.message);
    } else {
        console.log('✅ таблица anomalies удалена (или её не было)');
    }
});

// db.run('ALTER TABLE tasks ADD COLUMN startDate DATETIME', (err) => {
//     if (err) {
//         if (err.message.includes('duplicate column name')) {
//             console.log('✅ колонка startDate уже существует');
//         } else {
//             console.error('❌ ошибка:', err.message);
//         }
//     } else {
//         console.log('✅ колонка startDate успешно добавлена');
//     }

//     // показываем структуру таблицы
//     db.all('PRAGMA table_info(tasks)', (err, columns) => {
//         if (err) {
//             console.error('ошибка проверки:', err);
//         } else {
//             console.log('\n📋 структура таблицы tasks:');
//             columns.forEach(col => {
//                 console.log(`  - ${col.name} (${col.type})`);
//             });
//         }
//         db.close();
//     });
// });
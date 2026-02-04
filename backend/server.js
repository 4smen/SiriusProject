const express = require('express');
const path = require('path');

const app = express();

// ... ваши API роуты ...

// Обслуживаем статические файлы React
app.use(express.static(path.join(__dirname, '../frontend/build')));

// Все остальные запросы отправляем на React приложение
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
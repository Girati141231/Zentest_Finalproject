const express = require('express');
const app = express();
const PORT = 3100;

// Middleware สำหรับอ่าน JSON จาก Body
app.use(express.json());

// ข้อมูลจำลอง (Mock Data)
let todos = [
    { id: 1, task: 'Buy milk', status: 'pending' },
    { id: 2, task: 'Learn API', status: 'completed' }
];

// 1. GET: ดึงข้อมูลทั้งหมด
app.get('/api/todos', (req, res) => {
    res.json(todos);
});

// 2. POST: เพิ่มข้อมูลใหม่
app.post('/api/todos', (req, res) => {
    const newTodo = {
        id: todos.length + 1,
        task: req.body.task,
        status: 'pending'
    };
    todos.push(newTodo);
    res.status(201).json(newTodo);
});

// 3. DELETE: ลบข้อมูลตาม ID
app.delete('/api/todos/:id', (req, res) => {
    const id = parseInt(req.params.id);
    todos = todos.filter(t => t.id !== id);
    res.json({ message: `Deleted todo id: ${id}` });
});

app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
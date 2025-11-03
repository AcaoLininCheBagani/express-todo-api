import 'dotenv/config';
import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import morgan from 'morgan';
import { Todo } from './models/Todo';
const cors = require('cors');

const app = express();
app.use(cors({
    origin: 'http://localhost:3000', // Allow only this origin
    // methods: ['GET', 'POST'], // Allow specific HTTP methods
    // allowedHeaders: ['Content-Type'], // Allow specific headers
}))
const PORT = parseInt(process.env.PORT || '8000', 10);
const MONGODB_URI = process.env.MONGO_URI;

if (!MONGODB_URI) {
    console.error('❌ Missing MONGODB_URI in .env');
    process.exit(1);
}

// middleware
app.use(morgan('dev'));
app.use(express.json());

// read
app.get('/api/todos', async (_req: Request, res: Response) => {
    try {
        const todos = await Todo.find().sort({ createdAt: -1 });
        res.json(todos);
    } catch (error) {
        console.error('Read all error:', error);
        res.status(500).json({ error: 'Failed to fetch todos'});
    }
})

// create
app.post('/api/todos', async (req: Request, res: Response) => {
    try {
        const { title, completed, priority } = req.body;

        if (!title || typeof title !== 'string') {
            return res.status(400).json({ error: 'Title is required and must be a string' });
        }

        const newTodo = new Todo({
            title,
            completed: completed ?? false,
            priority
        });

        const saveTodo = await newTodo.save();
        res.status(200).json(saveTodo);
    } catch (error) {
        console.error('Create error:', error);
        res.status(500).json({ error: 'Failed to create todo' });
    }
})

// update
app.patch('/api/todos/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { title, completed, priority } = req.body;

        if(title !== undefined && (typeof title !== 'string' || title.trim() === '')){
            return res.status(400).json({ error: 'Title must be a non-empty string'});
        }

        const updatedTodo = await Todo.findByIdAndUpdate(
            id,
            {title, completed, priority},
            {new: true, runValidators: true}
        );

        if(!updatedTodo) {
            return res.status(404).json({error: 'Todo not found'});
        }

        res.json(updatedTodo);
    } catch (error) {
        console.error('Update error:', error);
        res.status(500).json({error: 'Failed to update todo'});
    }
})

// delete
app.delete('/api/todos/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deletedTodo = await Todo.findByIdAndDelete(id);

    if (!deletedTodo) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    res.json({ message: 'Todo deleted successfully', id: deletedTodo._id });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Failed to delete todo' });
  }
});

mongoose.connect(MONGODB_URI).then(() => {
    console.log('✅ Connected to MongoDB Atlas');
    console.log('✅ Connected to database:', mongoose.connection.name);
    app.listen(PORT, () => {
        console.log(`✅ Server running on http://localhost:${PORT}`);
    });
}).catch((err) =>{
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
})
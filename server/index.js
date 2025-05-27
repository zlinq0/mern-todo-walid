const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

console.log('Starting server...');

// MongoDB connection string
const uri = "mongodb+srv://admin1:admin@cluster0.fvhpy7b.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
console.log('Using MongoDB URI:', uri);

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;
console.log(`Server will run on port ${PORT}`);

// Apply middleware
app.use(cors({
  origin: '*', // Allow all origins for testing
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Log all requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Define Task schema
const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  completed: { type: Boolean, default: false }
});

// Create Task model (or use existing one)
const Task = mongoose.models.Task || mongoose.model('Task', taskSchema);
console.log('Task model created');

// Simplified MongoDB connection
mongoose.connect(uri)
  .then(() => {
    console.log('Successfully connected to MongoDB Atlas');
  })
  .catch(err => {
    console.error('Failed to connect to MongoDB:', err.message);
    console.error('Full error:', err);
  });

// Test route to verify server is running
app.get('/api/test', (req, res) => {
  console.log('Test route accessed');
  res.json({ message: 'Server is running correctly' });
});

// API Routes
// Get all tasks
app.get('/api/tasks', async (req, res) => {
  console.log('GET /api/tasks - Fetching all tasks');
  try {
    // Test database connection first
    if (mongoose.connection.readyState !== 1) {
      console.error('MongoDB not connected. Current state:', mongoose.connection.readyState);
      return res.status(500).json({ message: 'Database connection not established' });
    }
    
    const tasks = await Task.find().lean();
    console.log(`Found ${tasks.length} tasks:`, JSON.stringify(tasks));
    return res.json(tasks);
  } catch (err) {
    console.error('Error fetching tasks:', err);
    return res.status(500).json({ message: err.message, stack: err.stack });
  }
});

// Create a new task
app.post('/api/tasks', async (req, res) => {
  console.log('POST /api/tasks - Creating new task:', JSON.stringify(req.body));
  
  // Validate request body
  if (!req.body.title) {
    console.error('Missing title in request body');
    return res.status(400).json({ message: 'Title is required' });
  }
  
  try {
    const task = new Task({
      title: req.body.title,
      completed: req.body.completed || false
    });
    
    const newTask = await task.save();
    console.log('Task created successfully:', JSON.stringify(newTask));
    return res.status(201).json(newTask);
  } catch (err) {
    console.error('Error creating task:', err);
    return res.status(400).json({ message: err.message, stack: err.stack });
  }
});

// Update a task
app.put('/api/tasks/:id', async (req, res) => {
  const id = req.params.id;
  console.log(`PUT /api/tasks/${id} - Updating task:`, JSON.stringify(req.body));
  
  try {
    const updatedTask = await Task.findByIdAndUpdate(
      id,
      { title: req.body.title, completed: req.body.completed },
      { new: true }
    );
    
    if (!updatedTask) {
      console.log(`Task with ID ${id} not found`);
      return res.status(404).json({ message: 'Task not found' });
    }
    
    console.log('Task updated successfully:', JSON.stringify(updatedTask));
    return res.json(updatedTask);
  } catch (err) {
    console.error(`Error updating task ${id}:`, err);
    return res.status(500).json({ message: err.message, stack: err.stack });
  }
});

// Delete a task
app.delete('/api/tasks/:id', async (req, res) => {
  const id = req.params.id;
  console.log(`DELETE /api/tasks/${id} - Deleting task`);
  
  try {
    const result = await Task.findByIdAndDelete(id);
    if (!result) {
      console.log(`Task with ID ${id} not found`);
      return res.status(404).json({ message: 'Task not found' });
    }
    console.log(`Task ${id} deleted successfully`);
    return res.json({ message: 'Task deleted' });
  } catch (err) {
    console.error(`Error deleting task ${id}:`, err);
    return res.status(500).json({ message: err.message, stack: err.stack });
  }
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  console.log('Running in production mode, serving static files');
  // Serve static files
  app.use(express.static(path.join(__dirname, '../client/build')));
  
  // Specific routes for the React app instead of catch-all
  app.get('/', (req, res) => {
    console.log('Serving index.html for root path');
    res.sendFile(path.join(__dirname, '../client/build/index.html'));
  });
  
  app.get('/index.html', (req, res) => {
    console.log('Serving index.html directly');
    res.sendFile(path.join(__dirname, '../client/build/index.html'));
  });
} else {
  console.log('Running in development mode');
}

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

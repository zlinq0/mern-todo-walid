const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

// MongoDB connection string
const uri = "mongodb+srv://admin1:admin@cluster0.fvhpy7b.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Apply middleware
app.use(cors());
app.use(express.json());

// Define Task schema
const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  completed: { type: Boolean, default: false }
});

// Create Task model (or use existing one)
const Task = mongoose.models.Task || mongoose.model('Task', taskSchema);

// Connect to MongoDB with improved options
mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
  socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
})
.then(() => {
  console.log('Connected to MongoDB Atlas');
})
.catch(err => {
  console.error('MongoDB connection error:', err);
  // Log more details about the error
  if (err.name === 'MongoServerSelectionError') {
    console.error('Could not connect to any MongoDB server. Please check your connection string and network.');
  }
});

// API Routes
// Get all tasks
app.get('/api/tasks', async (req, res) => {
  console.log('GET /api/tasks - Fetching all tasks');
  try {
    const tasks = await Task.find();
    console.log(`Found ${tasks.length} tasks`);
    res.json(tasks);
  } catch (err) {
    console.error('Error fetching tasks:', err);
    res.status(500).json({ message: err.message });
  }
});

// Create a new task
app.post('/api/tasks', async (req, res) => {
  console.log('POST /api/tasks - Creating new task:', req.body);
  try {
    const task = new Task({
      title: req.body.title,
      completed: req.body.completed || false
    });
    const newTask = await task.save();
    console.log('Task created successfully:', newTask);
    res.status(201).json(newTask);
  } catch (err) {
    console.error('Error creating task:', err);
    res.status(400).json({ message: err.message });
  }
});

// Update a task
app.put('/api/tasks/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const updatedTask = await Task.findByIdAndUpdate(
      id,
      { title: req.body.title, completed: req.body.completed },
      { new: true }
    );
    
    if (!updatedTask) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    res.json(updatedTask);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete a task
app.delete('/api/tasks/:id', async (req, res) => {
  try {
    const result = await Task.findByIdAndDelete(req.params.id);
    if (!result) {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  // Serve static files
  app.use(express.static(path.join(__dirname, '../client/build')));
  
  // For any route that is not an API route, serve the React app
  app.get(/^\/(?!api).*/, (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build/index.html'));
  });
}

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

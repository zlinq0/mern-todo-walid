// backend/routes/tasks.js
const express = require('express');
const router = express.Router();
const Task = require('../models/Task');

// Get all tasks
router.get('/', async (req, res) => {
  try {
    const tasks = await Task.find();
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add a new task
router.post('/', async (req, res) => {
  const task = new Task({
    title: req.body.title,
    completed: req.body.completed ?? false,
  });
  try {
    const newTask = await task.save();
    res.status(201).json(newTask);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete a task
router.delete('/:id', async (req, res) => {
  try {
    await Task.findByIdAndDelete(req.params.id);
    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update a task
router.put('/:id', async (req, res) => {
  const id = req.params.id;
  const newTitle = req.body.title;

  console.log("Updating task with ID:", id);
  console.log("New title:", newTitle);

  try {
    const updatedTask = await Task.findByIdAndUpdate(
      id,
      { title: newTitle, completed: req.body.completed  },
      { new: true }
    );

    if (!updatedTask) {
      console.log("Task not found for ID:", id);
      return res.status(404).json({ message: 'Task not found' });
    }

    console.log("Updated task:", updatedTask);
    res.json(updatedTask);
  } catch (err) {
    console.error("Update error:", err);
    res.status(500).json({ message: 'Internal server error' });
  }
});


module.exports = router;

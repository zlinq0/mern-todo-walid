import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import { FaCheck, FaEdit, FaPlus, FaStrikethrough } from 'react-icons/fa';

// Use environment variable or default to the deployed URL
const API_URL = process.env.REACT_APP_API_URL || 'https://mern-todo-walid.onrender.com/api';

function App() {
  const [tasks, setTasksId] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [editTaskId, setEditTaskId] = useState(null);
  const [editText, setEditText] = useState('');
  const today = new Date();
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const formattedDate = today.toLocaleDateString(undefined, options);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [strikedTasks, setStrikedTasks] = useState({});

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedTime = currentTime.toLocaleTimeString();

  useEffect(() => {
    console.log('Fetching tasks from:', `${API_URL}/tasks`);
    axios.get(`${API_URL}/tasks`)
      .then(response => {
        console.log('Tasks received:', response.data);
        setTasksId(response.data);
      })
      .catch(error => {
        console.error('Error fetching tasks:', error);
        console.error('Error details:', error.response ? error.response.data : 'No response data');
      });
      
    // Test the API connection
    axios.get(`${API_URL}/test`)
      .then(response => console.log('API test successful:', response.data))
      .catch(error => console.error('API test failed:', error));
  }, []);

  const handleAddTask = () => {
    if (!newTask.trim()) return;
    
    console.log('Adding new task:', newTask);
    axios.post(`${API_URL}/tasks`, { title: newTask, completed: false })
      .then(response => {
        console.log('Task added successfully:', response.data);
        setTasksId([...tasks, response.data]);
        setNewTask('');
      })
      .catch(error => {
        console.error('Error adding task:', error);
        console.error('Error details:', error.response ? error.response.data : 'No response data');
        alert('Failed to add task. Please check console for details.');
      });
  };

  const handleDeleteTask = (id) => {
    axios.delete(`${API_URL}/tasks/${id}`)
      .then(() => {
        setTasksId(tasks.filter(task => task._id !== id));
        setStrikedTasks(prev => {
          const newState = { ...prev };
          delete newState[id];
          return newState;
        });
      })
      .catch(error => console.error('Error deleting task:', error));
  };

  const handleEditTask = (id, currentTitle) => {
    setEditTaskId(id);
    setEditText(currentTitle);
  };

  const handleSaveEdit = (id) => {
    if (!editText.trim()) return;

    axios.put(`${API_URL}/tasks/${id}`, { title: editText })
      .then(response => {
        setTasksId(tasks.map(task => task._id === id ? response.data : task));
        setEditTaskId(null);
        setEditText('');
      })
      .catch(error => console.error('Error updating task:', error));
  };

  const handleCancelEdit = () => {
    setEditTaskId(null);
    setEditText('');
  };

  const handleToggleStrike = (id) => {
    setStrikedTasks(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div className="todo-container">
      <h1 className="no-print">To-Do List Project</h1>
      <div className="date-time-container no-print">
        <p className="date-display">{formattedDate}</p>
        <p className="time-display">{formattedTime}</p>
      </div>

      <div className="input-container no-print">
        <input
          type="text"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleAddTask();
          }}
          placeholder="Enter a task..."
        />
        <button onClick={handleAddTask} className="icon-button add">
          <FaPlus />
        </button>
      </div>

      <div className="print-only">
        <ul className="task-list">
          {tasks.map((task) => (
            <li key={task._id} className="task-item">
              {editTaskId === task._id ? (
                <div className="edit-container no-print">
                  <input
                    type="text"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    placeholder="Edit task..."
                  />
                  <button onClick={() => handleSaveEdit(task._id)}>Save</button>
                  <button onClick={handleCancelEdit}>Cancel</button>
                </div>
              ) : (
                <>
                  <span
                    style={{
                      textDecoration: strikedTasks[task._id] ? 'line-through' : 'none',
                      color: strikedTasks[task._id] ? '#999' : '#000',
                    }}
                  >
                    {task.title}
                  </span>
                  <div className="button-container no-print">
                    <button
                      onClick={() => handleToggleStrike(task._id)}
                      className="icon-button"
                      title="Toggle strikethrough"
                    >
                      <FaStrikethrough />
                    </button>
                    <button onClick={() => handleEditTask(task._id, task.title)} className="icon-button">
                      <FaEdit />
                    </button>
                    <button onClick={() => handleDeleteTask(task._id)} className="icon-button delete">
                      <FaCheck />
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      </div>

      <button onClick={() => window.print()} className="print-button no-print">
        Print List
      </button>
    </div>
  );
}

export default App;

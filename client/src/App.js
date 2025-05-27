import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import { FaCheck, FaEdit, FaPlus, FaStrikethrough } from 'react-icons/fa';

// Use environment variable or default to the deployed URL
// For local development, use localhost
// For production, use the Render URL
const API_URL = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:5000/api'
  : 'https://mern-todo-walid.onrender.com/api';

function App() {
  const [tasks, setTasksId] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [editTaskId, setEditTaskId] = useState(null);
  const [editText, setEditText] = useState('');
  const [status, setStatus] = useState({ loading: false, error: null, message: '' });
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
    setStatus({ loading: true, error: null, message: 'Loading tasks...' });
    console.log('Fetching tasks from:', `${API_URL}/tasks`);
    
    // Test the API connection first
    axios.get(`${API_URL}/test`)
      .then(response => {
        console.log('API test successful:', response.data);
        
        // Now fetch tasks
        return axios.get(`${API_URL}/tasks`);
      })
      .then(response => {
        console.log('Tasks received:', response.data);
        setTasksId(response.data);
        setStatus({ loading: false, error: null, message: 'Tasks loaded successfully' });
      })
      .catch(error => {
        console.error('Error:', error);
        console.error('Error details:', error.response ? error.response.data : 'No response data');
        setStatus({ 
          loading: false, 
          error: true, 
          message: `Failed to load tasks: ${error.message}. ${error.response?.data?.message || ''}` 
        });
      });
  }, []);

  const handleAddTask = () => {
    if (!newTask.trim()) return;
    
    setStatus({ loading: true, error: null, message: 'Adding task...' });
    console.log('Adding new task:', newTask);
    
    axios.post(`${API_URL}/tasks`, { title: newTask, completed: false })
      .then(response => {
        console.log('Task added successfully:', response.data);
        setTasksId([...tasks, response.data]);
        setNewTask('');
        setStatus({ loading: false, error: null, message: 'Task added successfully!' });
      })
      .catch(error => {
        console.error('Error adding task:', error);
        console.error('Error details:', error.response ? error.response.data : 'No response data');
        
        const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
        setStatus({ 
          loading: false, 
          error: true, 
          message: `Failed to add task: ${errorMessage}` 
        });
      });
  };

  const handleDeleteTask = (id) => {
    setStatus({ loading: true, error: null, message: 'Deleting task...' });
    
    axios.delete(`${API_URL}/tasks/${id}`)
      .then(() => {
        setTasksId(tasks.filter(task => task._id !== id));
        setStrikedTasks(prev => {
          const newState = { ...prev };
          delete newState[id];
          return newState;
        });
        setStatus({ loading: false, error: null, message: 'Task deleted successfully!' });
      })
      .catch(error => {
        console.error('Error deleting task:', error);
        console.error('Error details:', error.response ? error.response.data : 'No response data');
        
        const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
        setStatus({ 
          loading: false, 
          error: true, 
          message: `Failed to delete task: ${errorMessage}` 
        });
      });
  };

  const handleEditTask = (id, currentTitle) => {
    setEditTaskId(id);
    setEditText(currentTitle);
  };

  const handleSaveEdit = (id) => {
    if (!editText.trim()) return;
    
    setStatus({ loading: true, error: null, message: 'Updating task...' });
    
    // Find the current task to preserve its completed status
    const currentTask = tasks.find(task => task._id === id);
    const completed = currentTask ? currentTask.completed : false;

    axios.put(`${API_URL}/tasks/${id}`, { title: editText, completed })
      .then(response => {
        setTasksId(tasks.map(task => task._id === id ? response.data : task));
        setEditTaskId(null);
        setEditText('');
        setStatus({ loading: false, error: null, message: 'Task updated successfully!' });
      })
      .catch(error => {
        console.error('Error updating task:', error);
        console.error('Error details:', error.response ? error.response.data : 'No response data');
        
        const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
        setStatus({ 
          loading: false, 
          error: true, 
          message: `Failed to update task: ${errorMessage}` 
        });
      });
  };

  const handleCancelEdit = () => {
    setEditTaskId(null);
    setEditText('');
  };

  const handleToggleStrike = (id) => {
    // Find the current task
    const currentTask = tasks.find(task => task._id === id);
    if (!currentTask) return;
    
    // Toggle the completed status in the UI immediately for better UX
    setStrikedTasks(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
    
    // Update the completed status in the database
    const updatedCompleted = !currentTask.completed;
    
    setStatus({ loading: true, error: null, message: 'Updating task status...' });
    
    axios.put(`${API_URL}/tasks/${id}`, { 
      title: currentTask.title, 
      completed: updatedCompleted 
    })
      .then(response => {
        // Update the task in the state with the response from the server
        setTasksId(tasks.map(task => task._id === id ? response.data : task));
        setStatus({ loading: false, error: null, message: `Task marked as ${updatedCompleted ? 'completed' : 'incomplete'}` });
      })
      .catch(error => {
        console.error('Error updating task status:', error);
        console.error('Error details:', error.response ? error.response.data : 'No response data');
        
        // Revert the UI change if the API call fails
        setStrikedTasks(prev => ({
          ...prev,
          [id]: currentTask.completed,
        }));
        
        const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
        setStatus({ 
          loading: false, 
          error: true, 
          message: `Failed to update task status: ${errorMessage}` 
        });
      });
  };

  return (
    <div className="todo-container">
      <h1 className="no-print">To-Do List Project</h1>
      <div className="date-time-container no-print">
        <p className="date-display">{formattedDate}</p>
        <p className="time-display">{formattedTime}</p>
      </div>
      
      {/* Status message display */}
      {status.message && (
        <div className={`status-message ${status.error ? 'error' : status.loading ? 'loading' : 'success'}`}>
          {status.message}
        </div>
      )}

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

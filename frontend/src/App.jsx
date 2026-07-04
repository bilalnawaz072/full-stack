import React, { useState, useEffect } from 'react';
import { LayoutGrid, BarChart2, Plus, Wifi, WifiOff } from 'lucide-react';
import KanbanBoard from './components/KanbanBoard';
import AnalyticsView from './components/AnalyticsView';
import TaskModal from './components/TaskModal';

const API_BASE = 'http://localhost:5000/api';

export default function App() {
  const [activeView, setActiveView] = useState('board'); // 'board' | 'analytics'
  const [lists, setLists] = useState([]);
  const [tasks, setTasks] = useState([]);
  
  // Database status and fallbacks
  const [backendConnected, setBackendConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  // Modal controls
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [modalListId, setModalListId] = useState('');

  // Initial Fetch
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Test health endpoint
      const healthRes = await fetch(`${API_BASE}/health`);
      if (!healthRes.ok) throw new Error('Backend health check failed');
      
      // Fetch lists and tasks from backend
      const listsRes = await fetch(`${API_BASE}/lists`);
      const tasksRes = await fetch(`${API_BASE}/tasks`);
      
      const listsData = await listsRes.json();
      const tasksData = await tasksRes.json();

      setLists(listsData);
      setTasks(tasksData);
      setBackendConnected(true);
    } catch (err) {
      console.warn('Backend is offline. Falling back to localStorage...', err.message);
      setBackendConnected(false);
      loadLocalStorageData();
    } finally {
      setLoading(false);
    }
  };

  // Load from local storage if backend is offline
  const loadLocalStorageData = () => {
    const localLists = localStorage.getItem('taskflow_lists');
    const localTasks = localStorage.getItem('taskflow_tasks');

    if (localLists && localTasks) {
      setLists(JSON.parse(localLists));
      setTasks(JSON.parse(localTasks));
    } else {
      // Default placeholder data
      const defaultLists = [
        { id: 'todo', title: 'To Do', position: 1 },
        { id: 'inprogress', title: 'In Progress', position: 2 },
        { id: 'done', title: 'Completed', position: 3 }
      ];
      const defaultTasks = [
        {
          id: 'task-sample-1',
          list_id: 'todo',
          title: 'Welcome to TaskFlow! 🚀',
          description: 'This is a sample task card. Feel free to drag me to "In Progress" or "Completed"! Double click or click edit to see checklists and due dates.',
          priority: 'High',
          due_date: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
          position: 1,
          created_at: new Date().toISOString(),
          checklist: [
            { id: 'sub-1', text: 'Create a new list', completed: false },
            { id: 'sub-2', text: 'Drag a card to In Progress', completed: false }
          ]
        }
      ];
      setLists(defaultLists);
      setTasks(defaultTasks);
      localStorage.setItem('taskflow_lists', JSON.stringify(defaultLists));
      localStorage.setItem('taskflow_tasks', JSON.stringify(defaultTasks));
    }
  };

  // Synchronize state with storage depending on connection
  const syncLists = async (updatedLists) => {
    setLists(updatedLists);
    if (!backendConnected) {
      localStorage.setItem('taskflow_lists', JSON.stringify(updatedLists));
    }
  };

  const syncTasks = async (updatedTasks) => {
    setTasks(updatedTasks);
    if (!backendConnected) {
      localStorage.setItem('taskflow_tasks', JSON.stringify(updatedTasks));
    }
  };

  // --- TASK CRUD ACTIONS ---

  const handleOpenAddTask = (listId) => {
    setEditingTask(null);
    setModalListId(listId);
    setIsModalOpen(true);
  };

  const handleOpenEditTask = (task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleSaveTask = async (taskData) => {
    setIsModalOpen(false);
    
    if (editingTask) {
      // Update existing task
      const updatedTasks = tasks.map(t => t.id === taskData.id ? taskData : t);
      syncTasks(updatedTasks);

      if (backendConnected) {
        try {
          await fetch(`${API_BASE}/tasks/${taskData.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(taskData)
          });
        } catch (err) {
          console.error('Failed to sync updated task to backend', err);
        }
      }
    } else {
      // Create new task
      const newTask = {
        ...taskData,
        id: `task-${Date.now()}`,
        position: tasks.filter(t => t.list_id === taskData.list_id).length + 1,
        created_at: new Date().toISOString()
      };
      
      const updatedTasks = [...tasks, newTask];
      syncTasks(updatedTasks);

      if (backendConnected) {
        try {
          await fetch(`${API_BASE}/tasks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newTask)
          });
        } catch (err) {
          console.error('Failed to save new task to backend', err);
        }
      }
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    
    const updatedTasks = tasks.filter(t => t.id !== taskId);
    syncTasks(updatedTasks);

    if (backendConnected) {
      try {
        await fetch(`${API_BASE}/tasks/${taskId}`, { method: 'DELETE' });
      } catch (err) {
        console.error('Failed to delete task from backend', err);
      }
    }
  };

  const handleMoveTask = async (taskId, targetListId) => {
    // Optimistic UI update
    const movedTask = tasks.find(t => t.id === taskId);
    if (!movedTask || movedTask.list_id === targetListId) return;

    const listTasks = tasks.filter(t => t.list_id === targetListId);
    const newPosition = listTasks.length + 1;

    const updatedTasks = tasks.map(t => 
      t.id === taskId 
        ? { ...t, list_id: targetListId, position: newPosition }
        : t
    );

    syncTasks(updatedTasks);

    if (backendConnected) {
      try {
        await fetch(`${API_BASE}/tasks/${taskId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ list_id: targetListId, position: newPosition })
        });
      } catch (err) {
        console.error('Failed to move task in backend', err);
      }
    }
  };

  // --- LIST CRUD ACTIONS ---

  const handleAddList = async (newList) => {
    const updatedLists = [...lists, newList];
    syncLists(updatedLists);

    if (backendConnected) {
      try {
        await fetch(`${API_BASE}/lists`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newList)
        });
      } catch (err) {
        console.error('Failed to create new list in backend', err);
      }
    }
  };

  const handleRenameList = async (listId, newTitle) => {
    const updatedLists = lists.map(l => l.id === listId ? { ...l, title: newTitle } : l);
    syncLists(updatedLists);

    if (backendConnected) {
      try {
        await fetch(`${API_BASE}/lists/${listId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: newTitle })
        });
      } catch (err) {
        console.error('Failed to rename list in backend', err);
      }
    }
  };

  const handleDeleteList = async (listId) => {
    if (!confirm('Are you sure you want to delete this column? Doing so will delete all tasks within it.')) return;

    const updatedLists = lists.filter(l => l.id !== listId);
    const updatedTasks = tasks.filter(t => t.list_id !== listId);
    
    syncLists(updatedLists);
    syncTasks(updatedTasks);

    if (backendConnected) {
      try {
        await fetch(`${API_BASE}/lists/${listId}`, { method: 'DELETE' });
      } catch (err) {
        console.error('Failed to delete list from backend', err);
      }
    }
  };

  return (
    <div style={{
      maxWidth: '1280px',
      margin: '0 auto',
      padding: '30px 20px',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      gap: '24px'
    }}>
      {/* App Header */}
      <header className="glass-panel" style={{
        padding: '16px 28px',
        borderRadius: 'var(--radius-lg)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        {/* Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
            width: '32px',
            height: '32px',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: '1.2rem',
            color: '#fff',
            fontFamily: 'var(--font-display)',
            boxShadow: 'var(--glow-primary)'
          }}>
            T
          </div>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.4rem',
            fontWeight: 800,
            letterSpacing: '-0.5px',
            color: '#fff'
          }}>
            Task<span style={{ color: 'var(--color-primary)' }}>Flow</span>
          </h1>
        </div>

        {/* View Selection Navigation */}
        <nav style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setActiveView('board')}
            className={`btn ${activeView === 'board' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '8px 16px', fontSize: '0.85rem' }}
          >
            <LayoutGrid size={15} />
            Kanban Board
          </button>
          <button
            onClick={() => setActiveView('analytics')}
            className={`btn ${activeView === 'analytics' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '8px 16px', fontSize: '0.85rem' }}
          >
            <BarChart2 size={15} />
            Analytics Dashboard
          </button>
        </nav>

        {/* Server Connection Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {backendConnected ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.8rem',
              color: 'var(--color-success)',
              backgroundColor: 'rgba(16, 185, 129, 0.08)',
              padding: '6px 12px',
              borderRadius: '99px',
              border: '1px solid rgba(16, 185, 129, 0.15)'
            }}>
              <Wifi size={14} />
              <span>Live Database Connected</span>
            </div>
          ) : (
            <button
              onClick={fetchData}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.8rem',
                color: 'var(--color-warning)',
                backgroundColor: 'rgba(245, 158, 11, 0.08)',
                padding: '6px 12px',
                borderRadius: '99px',
                border: '1px solid rgba(245, 158, 11, 0.15)',
                cursor: 'pointer'
              }}
              title="Click to retry connecting"
            >
              <WifiOff size={14} />
              <span>Offline Cache Mode</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{ flex: 1 }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '300px', gap: '16px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              border: '3px solid rgba(255, 255, 255, 0.05)',
              borderTopColor: 'var(--color-primary)',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loading project data...</p>
            <style>{`
              @keyframes spin {
                to { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        ) : activeView === 'board' ? (
          <KanbanBoard
            lists={lists}
            tasks={tasks}
            onAddTask={handleOpenAddTask}
            onEditTask={handleOpenEditTask}
            onDeleteTask={handleDeleteTask}
            onAddList={handleAddList}
            onRenameList={handleRenameList}
            onDeleteList={handleDeleteList}
            onMoveTask={handleMoveTask}
          />
        ) : (
          <AnalyticsView lists={lists} tasks={tasks} />
        )}
      </main>

      {/* Footer Info */}
      <footer style={{
        textAlign: 'center',
        padding: '20px 0',
        color: 'var(--text-dark)',
        fontSize: '0.75rem',
        borderTop: '1px solid rgba(255,255,255,0.02)',
        marginTop: 'auto'
      }}>
        TaskFlow Practice App &bull; Built with React &amp; Express &bull; Drag &amp; Drop Ready
      </footer>

      {/* Task Modal Editor */}
      {isModalOpen && (
        <TaskModal
          task={editingTask}
          lists={lists}
          currentListId={modalListId}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveTask}
        />
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, CheckSquare } from 'lucide-react';

export default function TaskModal({ task, lists, currentListId, onClose, onSave }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [dueDate, setDueDate] = useState('');
  const [listId, setListId] = useState('');
  const [checklist, setChecklist] = useState([]);
  const [newSubtask, setNewSubtask] = useState('');

  // Hydrate modal values on load or task change
  useEffect(() => {
    if (task) {
      setTitle(task.title || '');
      setDescription(task.description || '');
      setPriority(task.priority || 'Medium');
      setDueDate(task.due_date ? task.due_date.split('T')[0] : '');
      setListId(task.list_id || currentListId || '');
      setChecklist(task.checklist || []);
    } else {
      setTitle('');
      setDescription('');
      setPriority('Medium');
      setDueDate('');
      setListId(currentListId || (lists.length > 0 ? lists[0].id : ''));
      setChecklist([]);
    }
  }, [task, currentListId, lists]);

  const handleAddSubtask = (e) => {
    e.preventDefault();
    if (!newSubtask.trim()) return;
    const newItem = {
      id: `subtask-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text: newSubtask.trim(),
      completed: false
    };
    setChecklist([...checklist, newItem]);
    setNewSubtask('');
  };

  const handleToggleSubtask = (id) => {
    setChecklist(
      checklist.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  };

  const handleDeleteSubtask = (id) => {
    setChecklist(checklist.filter((item) => item.id !== id));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    const taskData = {
      title: title.trim(),
      description: description.trim(),
      priority,
      due_date: dueDate || null,
      list_id: listId,
      checklist
    };

    if (task) {
      taskData.id = task.id;
      taskData.position = task.position;
      taskData.created_at = task.created_at;
    }

    onSave(taskData);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(5, 7, 16, 0.8)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div 
        className="glass-panel animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '540px',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh'
        }}
      >
        {/* Modal Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--panel-border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h3 style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: '1.25rem',
            background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            {task ? 'Edit Task Details' : 'Create New Task'}
          </h3>
          <button 
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '6px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255,255,255,0.02)'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} style={{
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px',
          overflowY: 'auto',
          flex: 1
        }}>
          {/* Title */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Task Title *</label>
            <input 
              type="text" 
              placeholder="e.g. Redesign Dashboard UI" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              required
              autoFocus
            />
          </div>

          {/* Description */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Description</label>
            <textarea 
              placeholder="Add details, links, or notes..." 
              value={description} 
              onChange={(e) => setDescription(e.target.value)}
              rows="3"
              style={{ resize: 'vertical' }}
            />
          </div>

          {/* Configuration Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '16px'
          }}>
            {/* Priority */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Priority</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value)}>
                <option value="Low">🟢 Low</option>
                <option value="Medium">🟡 Medium</option>
                <option value="High">🔴 High</option>
              </select>
            </div>

            {/* Due Date */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Due Date</label>
              <input 
                type="date" 
                value={dueDate} 
                onChange={(e) => setDueDate(e.target.value)} 
              />
            </div>

            {/* List / Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Column</label>
              <select value={listId} onChange={(e) => setListId(e.target.value)}>
                {lists.map((list) => (
                  <option key={list.id} value={list.id}>
                    {list.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Checklist Area */}
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '10px',
            borderTop: '1px solid var(--panel-border)',
            paddingTop: '18px',
            marginTop: '8px'
          }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckSquare size={14} />
              Checklist / Subtasks
            </label>

            {/* Subtask Input */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <input 
                type="text" 
                placeholder="Add subtask..." 
                value={newSubtask} 
                onChange={(e) => setNewSubtask(e.target.value)}
                style={{ flex: 1 }}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddSubtask(e); } }}
              />
              <button 
                type="button"
                onClick={handleAddSubtask}
                className="btn btn-secondary"
                style={{ padding: '10px 14px' }}
              >
                <Plus size={16} />
              </button>
            </div>

            {/* Checklist items list */}
            {checklist.length > 0 && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                maxHeight: '160px',
                overflowY: 'auto',
                padding: '4px',
                backgroundColor: 'rgba(0,0,0,0.15)',
                borderRadius: 'var(--radius-sm)'
              }}>
                {checklist.map((item) => (
                  <div 
                    key={item.id} 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      padding: '8px 10px',
                      backgroundColor: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.04)',
                      borderRadius: '4px'
                    }}
                  >
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', flex: 1 }}>
                      <input 
                        type="checkbox" 
                        checked={item.completed} 
                        onChange={() => handleToggleSubtask(item.id)}
                        style={{ width: '15px', height: '15px', cursor: 'pointer' }}
                      />
                      <span style={{ 
                        fontSize: '0.85rem',
                        textDecoration: item.completed ? 'line-through' : 'none',
                        color: item.completed ? 'var(--text-dark)' : 'var(--text-main)',
                        transition: 'all var(--transition-fast)'
                      }}>
                        {item.text}
                      </span>
                    </label>
                    <button 
                      type="button"
                      onClick={() => handleDeleteSubtask(item.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.color = 'var(--color-accent)'}
                      onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Modal Actions */}
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
            borderTop: '1px solid var(--panel-border)',
            paddingTop: '18px',
            marginTop: '8px'
          }}>
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={onClose}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

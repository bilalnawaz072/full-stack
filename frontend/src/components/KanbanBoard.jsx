import React, { useState } from 'react';
import { Plus, FolderPlus, Trash2, Edit3, Check } from 'lucide-react';
import TaskCard from './TaskCard';

export default function KanbanBoard({ 
  lists, 
  tasks, 
  onAddTask, 
  onEditTask, 
  onDeleteTask, 
  onAddList, 
  onRenameList, 
  onDeleteList, 
  onMoveTask 
}) {
  const [newListTitle, setNewListTitle] = useState('');
  const [isAddingList, setIsAddingList] = useState(false);
  const [editingListId, setEditingListId] = useState(null);
  const [editingListTitle, setEditingListTitle] = useState('');
  
  // Track which column is currently being dragged over
  const [draggedOverListId, setDraggedOverListId] = useState(null);

  // Drag handlers
  const handleDragStart = (e, taskId) => {
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, listId) => {
    e.preventDefault();
    setDraggedOverListId(listId);
  };

  const handleDragLeave = () => {
    setDraggedOverListId(null);
  };

  const handleDrop = (e, listId) => {
    e.preventDefault();
    setDraggedOverListId(null);
    const taskId = e.dataTransfer.getData('text/plain');
    if (taskId) {
      onMoveTask(taskId, listId);
    }
  };

  const handleCreateList = (e) => {
    e.preventDefault();
    if (!newListTitle.trim()) return;
    
    const newList = {
      id: `list-${Date.now()}`,
      title: newListTitle.trim(),
      position: lists.length + 1
    };
    
    onAddList(newList);
    setNewListTitle('');
    setIsAddingList(false);
  };

  const startEditingList = (list) => {
    setEditingListId(list.id);
    setEditingListTitle(list.title);
  };

  const handleSaveListTitle = (listId) => {
    if (!editingListTitle.trim()) return;
    onRenameList(listId, editingListTitle.trim());
    setEditingListId(null);
  };

  return (
    <div style={{
      display: 'flex',
      gap: '24px',
      overflowX: 'auto',
      padding: '10px 4px 24px 4px',
      minHeight: 'calc(100vh - 220px)',
      alignItems: 'flex-start'
    }}>
      {/* Render Lists */}
      {lists.map((list) => {
        const listTasks = tasks
          .filter((t) => t.list_id === list.id)
          .sort((a, b) => a.position - b.position);
          
        const isDraggedOver = draggedOverListId === list.id;

        return (
          <div
            key={list.id}
            onDragOver={(e) => handleDragOver(e, list.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, list.id)}
            className="glass-panel list-column"
            style={{
              flexShrink: 0,
              width: '320px',
              borderRadius: 'var(--radius-lg)',
              padding: '18px',
              display: 'flex',
              flexDirection: 'column',
              maxHeight: 'calc(100vh - 240px)',
              border: isDraggedOver ? '2px dashed var(--color-primary)' : '1px solid var(--panel-border)',
              boxShadow: isDraggedOver ? 'var(--glow-primary)' : 'var(--shadow-main)',
              transition: 'all var(--transition-fast)',
              backgroundColor: isDraggedOver ? 'rgba(6, 182, 212, 0.05)' : 'var(--panel-bg)'
            }}
          >
            {/* Column Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
              gap: '8px'
            }}>
              {editingListId === list.id ? (
                <div style={{ display: 'flex', gap: '6px', width: '100%' }}>
                  <input
                    type="text"
                    value={editingListTitle}
                    onChange={(e) => setEditingListTitle(e.target.value)}
                    style={{ flex: 1, padding: '4px 8px', fontSize: '0.9rem' }}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSaveListTitle(list.id); }}
                    autoFocus
                  />
                  <button
                    onClick={() => handleSaveListTitle(list.id)}
                    className="btn btn-primary"
                    style={{ padding: '6px 10px', borderRadius: 'var(--radius-sm)' }}
                  >
                    <Check size={14} />
                  </button>
                </div>
              ) : (
                <>
                  <div 
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', overflow: 'hidden' }}
                    onDoubleClick={() => startEditingList(list)}
                    title="Double-click to rename"
                  >
                    <h3 style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '1rem',
                      fontWeight: 700,
                      color: 'var(--text-main)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {list.title}
                    </h3>
                    <span style={{
                      fontSize: '0.75rem',
                      color: 'var(--text-muted)',
                      backgroundColor: 'rgba(255,255,255,0.04)',
                      padding: '2px 6px',
                      borderRadius: '10px'
                    }}>
                      {listTasks.length}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      onClick={() => startEditingList(list)}
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                      title="Rename Column"
                    >
                      <Edit3 size={13} />
                    </button>
                    {/* Only allow deleting custom lists, protect core default list elements or allow all */}
                    <button
                      onClick={() => onDeleteList(list.id)}
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                      title="Delete Column"
                      onMouseOver={(e) => e.currentTarget.style.color = 'var(--color-accent)'}
                      onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Column Cards Container */}
            <div 
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                overflowY: 'auto',
                flex: 1,
                paddingRight: '4px',
                minHeight: '60px' // helps dropping onto empty columns
              }}
            >
              {listTasks.length > 0 ? (
                listTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onEdit={onEditTask}
                    onDelete={onDeleteTask}
                    onDragStart={handleDragStart}
                  />
                ))
              ) : (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '80px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px dashed rgba(255,255,255,0.03)',
                  color: 'var(--text-dark)',
                  fontSize: '0.8rem'
                }}>
                  Drop tasks here
                </div>
              )}
            </div>

            {/* Column Add Task Trigger */}
            <button
              onClick={() => onAddTask(list.id)}
              className="btn btn-secondary"
              style={{
                width: '100%',
                marginTop: '16px',
                justifyContent: 'center',
                padding: '8px 0',
                fontSize: '0.85rem',
                borderStyle: 'dashed',
                background: 'rgba(255,255,255,0.01)'
              }}
            >
              <Plus size={14} /> Add Card
            </button>
          </div>
        );
      })}

      {/* Add New List Card */}
      <div 
        className="glass-panel"
        style={{
          flexShrink: 0,
          width: '320px',
          borderRadius: 'var(--radius-lg)',
          padding: '18px',
          border: '1px dashed rgba(255, 255, 255, 0.1)',
          background: 'rgba(17, 24, 43, 0.25)',
          transition: 'all var(--transition-normal)'
        }}
      >
        {isAddingList ? (
          <form onSubmit={handleCreateList} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input
              type="text"
              placeholder="Column title..."
              value={newListTitle}
              onChange={(e) => setNewListTitle(e.target.value)}
              style={{ width: '100%' }}
              required
              autoFocus
            />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => setIsAddingList(false)}
                style={{ padding: '8px 12px', fontSize: '0.85rem' }}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn btn-primary"
                style={{ padding: '8px 12px', fontSize: '0.85rem' }}
              >
                Create
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setIsAddingList(true)}
            className="btn btn-secondary"
            style={{
              width: '100%',
              justifyContent: 'center',
              borderStyle: 'dashed',
              padding: '12px 0',
              fontSize: '0.9rem',
              color: 'var(--text-muted)'
            }}
          >
            <FolderPlus size={16} /> New Column
          </button>
        )}
      </div>
    </div>
  );
}

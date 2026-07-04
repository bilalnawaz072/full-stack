import React from 'react';
import { Calendar, CheckSquare, Trash2, Edit2, AlertCircle } from 'lucide-react';

export default function TaskCard({ task, onEdit, onDelete, onDragStart }) {
  const { id, title, description, priority, due_date, checklist } = task;

  // Calculate subtask completion progress
  const totalSubtasks = checklist?.length || 0;
  const completedSubtasks = checklist?.filter((s) => s.completed).length || 0;
  const progressPercent = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

  // Format date and check if overdue
  const isOverdue = () => {
    if (!due_date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(due_date);
    due.setHours(0, 0, 0, 0);
    return due < today;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  return (
    <div
      className="glass-card task-card animate-fade-in"
      draggable
      onDragStart={(e) => onDragStart(e, id)}
      style={{
        padding: '16px',
        borderRadius: 'var(--radius-md)',
        cursor: 'grab',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        userSelect: 'none'
      }}
    >
      {/* Task Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
        <span className={`badge-priority ${priority?.toLowerCase() || 'medium'}`}>
          {priority || 'Medium'}
        </span>
        
        {/* Actions Menu */}
        <div className="card-actions" style={{ display: 'flex', gap: '4px' }}>
          <button
            onClick={() => onEdit(task)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px',
              display: 'inline-flex',
              transition: 'all var(--transition-fast)'
            }}
            title="Edit Task"
            onMouseOver={(e) => e.currentTarget.style.color = 'var(--color-primary)'}
            onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            <Edit2 size={14} />
          </button>
          <button
            onClick={() => onDelete(id)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px',
              display: 'inline-flex',
              transition: 'all var(--transition-fast)'
            }}
            title="Delete Task"
            onMouseOver={(e) => e.currentTarget.style.color = 'var(--color-accent)'}
            onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Task Body */}
      <div>
        <h4 style={{ 
          fontFamily: 'var(--font-display)', 
          fontWeight: 600, 
          fontSize: '0.95rem',
          color: 'var(--text-main)',
          marginBottom: '6px',
          lineHeight: '1.4'
        }}>
          {title}
        </h4>
        {description && (
          <p style={{
            fontSize: '0.82rem',
            color: 'var(--text-muted)',
            lineHeight: '1.4',
            display: '-webkit-box',
            WebkitLineClamp: '2',
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'normal'
          }}>
            {description}
          </p>
        )}
      </div>

      {/* Checklist Progress */}
      {totalSubtasks > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <CheckSquare size={12} />
              Checklist
            </span>
            <span>{completedSubtasks}/{totalSubtasks} ({progressPercent}%)</span>
          </div>
          <div style={{ width: '100%', height: '5px', background: 'rgba(255,255,255,0.06)', borderRadius: '99px', overflow: 'hidden' }}>
            <div 
              style={{ 
                width: `${progressPercent}%`, 
                height: '100%', 
                background: 'linear-gradient(90deg, var(--color-primary), var(--color-secondary))',
                borderRadius: '99px',
                transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            />
          </div>
        </div>
      )}

      {/* Task Footer */}
      {due_date && (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '6px', 
          fontSize: '0.75rem', 
          color: isOverdue() ? 'var(--color-accent)' : 'var(--text-muted)',
          marginTop: '4px',
          background: isOverdue() ? 'rgba(244, 63, 94, 0.08)' : 'rgba(255, 255, 255, 0.02)',
          padding: '4px 8px',
          borderRadius: '4px',
          alignSelf: 'flex-start',
          border: isOverdue() ? '1px solid rgba(244, 63, 94, 0.15)' : '1px solid rgba(255, 255, 255, 0.04)'
        }}>
          {isOverdue() ? <AlertCircle size={12} /> : <Calendar size={12} />}
          <span>
            {isOverdue() ? 'Overdue: ' : 'Due: '}
            {formatDate(due_date)}
          </span>
        </div>
      )}
    </div>
  );
}

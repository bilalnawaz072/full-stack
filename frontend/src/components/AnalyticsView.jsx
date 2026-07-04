import React from 'react';
import { BarChart2, CheckCircle, Clock, AlertTriangle } from 'lucide-react';

export default function AnalyticsView({ lists, tasks }) {
  // --- CALCULATION LOGIC ---
  const totalTasks = tasks.length;
  
  // Find lists that signify completion (e.g., matching title "Completed", "Done" or id "done")
  const doneListIds = lists
    .filter(l => l.id === 'done' || l.title.toLowerCase().includes('complete') || l.title.toLowerCase().includes('done'))
    .map(l => l.id);

  const completedTasks = tasks.filter(t => doneListIds.includes(t.list_id)).length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Overdue count
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const overdueTasks = tasks.filter(t => {
    if (!t.due_date || doneListIds.includes(t.list_id)) return false;
    const due = new Date(t.due_date);
    due.setHours(0, 0, 0, 0);
    return due < today;
  }).length;

  // Priorities count
  const priorities = {
    High: tasks.filter(t => t.priority === 'High').length,
    Medium: tasks.filter(t => t.priority === 'Medium').length,
    Low: tasks.filter(t => t.priority === 'Low').length
  };

  const maxPriorityCount = Math.max(priorities.High, priorities.Medium, priorities.Low, 1);

  // Column load breakdown
  const columnData = lists.map(list => {
    const count = tasks.filter(t => t.list_id === list.id).length;
    const percent = totalTasks > 0 ? Math.round((count / totalTasks) * 100) : 0;
    return {
      title: list.title,
      count,
      percent
    };
  });

  // SVG circular progress parameters
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (completionRate / 100) * circumference;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }} className="animate-fade-in">
      {/* 1. Summary Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '20px'
      }}>
        {/* Total Tasks */}
        <div className="glass-panel" style={{ padding: '24px', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Tasks</p>
            <h3 style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-display)', marginTop: '8px', color: 'var(--text-main)' }}>{totalTasks}</h3>
          </div>
          <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-md)', background: 'rgba(6, 182, 212, 0.15)', display: 'flex', alignItems: 'center', justifyContext: 'center', color: 'var(--color-primary)', display: 'inline-flex', justifyContent: 'center' }}>
            <BarChart2 size={24} style={{ alignSelf: 'center' }} />
          </div>
        </div>

        {/* Completed Tasks */}
        <div className="glass-panel" style={{ padding: '24px', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Completed Tasks</p>
            <h3 style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-display)', marginTop: '8px', color: 'var(--text-main)' }}>{completedTasks}</h3>
          </div>
          <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-md)', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContext: 'center', color: 'var(--color-success)', display: 'inline-flex', justifyContent: 'center' }}>
            <CheckCircle size={24} style={{ alignSelf: 'center' }} />
          </div>
        </div>

        {/* Completion Rate */}
        <div className="glass-panel" style={{ padding: '20px 24px', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Completion Rate</p>
            <h3 style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-display)', marginTop: '8px', color: 'var(--text-main)' }}>{completionRate}%</h3>
          </div>
          {/* Circular SVG Gauge */}
          <div style={{ position: 'relative', width: '60px', height: '60px' }}>
            <svg width="60" height="60" viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)' }}>
              <circle
                cx="60"
                cy="60"
                r={radius}
                fill="transparent"
                stroke="rgba(255, 255, 255, 0.05)"
                strokeWidth="10"
              />
              <circle
                cx="60"
                cy="60"
                r={radius}
                fill="transparent"
                stroke="url(#gradient-success)"
                strokeWidth="10"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.8s ease-in-out' }}
              />
              <defs>
                <linearGradient id="gradient-success" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="var(--color-primary)" />
                  <stop offset="100%" stopColor="var(--color-success)" />
                </linearGradient>
              </defs>
            </svg>
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              fontSize: '0.75rem',
              fontWeight: '700',
              color: 'var(--color-success)'
            }}>
              {completionRate}%
            </div>
          </div>
        </div>

        {/* Overdue Tasks */}
        <div className="glass-panel" style={{ padding: '24px', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Overdue Tasks</p>
            <h3 style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-display)', marginTop: '8px', color: 'var(--text-main)' }}>{overdueTasks}</h3>
          </div>
          <div style={{ 
            width: '48px', 
            height: '48px', 
            borderRadius: 'var(--radius-md)', 
            background: overdueTasks > 0 ? 'rgba(244, 63, 94, 0.15)' : 'rgba(255, 255, 255, 0.05)', 
            display: 'flex', 
            alignItems: 'center', 
            color: overdueTasks > 0 ? 'var(--color-accent)' : 'var(--text-muted)',
            display: 'inline-flex',
            justifyContent: 'center' 
          }}>
            <AlertTriangle size={24} style={{ alignSelf: 'center' }} />
          </div>
        </div>
      </div>

      {/* 2. Visual Graphs Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '24px'
      }}>
        {/* Priority Distribution Chart */}
        <div className="glass-panel" style={{ padding: '28px', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700 }}>Priority Distribution</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '4px' }}>Breakdown of task volume by urgency</p>
          </div>

          {/* SVG Custom Bar Chart */}
          <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end', height: '180px', paddingTop: '10px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
            {/* Low Priority Bar */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', width: '60px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-success)' }}>{priorities.Low}</span>
              <div style={{
                width: '32px',
                height: `${(priorities.Low / maxPriorityCount) * 120}px`,
                minHeight: priorities.Low > 0 ? '8px' : '0px',
                background: 'linear-gradient(180deg, var(--color-success) 0%, rgba(16, 185, 129, 0.2) 100%)',
                borderRadius: '6px 6px 0 0',
                boxShadow: '0 0 15px rgba(16, 185, 129, 0.15)',
                transition: 'height 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
              }} />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>Low</span>
            </div>

            {/* Medium Priority Bar */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', width: '60px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-warning)' }}>{priorities.Medium}</span>
              <div style={{
                width: '32px',
                height: `${(priorities.Medium / maxPriorityCount) * 120}px`,
                minHeight: priorities.Medium > 0 ? '8px' : '0px',
                background: 'linear-gradient(180deg, var(--color-warning) 0%, rgba(245, 158, 11, 0.2) 100%)',
                borderRadius: '6px 6px 0 0',
                boxShadow: '0 0 15px rgba(245, 158, 11, 0.15)',
                transition: 'height 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
              }} />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>Medium</span>
            </div>

            {/* High Priority Bar */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', width: '60px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-accent)' }}>{priorities.High}</span>
              <div style={{
                width: '32px',
                height: `${(priorities.High / maxPriorityCount) * 120}px`,
                minHeight: priorities.High > 0 ? '8px' : '0px',
                background: 'linear-gradient(180deg, var(--color-accent) 0%, rgba(244, 63, 94, 0.2) 100%)',
                borderRadius: '6px 6px 0 0',
                boxShadow: '0 0 15px rgba(244, 63, 94, 0.15)',
                transition: 'height 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
              }} />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>High</span>
            </div>
          </div>
        </div>

        {/* Column Task Loads Chart */}
        <div className="glass-panel" style={{ padding: '28px', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700 }}>Task Distribution by Column</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '4px' }}>Proportion of work across stages</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, justifyContent: 'center' }}>
            {columnData.map((col, idx) => (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{col.title}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    {col.count} tasks ({col.percent}%)
                  </span>
                </div>
                <div style={{ width: '100%', height: '8px', background: 'rgba(255, 255, 255, 0.04)', borderRadius: '99px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${col.percent}%`,
                      height: '100%',
                      background: idx % 2 === 0 
                        ? 'linear-gradient(90deg, var(--color-primary), var(--color-secondary))'
                        : 'linear-gradient(90deg, var(--color-secondary), var(--color-accent))',
                      borderRadius: '99px',
                      transition: 'width 0.6s ease-in-out'
                    }}
                  />
                </div>
              </div>
            ))}
            {columnData.length === 0 && (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', padding: '20px 0' }}>
                No active columns on the board.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

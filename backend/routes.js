const express = require('express');
const router = express.Router();
const db = require('./db');

// --- LISTS ROUTES ---

// Get all columns/lists, sorted by position
router.get('/lists', async (req, res) => {
  try {
    const lists = await db.query('SELECT * FROM lists ORDER BY position ASC');
    res.json(lists);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a new column/list
router.post('/lists', async (req, res) => {
  const { id, title, position } = req.body;
  if (!id || !title) {
    return res.status(400).json({ error: 'id and title are required.' });
  }
  
  try {
    const listPosition = position || 1;
    await db.query(
      'INSERT INTO lists (id, title, position) VALUES (?, ?, ?)',
      [id, title, listPosition]
    );
    res.status(201).json({ id, title, position: listPosition });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a list (e.g. rename title)
router.put('/lists/:id', async (req, res) => {
  const { id } = req.params;
  const { title, position } = req.body;
  
  try {
    if (title !== undefined && position !== undefined) {
      await db.query('UPDATE lists SET title = ?, position = ? WHERE id = ?', [title, position, id]);
    } else if (title !== undefined) {
      await db.query('UPDATE lists SET title = ? WHERE id = ?', [title, id]);
    } else if (position !== undefined) {
      await db.query('UPDATE lists SET position = ? WHERE id = ?', [position, id]);
    }
    res.json({ message: 'List updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a list and all tasks associated with it
router.delete('/lists/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // Delete all tasks in the list first
    await db.query('DELETE FROM tasks WHERE list_id = ?', [id]);
    // Delete the list itself
    await db.query('DELETE FROM lists WHERE id = ?', [id]);
    res.json({ message: 'List and its tasks deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Batch reorder lists
router.post('/lists/reorder', async (req, res) => {
  const { lists } = req.body; // Array of { id, position }
  if (!Array.isArray(lists)) {
    return res.status(400).json({ error: 'lists must be an array of { id, position } objects.' });
  }

  try {
    for (const item of lists) {
      await db.query('UPDATE lists SET position = ? WHERE id = ?', [item.position, item.id]);
    }
    res.json({ message: 'Lists reordered successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// --- TASKS ROUTES ---

// Get all tasks
router.get('/tasks', async (req, res) => {
  try {
    const tasks = await db.query('SELECT * FROM tasks ORDER BY list_id, position ASC');
    // Parse the checklist JSON strings back into objects
    const parsedTasks = tasks.map(task => ({
      ...task,
      checklist: task.checklist ? JSON.parse(task.checklist) : []
    }));
    res.json(parsedTasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a new task
router.post('/tasks', async (req, res) => {
  const { id, list_id, title, description, priority, due_date, position, checklist } = req.body;
  if (!id || !list_id || !title) {
    return res.status(400).json({ error: 'id, list_id, and title are required.' });
  }

  try {
    const taskPosition = position || 1;
    const taskPriority = priority || 'Medium';
    const taskChecklist = checklist ? JSON.stringify(checklist) : JSON.stringify([]);
    const createdAt = new Date().toISOString();

    await db.query(
      `INSERT INTO tasks (id, list_id, title, description, priority, due_date, position, created_at, checklist)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, list_id, title, description || '', taskPriority, due_date || null, taskPosition, createdAt, taskChecklist]
    );

    res.status(201).json({
      id,
      list_id,
      title,
      description: description || '',
      priority: taskPriority,
      due_date: due_date || null,
      position: taskPosition,
      created_at: createdAt,
      checklist: checklist || []
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a single task's details
router.put('/tasks/:id', async (req, res) => {
  const { id } = req.params;
  const { list_id, title, description, priority, due_date, position, checklist } = req.body;

  try {
    // Dynamically build the update query based on fields provided
    const fields = [];
    const params = [];

    if (list_id !== undefined) { fields.push('list_id = ?'); params.push(list_id); }
    if (title !== undefined) { fields.push('title = ?'); params.push(title); }
    if (description !== undefined) { fields.push('description = ?'); params.push(description); }
    if (priority !== undefined) { fields.push('priority = ?'); params.push(priority); }
    if (due_date !== undefined) { fields.push('due_date = ?'); params.push(due_date); }
    if (position !== undefined) { fields.push('position = ?'); params.push(position); }
    if (checklist !== undefined) { 
      fields.push('checklist = ?'); 
      params.push(JSON.stringify(checklist)); 
    }

    if (fields.length === 0) {
      return res.status(400).json({ error: 'No fields to update.' });
    }

    params.push(id); // For the WHERE clause
    await db.query(`UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`, params);

    res.json({ message: 'Task updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Batch reorder tasks (e.g. after dragging across columns)
router.post('/tasks/reorder', async (req, res) => {
  const { tasks } = req.body; // Array of { id, list_id, position }
  if (!Array.isArray(tasks)) {
    return res.status(400).json({ error: 'tasks must be an array of { id, list_id, position }.' });
  }

  try {
    for (const item of tasks) {
      await db.query(
        'UPDATE tasks SET list_id = ?, position = ? WHERE id = ?',
        [item.list_id, item.position, item.id]
      );
    }
    res.json({ message: 'Tasks reordered successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a task
router.delete('/tasks/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM tasks WHERE id = ?', [id]);
    res.json({ message: 'Task deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

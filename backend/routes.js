const express = require('express');
const router = express.Router();
const { prisma } = require('./db');

// --- LISTS ROUTES ---

// Get all columns/lists, sorted by position
router.get('/lists', async (req, res) => {
  try {
    const lists = await prisma.list.findMany({
      orderBy: { position: 'asc' }
    });
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
    const newList = await prisma.list.create({
      data: {
        id,
        title,
        position: listPosition
      }
    });
    res.status(201).json(newList);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a list (e.g. rename title)
router.put('/lists/:id', async (req, res) => {
  const { id } = req.params;
  const { title, position } = req.body;
  
  try {
    await prisma.list.update({
      where: { id },
      data: {
        title: title !== undefined ? title : undefined,
        position: position !== undefined ? position : undefined
      }
    });
    res.json({ message: 'List updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a list (cascading deletes will handle the tasks automatically)
router.delete('/lists/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.list.delete({
      where: { id }
    });
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
    const queries = lists.map(item => 
      prisma.list.update({
        where: { id: item.id },
        data: { position: item.position }
      })
    );
    await prisma.$transaction(queries);
    res.json({ message: 'Lists reordered successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// --- TASKS ROUTES ---

// Get all tasks
router.get('/tasks', async (req, res) => {
  try {
    const tasks = await prisma.task.findMany({
      orderBy: [
        { list_id: 'asc' },
        { position: 'asc' }
      ]
    });
    res.json(tasks);
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
    const newTask = await prisma.task.create({
      data: {
        id,
        list_id,
        title,
        description: description || '',
        priority: priority || 'Medium',
        due_date: due_date || null,
        position: position || 1,
        checklist: checklist || []
      }
    });
    res.status(201).json(newTask);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a single task's details
router.put('/tasks/:id', async (req, res) => {
  const { id } = req.params;
  const { list_id, title, description, priority, due_date, position, checklist } = req.body;

  try {
    await prisma.task.update({
      where: { id },
      data: {
        list_id: list_id !== undefined ? list_id : undefined,
        title: title !== undefined ? title : undefined,
        description: description !== undefined ? description : undefined,
        priority: priority !== undefined ? priority : undefined,
        due_date: due_date !== undefined ? due_date : undefined,
        position: position !== undefined ? position : undefined,
        checklist: checklist !== undefined ? checklist : undefined
      }
    });
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
    const queries = tasks.map(item => 
      prisma.task.update({
        where: { id: item.id },
        data: {
          list_id: item.list_id,
          position: item.position
        }
      })
    );
    await prisma.$transaction(queries);
    res.json({ message: 'Tasks reordered successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a task
router.delete('/tasks/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.task.delete({
      where: { id }
    });
    res.json({ message: 'Task deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

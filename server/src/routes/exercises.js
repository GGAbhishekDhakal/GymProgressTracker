const { Router } = require('express');
const { supabase } = require('../db');
const { authenticate, authorize } = require('../middleware/auth');

const router = Router();

router.use(authenticate);

router.get('/', async (req, res) => {
  const { muscle_group, search } = req.query;
  let query = supabase.from('exercises').select('*').order('muscle_group').order('name');
  if (muscle_group) query = query.eq('muscle_group', muscle_group);
  if (search) query = query.ilike('name', `%${search}%`);
  const { data, error } = await query;
  if (error) throw error;
  res.json(data);
});

router.post('/', authorize('superadmin', 'admin'), async (req, res) => {
  const { name, muscle_group, category } = req.body;
  if (!name || !muscle_group) return res.status(400).json({ error: 'Name and muscle_group are required' });
  const { data, error } = await supabase
    .from('exercises')
    .insert({ name, muscle_group, category: category || 'Barbell' })
    .select().single();
  if (error) { if (error.code === '23505') return res.status(409).json({ error: 'Exercise already exists' }); throw error; }
  res.status(201).json(data);
});

router.put('/:id', authorize('superadmin', 'admin'), async (req, res) => {
  const { name, muscle_group, category } = req.body;
  const { data: existing, error: checkErr } = await supabase.from('exercises').select('*').eq('id', req.params.id).maybeSingle();
  if (checkErr) throw checkErr;
  if (!existing) return res.status(404).json({ error: 'Not found' });
  const updates = {};
  if (name !== undefined) updates.name = name;
  if (muscle_group !== undefined) updates.muscle_group = muscle_group;
  if (category !== undefined) updates.category = category;
  const { data, error } = await supabase.from('exercises').update(updates).eq('id', req.params.id).select().single();
  if (error) throw error;
  res.json(data);
});

router.delete('/:id', authorize('superadmin', 'admin'), async (req, res) => {
  const { data, error } = await supabase.from('exercises').delete().eq('id', req.params.id).select();
  if (error) throw error;
  if (!data || data.length === 0) return res.status(404).json({ error: 'Exercise not found' });
  res.json({ message: 'Deleted' });
});

module.exports = router;

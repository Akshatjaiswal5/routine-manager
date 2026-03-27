import { supabase } from './supabase'
import { format, addDays } from 'date-fns'

const today = () => format(new Date(), 'yyyy-MM-dd')

// ─── Modules ────────────────────────────────────────────────────────────────

export async function getModules() {
  const { data, error } = await supabase
    .from('modules')
    .select('*')
    .order('sort_order')
  if (error) throw error
  return data
}

export async function createModule(module) {
  const { data, error } = await supabase
    .from('modules')
    .insert(module)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateModule(id, updates) {
  const { data, error } = await supabase
    .from('modules')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteModule(id) {
  const { error } = await supabase.from('modules').delete().eq('id', id)
  if (error) throw error
}

// ─── Tasks ───────────────────────────────────────────────────────────────────

export async function getTasks(moduleId) {
  let query = supabase.from('tasks').select('*, modules(name, color, icon)').order('sort_order')
  if (moduleId) query = query.eq('module_id', moduleId)
  const { data, error } = await query
  if (error) throw error
  return data
}

export async function createTask(task) {
  const { data, error } = await supabase
    .from('tasks')
    .insert(task)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateTask(id, updates) {
  const { data, error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteTask(id) {
  const { error } = await supabase.from('tasks').delete().eq('id', id)
  if (error) throw error
}

// ─── Logs ────────────────────────────────────────────────────────────────────

export async function getLogsForDate(date) {
  const { data, error } = await supabase
    .from('task_logs')
    .select('*')
    .eq('date', date)
  if (error) throw error
  return data
}

export async function getLogsForRange(from, to) {
  const { data, error } = await supabase
    .from('task_logs')
    .select('*')
    .gte('date', from)
    .lte('date', to)
    .order('date', { ascending: false })
  if (error) throw error
  return data
}

export async function upsertLog(taskId, date, status, note = null) {
  const { data, error } = await supabase
    .from('task_logs')
    .upsert(
      { task_id: taskId, date, status, note },
      { onConflict: 'task_id,date' }
    )
    .select()
    .single()
  if (error) throw error
  return data
}

export async function postponeTask(taskId, newDueDate) {
  // Update next_due_date on the task
  const { data, error } = await supabase
    .from('tasks')
    .update({ next_due_date: newDueDate })
    .eq('id', taskId)
    .select()
    .single()
  if (error) throw error
  // Log as postponed for today
  await upsertLog(taskId, today(), 'postponed')
  return data
}

export async function completeScheduledTask(taskId, intervalDays) {
  const nextDue = format(addDays(new Date(), intervalDays), 'yyyy-MM-dd')
  await supabase.from('tasks').update({ next_due_date: nextDue }).eq('id', taskId)
  await upsertLog(taskId, today(), 'done')
}

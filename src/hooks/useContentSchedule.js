// ═══════════════════════════════════════════════════
// useContentSchedule — Plano semanal + status de tarefas
// Fonte de verdade: Supabase (tabela content_plans)
// ═══════════════════════════════════════════════════

import { useState, useCallback, useEffect } from 'react';
import { generateWeeklyPlan } from '../services/contentPlanner.js';
import { supabase } from '../lib/supabase.js';

// ─── Chave da semana ISO (ex: "2026-W15") ───
function getISOWeek(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  yearStart.setHours(0, 0, 0, 0);
  const weekNum = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  return `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}

// ─── Task ID: "2026-04-07-0" (data + índice) ───
export function makeTaskId(date, index) {
  return `${date}-${index}`;
}

export function useContentSchedule() {
  // Chave calculada UMA vez no mount — nunca muda durante a sessão
  const [currentWeekKey] = useState(() => getISOWeek(new Date()));

  const [weekPlan, setWeekPlan] = useState(null);
  const [taskStatuses, setTaskStatuses] = useState({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingFromDB, setIsLoadingFromDB] = useState(true);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().slice(0, 10)
  );

  // ─── Carrega plano do Supabase no mount ───
  useEffect(() => {
    async function load() {
      setIsLoadingFromDB(true);
      const { data, error } = await supabase
        .from('content_plans')
        .select('*')
        .eq('week_key', currentWeekKey)
        .maybeSingle();

      if (error) {
        console.error('Erro ao carregar plano semanal:', error);
      } else if (data) {
        setWeekPlan(data.plan_data);
        setTaskStatuses(data.task_statuses || {});
      }
      setIsLoadingFromDB(false);
    }
    load();
  }, [currentWeekKey]);

  // ─── Gera novo plano via API e salva no Supabase ───
  const generatePlan = useCallback(async () => {
    setIsGenerating(true);
    try {
      const plan = await generateWeeklyPlan();
      setWeekPlan(plan);
      setTaskStatuses({});

      const { error } = await supabase.from('content_plans').upsert({
        week_key: currentWeekKey,
        plan_data: plan,
        task_statuses: {},
        updated_at: new Date().toISOString(),
      });
      if (error) console.error('Erro ao salvar plano no Supabase:', error);
    } catch (err) {
      console.error('Erro ao gerar plano semanal:', err);
    } finally {
      setIsGenerating(false);
    }
  }, [currentWeekKey]);

  // ─── Regenera o plano (apaga o atual e gera novo) ───
  const regeneratePlan = useCallback(async () => {
    setWeekPlan(null);
    setTaskStatuses({});
    await supabase.from('content_plans').delete().eq('week_key', currentWeekKey);
    generatePlan();
  }, [currentWeekKey, generatePlan]);

  // ─── Toggle status de uma tarefa (done ↔ pending) ───
  const toggleTaskDone = useCallback((taskId) => {
    setTaskStatuses(prev => {
      const next = {
        ...prev,
        [taskId]: prev[taskId] === 'done' ? 'pending' : 'done',
      };
      // Salva em background no Supabase
      supabase.from('content_plans')
        .update({ task_statuses: next, updated_at: new Date().toISOString() })
        .eq('week_key', currentWeekKey)
        .then(({ error }) => { if (error) console.error('Erro ao salvar status:', error); });
      return next;
    });
  }, [currentWeekKey]);

  // ─── Retorna tarefas de uma data específica ───
  const getTasksForDate = useCallback((date) => {
    if (!weekPlan?.dias) return [];
    return weekPlan.dias.find(d => d.data === date)?.tarefas || [];
  }, [weekPlan]);

  // ─── Progresso da semana inteira ───
  const getWeekProgress = useCallback(() => {
    if (!weekPlan?.dias) return { done: 0, total: 0 };
    let total = 0;
    let done = 0;
    weekPlan.dias.forEach(day => {
      (day.tarefas || []).forEach((_, i) => {
        total++;
        if (taskStatuses[makeTaskId(day.data, i)] === 'done') done++;
      });
    });
    return { done, total };
  }, [weekPlan, taskStatuses]);

  // ─── Progresso do dia selecionado ───
  const getDayProgress = useCallback((date) => {
    const tasks = getTasksForDate(date);
    const done = tasks.filter((_, i) => taskStatuses[makeTaskId(date, i)] === 'done').length;
    return { done, total: tasks.length };
  }, [getTasksForDate, taskStatuses]);

  return {
    weekPlan,
    taskStatuses,
    isGenerating,
    isLoadingFromDB,
    selectedDate,
    setSelectedDate,
    generatePlan,
    regeneratePlan,
    toggleTaskDone,
    getTasksForDate,
    getWeekProgress,
    getDayProgress,
  };
}

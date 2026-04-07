// ═══════════════════════════════════════════════════
// useContentSchedule — Plano semanal + status de tarefas
// ═══════════════════════════════════════════════════

import { useState, useCallback, useEffect } from 'react';
import { generateWeeklyPlan } from '../services/contentPlanner.js';

// ─── Chave do localStorage baseada no número da semana ISO ───
function getISOWeek(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  return `${d.getFullYear()}-W${String(Math.ceil(((d - yearStart) / 86400000 + 1) / 7)).padStart(2, '0')}`;
}

const weekKey = () => `atlas-week-plan-${getISOWeek(new Date())}`;
const statusKey = () => `atlas-task-status-${getISOWeek(new Date())}`;

// ─── Task ID: "2026-04-07-0" (data + índice) ───
export function makeTaskId(date, index) {
  return `${date}-${index}`;
}

export function useContentSchedule() {
  const [weekPlan, setWeekPlan] = useState(null);
  const [taskStatuses, setTaskStatuses] = useState({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [currentWeekKey, setCurrentWeekKey] = useState(() => weekKey());

  // ─── Carrega plano e status do localStorage; detecta virada de semana ───
  useEffect(() => {
    const savedPlan = localStorage.getItem(currentWeekKey);
    if (savedPlan) {
      try { setWeekPlan(JSON.parse(savedPlan)); } catch { /* ignora cache corrompido */ }
    }

    const savedStatuses = localStorage.getItem(statusKey());
    if (savedStatuses) {
      try { setTaskStatuses(JSON.parse(savedStatuses)); } catch {}
    }

    // Detecta virada de semana quando o usuário volta à aba
    const handleVisibilityChange = () => {
      const latest = weekKey();
      if (latest !== currentWeekKey) {
        setWeekPlan(null);
        setTaskStatuses({});
        setCurrentWeekKey(latest);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [currentWeekKey]);

  // ─── Gera novo plano via API ───
  const generatePlan = useCallback(async () => {
    setIsGenerating(true);
    try {
      const plan = await generateWeeklyPlan();
      setWeekPlan(plan);
      localStorage.setItem(weekKey(), JSON.stringify(plan));
    } catch (err) {
      console.error('Erro ao gerar plano semanal:', err);
    } finally {
      setIsGenerating(false);
    }
  }, []);

  // ─── Regenera o plano (descarta o cache atual) ───
  const regeneratePlan = useCallback(() => {
    localStorage.removeItem(weekKey());
    setWeekPlan(null);
    setTaskStatuses({});
    localStorage.removeItem(statusKey());
    generatePlan();
  }, [generatePlan]);

  // ─── Toggle status de uma tarefa (done ↔ pending) ───
  const toggleTaskDone = useCallback((taskId) => {
    setTaskStatuses(prev => {
      const next = {
        ...prev,
        [taskId]: prev[taskId] === 'done' ? 'pending' : 'done',
      };
      localStorage.setItem(statusKey(), JSON.stringify(next));
      return next;
    });
  }, []);

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
      day.tarefas?.forEach((_, i) => {
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

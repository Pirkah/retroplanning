import React, { useState } from 'react';
import { usePlanning } from '../context/PlanningContext';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isToday,
  addMonths,
  subMonths,
  parseISO,
  isWithinInterval,
  isSameDay
} from 'date-fns';
import { fr } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus, Sparkles } from 'lucide-react';
import { Task } from '../types/planning';

export const CalendarView: React.FC = () => {
  const { currentProject, openEditTaskModal, openNewTaskModal, searchQuery, selectedColor } = usePlanning();
  const [currentMonthDate, setCurrentMonthDate] = useState(new Date());

  const monthStart = startOfMonth(currentMonthDate);
  const monthEnd = endOfMonth(currentMonthDate);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  const nextMonth = () => setCurrentMonthDate(addMonths(currentMonthDate, 1));
  const prevMonth = () => setCurrentMonthDate(subMonths(currentMonthDate, 1));
  const resetToToday = () => setCurrentMonthDate(new Date());

  // Filtrage
  const filteredTasks = currentProject.tasks.filter((task) => {
    const matchSearch =
      searchQuery === '' ||
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.category?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchColor = !selectedColor || task.color.toLowerCase() === selectedColor.toLowerCase();
    return matchSearch && matchColor;
  });

  // Tâches actives pour chaque jour
  const getTasksForDay = (day: Date): Task[] => {
    return filteredTasks.filter((task) => {
      try {
        const s = parseISO(task.startDate);
        const e = parseISO(task.endDate || task.startDate);
        return isWithinInterval(day, { start: s, end: e }) || isSameDay(day, s) || isSameDay(day, e);
      } catch {
        return false;
      }
    });
  };

  const weekDayNames = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  return (
    <div className="flex-1 flex flex-col bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
      {/* Barre d'outils de navigation du mois */}
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-slate-800 capitalize">
            {format(currentMonthDate, 'MMMM yyyy', { locale: fr })}
          </h2>
          <button
            onClick={resetToToday}
            className="text-xs font-semibold px-2.5 py-1 bg-white border border-slate-200 hover:border-indigo-400 hover:text-indigo-600 rounded-lg text-slate-600 transition shadow-xs"
          >
            Aujourd'hui
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={prevMonth}
            className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg transition"
            title="Mois précédent"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={nextMonth}
            className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg transition"
            title="Mois suivant"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Grille des noms des jours */}
      <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
        {weekDayNames.map((name, i) => (
          <div key={name} className={i >= 5 ? 'text-slate-400' : ''}>
            {name}
          </div>
        ))}
      </div>

      {/* Grille des cases du calendrier */}
      <div className="flex-1 grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-100 overflow-y-auto">
        {calendarDays.map((day) => {
          const dayTasks = getTasksForDay(day);
          const isCurrentMonth = isSameMonth(day, currentMonthDate);
          const dayIsToday = isToday(day);
          const dateString = format(day, 'yyyy-MM-dd');

          return (
            <div
              key={day.toISOString()}
              className={`min-h-[110px] p-2 flex flex-col group relative transition-colors ${
                !isCurrentMonth
                  ? 'bg-slate-50/40 text-slate-400'
                  : 'bg-white hover:bg-slate-50/50 text-slate-700'
              }`}
            >
              {/* En-tête du jour */}
              <div className="flex items-center justify-between mb-1.5">
                <span
                  className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${
                    dayIsToday
                      ? 'bg-rose-500 text-white shadow-xs'
                      : !isCurrentMonth
                      ? 'text-slate-400'
                      : 'text-slate-700'
                  }`}
                >
                  {format(day, 'd')}
                </span>

                <button
                  onClick={() => openNewTaskModal(dateString)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-indigo-50 text-indigo-600 rounded transition"
                  title="Ajouter une tâche à cette date"
                >
                  <Plus size={14} />
                </button>
              </div>

              {/* Badges de tâches du jour */}
              <div className="flex-1 space-y-1 overflow-y-auto max-h-[85px] custom-scrollbar">
                {dayTasks.slice(0, 3).map((task) => (
                  <div
                    key={task.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditTaskModal(task);
                    }}
                    style={{
                      backgroundColor: `${task.color}18`,
                      borderLeft: `3px solid ${task.color}`,
                    }}
                    className="px-1.5 py-0.5 rounded text-[11px] font-medium text-slate-800 truncate cursor-pointer hover:brightness-95 transition flex items-center gap-1 shadow-xs"
                    title={`${task.title} (${task.startDate} → ${task.endDate})`}
                  >
                    {task.isMilestone && <Sparkles size={11} className="text-amber-600 flex-shrink-0" />}
                    <span className="truncate">{task.title}</span>
                  </div>
                ))}

                {dayTasks.length > 3 && (
                  <span className="block text-[10px] font-semibold text-slate-400 pl-1">
                    +{dayTasks.length - 3} autre(s)...
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

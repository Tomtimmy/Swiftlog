import React, { useState } from 'react';
import { useTasks } from '../hooks/useTasks';
import { PriorityBadge } from '../components/Badges';
import { CheckCircle2, Circle, Clock, User, AlertCircle, Save } from 'lucide-react';
import Modal from '../components/Modal';
import { Task, TaskPriority, TaskStatus } from '../types';

export default function Tasks() {
  const { tasks, loading, moveTask, addPersonalTask, isOffline } = useTasks();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showPersonalOnly, setShowPersonalOnly] = useState(false);
  const [newPersonalTitle, setNewPersonalTitle] = useState('');

  const filteredTasks = showPersonalOnly ? tasks.filter(t => t.isPersonal) : tasks;

  const columns = [
    { id: 'TODO', label: 'To Do', icon: Circle, color: 'text-gray-400' },
    { id: 'IN_PROGRESS', label: 'In Progress', icon: Clock, color: 'text-blue-500' },
    { id: 'COMPLETED', label: 'Completed', icon: CheckCircle2, color: 'text-emerald-500' },
  ];

  const handleAddPersonal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPersonalTitle.trim()) return;
    addPersonalTask(newPersonalTitle);
    setNewPersonalTitle('');
  };

  if (loading) {
    return <div className="p-12 text-center text-gray-500">Loading operational tasks...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Task Management</h1>
            {isOffline && (
              <span className="flex items-center gap-1 text-[10px] font-bold bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full border border-orange-100 uppercase tracking-widest animate-pulse">
                <AlertCircle className="w-3 h-3" />
                Offline Mode
              </span>
            )}
          </div>
          <p className="text-gray-500 text-sm">Daily operations and personal productivity planner</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowPersonalOnly(!showPersonalOnly)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${showPersonalOnly ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 border border-gray-200'}`}
          >
            {showPersonalOnly ? 'All Tasks' : 'Personal Planner'}
          </button>
        </div>
      </div>

      {showPersonalOnly && (
        <div className="technical-card p-4 bg-indigo-50 border-indigo-100">
          <form onSubmit={handleAddPersonal} className="flex gap-2">
            <input 
              type="text" 
              placeholder="Quick add to personal planner..." 
              className="flex-1 px-4 py-2 bg-white border border-indigo-200 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              value={newPersonalTitle}
              onChange={(e) => setNewPersonalTitle(e.target.value)}
            />
            <button type="submit" className="px-6 py-2 bg-indigo-600 text-white text-sm font-bold rounded-md hover:bg-indigo-700">
              Add Item
            </button>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 min-h-[500px]">
        {columns.map((column) => (
          <div key={column.id} className="flex flex-col bg-gray-50/50 rounded-xl border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-4 px-1">
              <div className="flex items-center gap-2">
                <column.icon className={`w-4 h-4 ${column.color}`} />
                <h2 className="font-bold text-gray-700 uppercase tracking-wider text-[10px]">{column.label}</h2>
                <span className="bg-white text-gray-400 text-[10px] px-1.5 py-0.5 rounded-md border border-gray-100 font-mono">
                  {filteredTasks.filter(t => t.status === column.id).length}
                </span>
              </div>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto pr-1">
              {filteredTasks.filter(t => t.status === column.id).map(task => (
                <div 
                  key={task.id}
                  onClick={() => setSelectedTask(task)}
                  className={`bg-white p-4 rounded-lg shadow-sm border transition-all cursor-pointer group relative ${task.isPersonal ? 'border-indigo-100 bg-indigo-50/10' : 'border-gray-100'}`}
                >
                  {task.isSyncing && (
                    <div className="absolute top-2 right-2">
                       <Clock className="w-3 h-3 text-orange-400 animate-spin" />
                    </div>
                  )}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <PriorityBadge priority={task.priority} />
                      {task.isPersonal && <span className="text-[9px] font-bold text-indigo-600 uppercase tracking-widest bg-indigo-100 px-1.5 py-0.5 rounded">Personal</span>}
                    </div>
                  </div>
                  <h3 className="font-bold text-gray-900 text-sm mb-1">{task.title}</h3>
                  <p className="text-[11px] text-gray-500 mb-4 line-clamp-2 leading-relaxed">{task.description}</p>
                  
                  <div className="flex items-center justify-between border-t border-gray-50 pt-3 mt-3">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-[8px] font-bold text-gray-400 border border-gray-200">
                        {task.isPersonal ? 'ME' : (task.assignedUserId ? 'U' : '?')}
                      </div>
                      <span className="text-[10px] text-gray-400 font-medium">
                        {task.isPersonal ? 'Private' : (task.assignedUserId || 'Unassigned')}
                      </span>
                    </div>
                    {column.id !== 'COMPLETED' && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          moveTask(task.id, column.id === 'TODO' ? 'IN_PROGRESS' : 'COMPLETED');
                        }}
                        className="text-[10px] font-extrabold text-blue-600 hover:text-blue-700 bg-blue-50 px-2 py-1 rounded"
                      >
                        {column.id === 'TODO' ? 'START' : 'DONE'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <Modal 
        isOpen={!!selectedTask} 
        onClose={() => setSelectedTask(null)} 
        title={selectedTask?.title || 'Task Details'}
      >
        {selectedTask && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <PriorityBadge priority={selectedTask.priority} />
              <span className="text-xs text-gray-400">Created: {new Date(selectedTask.createdAt).toLocaleDateString()}</span>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-1 block">Description</label>
                <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 p-4 rounded-lg">
                  {selectedTask.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-1 block">Assigned User</label>
                  <div className="flex items-center gap-2 p-2 border border-gray-100 rounded-md">
                    <User className="w-4 h-4 text-gray-300" />
                    <span className="text-sm">{selectedTask.assignedUserId || 'Not assigned'}</span>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-1 block">Due Date</label>
                  <div className="flex items-center gap-2 p-2 border border-gray-100 rounded-md">
                    <Clock className="w-4 h-4 text-gray-300" />
                    <span className="text-sm">{selectedTask.dueDate ? new Date(selectedTask.dueDate).toLocaleDateString() : 'No deadline'}</span>
                  </div>
                </div>
              </div>

              <div className="pt-6 flex gap-3">
                <button 
                  className="flex-1 py-2.5 bg-gray-50 text-gray-600 text-sm font-bold rounded-lg hover:bg-gray-100 transition-colors"
                  onClick={() => setSelectedTask(null)}
                >
                  Close
                </button>
                <button className="flex-1 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-md shadow-blue-100">
                  <Save className="w-4 h-4" />
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

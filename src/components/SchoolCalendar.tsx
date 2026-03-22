import React, { useState, useEffect } from 'react';
import { SchoolEvent, UserProfile } from '../types';
import { db } from '../firebase';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, orderBy } from 'firebase/firestore';
import { Card, Button, Badge } from './UI';
import { Calendar as CalendarIcon, Plus, Trash2, MapPin, Clock, Tag } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format, isAfter, startOfDay, parseISO } from 'date-fns';

export const SchoolCalendar = ({ profile }: { profile: UserProfile }) => {
  const [events, setEvents] = useState<SchoolEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    type: 'event' as SchoolEvent['type'],
    description: ''
  });

  const fetchEvents = async () => {
    try {
      const q = query(collection(db, 'school_events'), orderBy('date', 'asc'));
      const snap = await getDocs(q);
      let data = snap.docs.map(d => ({ id: d.id, ...d.data() } as SchoolEvent));
      
      // If no events, add some defaults for demo
      if (data.length === 0) {
        const defaults: Omit<SchoolEvent, 'id'>[] = [
          { title: 'Easter Break', date: '2026-04-03', type: 'holiday', uid: 'system', description: 'School closed for 2 weeks' },
          { title: 'GCSE Maths Paper 1', date: '2026-05-15', type: 'exam', uid: 'system', description: 'Non-calculator paper' },
          { title: 'Summer Term Begins', date: '2026-04-20', type: 'event', uid: 'system' },
          { title: 'May Half Term', date: '2026-05-25', type: 'holiday', uid: 'system' }
        ];
        
        // We don't necessarily want to save them to DB every time, 
        // but for the demo it's nice to see them.
        data = defaults.map((d, i) => ({ ...d, id: `default-${i}` } as SchoolEvent));
      }

      // Filter out past events
      const today = startOfDay(new Date());
      const upcoming = data.filter(e => !isAfter(today, parseISO(e.date)));
      
      setEvents(upcoming);
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.title || !newEvent.date) return;

    try {
      const eventData: Omit<SchoolEvent, 'id'> = {
        ...newEvent,
        uid: profile.uid
      };
      await addDoc(collection(db, 'school_events'), eventData);
      setNewEvent({
        title: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        type: 'event',
        description: ''
      });
      setShowAddForm(false);
      fetchEvents();
    } catch (error) {
      console.error("Error adding event:", error);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'school_events', id));
      fetchEvents();
    } catch (error) {
      console.error("Error deleting event:", error);
    }
  };

  const getTypeColor = (type: SchoolEvent['type']) => {
    switch (type) {
      case 'holiday': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'exam': return 'bg-red-100 text-red-700 border-red-200';
      case 'deadline': return 'bg-amber-100 text-amber-700 border-amber-200';
      default: return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  return (
    <Card className="p-8 border-2 border-black/5 rounded-[2.5rem] shadow-xl shadow-black/5">
      <div className="flex items-center justify-between mb-8">
        <div className="space-y-1">
          <h3 className="font-black text-2xl flex items-center gap-3">
            <CalendarIcon className="w-6 h-6 text-indigo-600" />
            School Calendar
          </h3>
          <p className="text-stone-400 text-sm font-medium">Upcoming holidays, exams, and events</p>
        </div>
        {profile.role === 'parent' && (
          <Button 
            onClick={() => setShowAddForm(!showAddForm)}
            className="rounded-xl bg-black text-white hover:bg-stone-800"
          >
            {showAddForm ? 'Cancel' : <><Plus className="w-4 h-4 mr-2" /> Add Event</>}
          </Button>
        )}
      </div>

      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-8"
          >
            <form onSubmit={handleAddEvent} className="p-6 bg-stone-50 rounded-3xl border-2 border-stone-100 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-stone-400">Event Title</label>
                  <input 
                    type="text" 
                    value={newEvent.title}
                    onChange={e => setNewEvent({...newEvent, title: e.target.value})}
                    placeholder="e.g. Easter Break"
                    className="w-full px-4 py-3 rounded-xl border-2 border-stone-200 focus:border-black outline-none transition-colors font-bold"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-stone-400">Date</label>
                  <input 
                    type="date" 
                    value={newEvent.date}
                    onChange={e => setNewEvent({...newEvent, date: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border-2 border-stone-200 focus:border-black outline-none transition-colors font-bold"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-stone-400">Type</label>
                  <select 
                    value={newEvent.type}
                    onChange={e => setNewEvent({...newEvent, type: e.target.value as SchoolEvent['type']})}
                    className="w-full px-4 py-3 rounded-xl border-2 border-stone-200 focus:border-black outline-none transition-colors font-bold"
                  >
                    <option value="event">Event</option>
                    <option value="holiday">Holiday</option>
                    <option value="exam">Exam</option>
                    <option value="deadline">Deadline</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-stone-400">Description (Optional)</label>
                  <input 
                    type="text" 
                    value={newEvent.description}
                    onChange={e => setNewEvent({...newEvent, description: e.target.value})}
                    placeholder="e.g. No school for 2 weeks"
                    className="w-full px-4 py-3 rounded-xl border-2 border-stone-200 focus:border-black outline-none transition-colors font-bold"
                  />
                </div>
              </div>
              <Button type="submit" className="w-full bg-indigo-600 text-white hover:bg-indigo-700 py-6 rounded-2xl font-black text-lg">
                Save Event
              </Button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-4">
        {loading ? (
          <div className="py-12 text-center">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-stone-400 font-bold">Syncing calendar...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="py-12 text-center space-y-4 bg-stone-50 rounded-[2rem] border-2 border-dashed border-stone-200">
            <CalendarIcon className="w-12 h-12 text-stone-200 mx-auto" />
            <p className="text-stone-400 font-bold italic">No upcoming events scheduled.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {events.map((event, i) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="group relative p-6 bg-stone-50 rounded-[2rem] border-2 border-transparent hover:border-indigo-100 transition-all"
              >
                <div className="flex justify-between items-start mb-4">
                  <Badge className={`${getTypeColor(event.type)} border-none font-black text-[10px] uppercase tracking-widest px-3 py-1 rounded-lg`}>
                    {event.type}
                  </Badge>
                  {profile.role === 'parent' && (
                    <button 
                      onClick={() => handleDeleteEvent(event.id)}
                      className="text-stone-300 hover:text-red-500 transition-colors p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="space-y-3">
                  <h4 className="font-black text-lg text-black group-hover:text-indigo-600 transition-colors">{event.title}</h4>
                  <div className="flex items-center gap-4 text-stone-400 text-xs font-bold">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {format(parseISO(event.date), 'MMM d, yyyy')}
                    </div>
                    {event.description && (
                      <div className="flex items-center gap-1 truncate max-w-[150px]">
                        <Tag className="w-3 h-3" />
                        {event.description}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};

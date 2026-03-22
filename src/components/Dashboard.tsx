import React, { useState, useEffect } from 'react';
import { UserProfile, AssessmentResult } from '../types';
import { Card, Button, Badge } from './UI';
import { Trophy, Flame, Star, TrendingUp, ArrowRight, Brain, Target, MessageCircle, Zap, Sparkles, Calendar } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { AIHelper } from './AIHelper';
import { AcademicReportView } from './AcademicReportView';
import { SchoolCalendar } from './SchoolCalendar';
import { motion } from 'motion/react';
import { db } from '../firebase';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';

export const Dashboard = ({ profile, onStartLearning }: { profile: UserProfile, onStartLearning: () => void }) => {
  const [assessments, setAssessments] = useState<AssessmentResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAssessments = async () => {
      try {
        const q = query(
          collection(db, 'assessments'),
          where('uid', '==', profile.uid),
          orderBy('date', 'desc'),
          limit(7)
        );
        const snap = await getDocs(q);
        const data = snap.docs.map(d => d.data() as AssessmentResult).reverse();
        setAssessments(data);
      } catch (error) {
        console.error("Error fetching assessments:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAssessments();
  }, [profile.uid]);

  const chartData = assessments.length > 0 
    ? assessments.map(a => ({ day: a.date.split('-').slice(1).join('/'), score: a.accuracy }))
    : [
        { day: 'No Data', score: 0 }
      ];

  return (
    <div className="space-y-10 pb-20">
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-end justify-between gap-6"
      >
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Badge className="bg-emerald-100 text-emerald-700 border-none px-3 py-1 text-xs font-bold uppercase tracking-widest">
              Level {profile.level}
            </Badge>
            <div className="flex items-center gap-1 text-orange-500 font-bold text-sm">
              <Flame className="w-4 h-4 fill-current" />
              {profile.streak} Day Streak
            </div>
          </div>
          <h1 className="text-5xl font-black text-black tracking-tight">
            Yo, {profile.displayName.split(' ')[0]}! 👋
          </h1>
          <p className="text-stone-500 text-lg font-medium">
            Ready to crush your <span className="text-black font-bold">Year {profile.yearGroup}</span> goals at {profile.schoolName}?
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onStartLearning}
          className="bg-black text-white px-8 py-4 rounded-2xl font-bold text-lg flex items-center gap-3 shadow-2xl shadow-black/20 hover:bg-emerald-600 transition-colors"
        >
          Start Daily Mission <ArrowRight className="w-6 h-6" />
        </motion.button>
      </motion.header>

      {/* Stats Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          icon={<Flame className="text-orange-500" />} 
          label="Current Streak" 
          value={profile.streak} 
          suffix="days"
          color="bg-orange-50"
          delay={0.1}
        />
        <StatCard 
          icon={<Star className="text-yellow-500" />} 
          label="Total XP" 
          value={profile.xp} 
          suffix="XP"
          color="bg-yellow-50"
          delay={0.2}
        />
        <StatCard 
          icon={<Zap className="text-blue-500" />} 
          label="Global Rank" 
          value={124} 
          suffix="th"
          color="bg-blue-50"
          delay={0.3}
        />
      </div>

      {profile.academicReport && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <AcademicReportView profile={profile} />
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Progress Chart */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2"
        >
          <Card className="h-full p-8 border-2 border-black/5 rounded-[2.5rem]">
            <div className="flex items-center justify-between mb-8">
              <div className="space-y-1">
                <h3 className="font-black text-2xl flex items-center gap-2">
                  <TrendingUp className="w-6 h-6 text-emerald-600" />
                  Your Growth
                </h3>
                <p className="text-stone-400 text-sm font-medium">Performance over the last 7 days</p>
              </div>
              <Badge className="bg-stone-100 text-stone-600 border-none">Weekly Stats</Badge>
            </div>
            <div className="h-72 w-full">
              {loading ? (
                <div className="h-full flex items-center justify-center">
                  <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : assessments.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#888', fontSize: 12, fontWeight: 600}} />
                    <YAxis hide domain={[0, 100]} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', fontWeight: 600 }}
                    />
                    <Area type="monotone" dataKey="score" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorScore)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-stone-300 space-y-4">
                  <Calendar className="w-12 h-12 opacity-20" />
                  <p className="font-bold italic">Complete your first assessment to see growth!</p>
                </div>
              )}
            </div>
          </Card>
        </motion.div>

        {/* Focus Areas */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="h-full p-8 border-2 border-black/5 rounded-[2.5rem] space-y-8">
            <div className="space-y-1">
              <h3 className="font-black text-2xl flex items-center gap-2">
                <Target className="w-6 h-6 text-red-500" />
                Focus Areas
              </h3>
              <p className="text-stone-400 text-sm font-medium">What to crush next</p>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-3">
                <p className="text-xs font-black text-stone-400 uppercase tracking-widest">Needs Attention</p>
                <div className="flex flex-wrap gap-2">
                  {profile.weakTopics.length > 0 ? profile.weakTopics.map(topic => (
                    <Badge key={topic} className="bg-red-50 text-red-600 border-2 border-red-100 rounded-xl px-3 py-1.5 font-bold text-xs">{topic}</Badge>
                  )) : (
                    <p className="text-sm text-stone-400 italic">No weak subjects identified yet!</p>
                  )}
                </div>
              </div>
              
              <div className="pt-6 border-t-2 border-stone-50 space-y-3">
                <p className="text-xs font-black text-stone-400 uppercase tracking-widest">Mastered</p>
                <div className="flex flex-wrap gap-2">
                  {profile.strongTopics.length > 0 ? profile.strongTopics.map(topic => (
                    <Badge key={topic} className="bg-emerald-50 text-emerald-600 border-2 border-emerald-100 rounded-xl px-3 py-1.5 font-bold text-xs">{topic}</Badge>
                  )) : (
                    <p className="text-sm text-stone-400 italic">Keep going to master subjects!</p>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55 }}
      >
        <SchoolCalendar profile={profile} />
      </motion.div>

      {/* AI Buddy Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="lg:col-span-2"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-emerald-100 rounded-xl">
              <MessageCircle className="w-6 h-6 text-emerald-600" />
            </div>
            <h3 className="font-black text-2xl">Academic Buddy</h3>
          </div>
          <Card className="p-0 overflow-hidden border-2 border-black/5 rounded-[2.5rem]">
            <AIHelper profile={profile} />
          </Card>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="space-y-6"
        >
          <Card className="bg-gradient-to-br from-indigo-600 to-blue-700 text-white border-none p-8 rounded-[2.5rem] relative overflow-hidden group">
            <Sparkles className="absolute top-4 right-4 w-8 h-8 text-white/20 group-hover:rotate-12 transition-transform" />
            <h4 className="font-black text-xl mb-4">Pro Tip</h4>
            <p className="text-indigo-100 font-medium leading-relaxed">
              "The Feynman Technique: To learn something well, try to explain it to a 5-year-old. It highlights gaps in your understanding."
            </p>
          </Card>
          
          <Card className="bg-black text-white border-none p-8 rounded-[2.5rem]">
            <h4 className="font-black text-xl mb-6 flex items-center gap-2">
              <Trophy className="w-6 h-6 text-yellow-400" />
              Next Goals
            </h4>
            <ul className="space-y-4">
              <GoalItem label="Complete 5-day streak" completed={false} />
              <GoalItem label="Master 3 new topics" completed={false} />
              <GoalItem label="Score 90% in Physics" completed={false} />
            </ul>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value, suffix, color, delay }: { icon: React.ReactNode, label: string, value: number, suffix: string, color: string, delay: number }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay }}
  >
    <Card className="flex items-center gap-5 p-6 border-2 border-black/5 rounded-[2rem] hover:border-emerald-500/20 transition-colors group">
      <div className={`p-4 rounded-2xl ${color} group-hover:scale-110 transition-transform`}>
        {React.cloneElement(icon as React.ReactElement<any>, { className: "w-8 h-8" })}
      </div>
      <div>
        <p className="text-sm text-stone-400 font-bold uppercase tracking-widest">{label}</p>
        <p className="text-3xl font-black text-black">{value}<span className="text-lg font-bold text-stone-300 ml-1">{suffix}</span></p>
      </div>
    </Card>
  </motion.div>
);

const GoalItem = ({ label, completed }: { label: string, completed: boolean }) => (
  <li className="flex items-center gap-3 group cursor-pointer">
    <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors ${completed ? 'bg-emerald-500 border-emerald-500' : 'border-stone-700 group-hover:border-emerald-500'}`}>
      {completed && <ArrowRight className="w-4 h-4 text-white" />}
    </div>
    <span className={`font-bold ${completed ? 'text-stone-500 line-through' : 'text-stone-300 group-hover:text-white transition-colors'}`}>{label}</span>
  </li>
);

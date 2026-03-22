import React, { useState, useEffect } from 'react';
import { UserProfile, AssessmentResult } from '../types';
import { db } from '../firebase';
import { collection, query, where, getDocs, doc, getDoc, orderBy, limit } from 'firebase/firestore';
import { Card, Badge, Button } from './UI';
import { Users, TrendingUp, Target, Award, Calendar, ArrowRight, Brain, Sparkles, Zap, ChevronRight, Activity, Clock } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, Cell } from 'recharts';
import { motion } from 'motion/react';
import { format } from 'date-fns';
import { AcademicReportView } from './AcademicReportView';
import { SchoolCalendar } from './SchoolCalendar';

export const ParentDashboard = ({ profile }: { profile: UserProfile }) => {
  const [childrenData, setChildrenData] = useState<{ profile: UserProfile, assessments: AssessmentResult[] }[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState<{ [childId: string]: string }>({});

  useEffect(() => {
    const fetchChildrenData = async () => {
      if (!profile.children) return;

      const data = await Promise.all(profile.children.map(async (childId) => {
        const childDoc = await getDoc(doc(db, 'users', childId));
        if (!childDoc.exists()) return null;

        const assessmentsQuery = query(
          collection(db, 'assessments'),
          where('uid', '==', childId),
          orderBy('date', 'desc'),
          limit(7)
        );
        const assessmentsSnap = await getDocs(assessmentsQuery);
        const assessments = assessmentsSnap.docs.map(d => d.data() as AssessmentResult).reverse();

        return {
          profile: childDoc.data() as UserProfile,
          assessments
        };
      }));

      setChildrenData(data.filter((item): item is { profile: UserProfile, assessments: AssessmentResult[] } => item !== null));
      setLoading(false);
    };

    fetchChildrenData();
  }, [profile.children]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-6">
        <div className="relative">
          <div className="absolute inset-0 bg-emerald-500/20 blur-2xl rounded-full animate-pulse" />
          <Users className="w-16 h-16 text-emerald-600 animate-bounce relative z-10" />
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-2xl font-black text-black">Syncing Family Data...</h3>
          <p className="text-stone-500 font-medium">Getting the latest progress updates.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-20">
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        <div className="flex items-center gap-2 text-emerald-600 font-black text-xs uppercase tracking-widest">
          <Activity className="w-4 h-4 fill-current" />
          Parent Portal
        </div>
        <h1 className="text-5xl font-black text-black tracking-tight">Family Overview</h1>
        <p className="text-stone-500 text-lg font-medium">Monitoring academic growth for {profile.children?.length} students. 📈</p>
      </motion.header>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <SchoolCalendar profile={profile} />
      </motion.div>

      <div className="grid grid-cols-1 gap-16">
        {childrenData.length === 0 ? (
          <Card className="p-20 text-center border-4 border-dashed border-stone-100 rounded-[3rem]">
            <Users className="w-16 h-16 text-stone-200 mx-auto mb-6" />
            <h3 className="text-2xl font-black text-black mb-2">No Students Found</h3>
            <p className="text-stone-400 font-medium max-w-sm mx-auto">Student profiles will appear here once they've initialized their accounts.</p>
          </Card>
        ) : childrenData.map(({ profile: child, assessments }, index) => {
          const childSubjects = Array.from(new Set(assessments.flatMap(a => Object.keys(a.subjectPerformance || {}))));
          const currentSubject = selectedSubject[child.uid] || 'All';
          const filteredAssessments = currentSubject === 'All' 
            ? assessments 
            : assessments.filter(a => a.subjectPerformance && a.subjectPerformance[currentSubject]);

          return (
            <motion.section 
              key={child.uid}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.2 }}
              className="space-y-8"
            >
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b-2 border-stone-100 pb-8">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-[2rem] bg-black text-white flex items-center justify-center font-black text-3xl shadow-2xl shadow-black/20">
                  {child.displayName[0]}
                </div>
                <div className="space-y-1">
                  <h2 className="text-4xl font-black text-black tracking-tight">{child.displayName}</h2>
                  <p className="text-stone-400 font-bold uppercase tracking-widest text-xs">Year {child.yearGroup} • {child.schoolName}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge className="bg-emerald-100 text-emerald-700 border-none font-black text-xs px-4 py-2 rounded-xl">Level {child.level}</Badge>
                <Badge className="bg-yellow-100 text-yellow-700 border-none font-black text-xs px-4 py-2 rounded-xl">{child.xp} XP</Badge>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Progress Chart */}
              <Card className="lg:col-span-8 p-10 border-2 border-black/5 rounded-[3rem] shadow-2xl shadow-black/5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                  <div className="space-y-1">
                    <h3 className="font-black text-2xl flex items-center gap-3">
                      <TrendingUp className="w-6 h-6 text-emerald-600" />
                      Performance Analytics
                    </h3>
                    <p className="text-stone-400 text-sm font-medium">Accuracy trend across recent missions</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <select 
                      value={currentSubject}
                      onChange={(e) => setSelectedSubject(prev => ({ ...prev, [child.uid]: e.target.value }))}
                      className="bg-stone-100 text-stone-600 border-none font-black text-[10px] uppercase tracking-widest px-3 py-1 rounded-lg outline-none cursor-pointer hover:bg-stone-200 transition-colors"
                    >
                      <option value="All">All Subjects</option>
                      {childSubjects.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    <Badge className="bg-stone-100 text-stone-600 border-none font-black text-[10px] uppercase tracking-widest">7-Day History</Badge>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                  <div className="h-64 w-full">
                    <p className="text-xs font-black text-stone-400 uppercase tracking-widest mb-4">Accuracy Trend (%)</p>
                    {filteredAssessments.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={filteredAssessments.map(a => {
                          const accuracy = currentSubject === 'All' 
                            ? a.accuracy 
                            : (a.subjectPerformance![currentSubject].score / a.subjectPerformance![currentSubject].total) * 100;
                          return { date: a.date.split('-').slice(1).join('/'), score: accuracy };
                        })}>
                          <defs>
                            <linearGradient id={`colorScore-${child.uid}`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                          <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#888', fontSize: 10, fontWeight: 600}} />
                          <YAxis domain={[0, 100]} hide />
                          <Tooltip 
                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', fontWeight: 600 }}
                          />
                          <Area type="monotone" dataKey="score" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill={`url(#colorScore-${child.uid})`} />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-stone-300 space-y-4">
                        <Calendar className="w-12 h-12 opacity-20" />
                        <p className="font-bold italic">No data</p>
                      </div>
                    )}
                  </div>

                  <div className="h-64 w-full">
                    <p className="text-xs font-black text-stone-400 uppercase tracking-widest mb-4">Score Distribution (Correct/Total)</p>
                    {filteredAssessments.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={filteredAssessments.map(a => {
                          const score = currentSubject === 'All' 
                            ? a.score 
                            : a.subjectPerformance![currentSubject].score;
                          const total = currentSubject === 'All' 
                            ? a.totalQuestions 
                            : a.subjectPerformance![currentSubject].total;
                          const accuracy = (score / total) * 100;
                          return { date: a.date.split('-').slice(1).join('/'), score, total, accuracy };
                        })}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                          <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#888', fontSize: 10, fontWeight: 600}} />
                          <YAxis hide />
                          <Tooltip 
                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', fontWeight: 600 }}
                          />
                          <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                            {filteredAssessments.map((a, index) => {
                              const score = currentSubject === 'All' 
                                ? a.score 
                                : a.subjectPerformance![currentSubject].score;
                              const total = currentSubject === 'All' 
                                ? a.totalQuestions 
                                : a.subjectPerformance![currentSubject].total;
                              const accuracy = (score / total) * 100;
                              return <Cell key={`cell-${index}`} fill={accuracy > 80 ? '#10b981' : '#6366f1'} />;
                            })}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-stone-300 space-y-4">
                        <Award className="w-12 h-12 opacity-20" />
                        <p className="font-bold italic">No data</p>
                      </div>
                    )}
                  </div>
                </div>
              </Card>

              {/* Topics & Strengths */}
              <div className="lg:col-span-4 space-y-8">
                <Card className="p-8 border-2 border-black/5 rounded-[2.5rem] bg-emerald-50/30">
                  <h3 className="font-black text-xs uppercase tracking-widest text-emerald-600 mb-6 flex items-center gap-2">
                    <Brain className="w-4 h-4 fill-current" />
                    Top Strengths
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {child.strongTopics.length > 0 ? child.strongTopics.map(topic => (
                      <Badge key={topic} className="bg-white text-emerald-700 border-2 border-emerald-100 rounded-xl px-3 py-1.5 font-bold text-xs shadow-sm">{topic}</Badge>
                    )) : (
                      <p className="text-sm text-stone-400 italic font-medium">Identifying strengths...</p>
                    )}
                  </div>
                </Card>
                
                <Card className="p-8 border-2 border-black/5 rounded-[2.5rem] bg-red-50/30">
                  <h3 className="font-black text-xs uppercase tracking-widest text-red-600 mb-6 flex items-center gap-2">
                    <Target className="w-4 h-4 fill-current" />
                    Growth Areas
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {child.weakTopics.length > 0 ? child.weakTopics.map(topic => (
                      <Badge key={topic} className="bg-white text-red-700 border-2 border-red-100 rounded-xl px-3 py-1.5 font-bold text-xs shadow-sm">{topic}</Badge>
                    )) : (
                      <p className="text-sm text-stone-400 italic font-medium">Identifying growth areas...</p>
                    )}
                  </div>
                </Card>

                <Card className="p-8 border-2 border-black/5 rounded-[2.5rem] bg-black text-white relative overflow-hidden group">
                  <Sparkles className="absolute -right-2 -top-2 w-16 h-16 text-white/10 group-hover:rotate-12 transition-transform" />
                  <h3 className="font-black text-xs uppercase tracking-widest text-white/50 mb-4">AI Insight</h3>
                  <p className="text-sm font-bold leading-relaxed">
                    {child.displayName.split(' ')[0]} is showing rapid improvement in {child.strongTopics[0] || 'core subjects'}. Focus on {child.weakTopics[0] || 'new topics'} next week.
                  </p>
                </Card>
              </div>
            </div>

            {child.academicReport && (
              <div className="pt-8 border-t-2 border-stone-100">
                <AcademicReportView profile={child} />
              </div>
            )}

            {/* Detailed History Section */}
            <Card className="p-10 border-2 border-black/5 rounded-[3rem] shadow-sm">
              <div className="flex items-center justify-between mb-10">
                <h3 className="font-black text-2xl flex items-center gap-3">
                  <Clock className="w-6 h-6 text-indigo-600" />
                  Recent Assessment History
                </h3>
                <Badge className="bg-indigo-50 text-indigo-600 border-none font-black text-[10px] uppercase tracking-widest px-3 py-1">Full Log</Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {assessments.length > 0 ? assessments.map((a, i) => (
                  <motion.div 
                    key={a.id} 
                    whileHover={{ x: 5 }}
                    className="flex items-center justify-between p-6 bg-stone-50 rounded-[2rem] border-2 border-transparent hover:border-black/5 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center font-black text-stone-400 shadow-sm">
                        {assessments.length - i}
                      </div>
                      <div>
                        <p className="font-black text-black">{format(new Date(a.date), 'MMMM d, yyyy')}</p>
                        <p className="text-stone-400 text-[10px] font-black uppercase tracking-widest">{a.totalQuestions} Questions • {a.improvementTrend} Trend</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black text-black">{a.accuracy}%</p>
                      <Badge className={`border-none font-black text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-md ${a.accuracy >= 80 ? 'bg-emerald-100 text-emerald-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {a.score}/{a.totalQuestions}
                      </Badge>
                    </div>
                  </motion.div>
                )) : (
                  <div className="col-span-full py-12 text-center space-y-4">
                    <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto">
                      <Calendar className="w-8 h-8 text-stone-300" />
                    </div>
                    <p className="text-stone-400 font-bold italic">No history available yet.</p>
                  </div>
                )}
              </div>
            </Card>
          </motion.section>
        );
      })}
      </div>
    </div>
  );
};

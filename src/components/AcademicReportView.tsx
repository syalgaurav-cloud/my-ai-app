import React from 'react';
import { AcademicReport, UserProfile } from '../types';
import { Card, Badge } from './UI';
import { FileText, TrendingUp, Award, Calendar, Percent, BookOpen, Target } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell } from 'recharts';
import { motion } from 'motion/react';

export const AcademicReportView = ({ profile }: { profile: UserProfile }) => {
  const report = profile.academicReport;

  if (!report) return null;

  const isYear11 = profile.yearGroup === 11;

  const chartData = report.subjects.map(s => ({
    name: s.name,
    current: typeof s.current === 'number' ? s.current : parseInt(s.current as string) || 0,
    target: s.target ? (typeof s.target === 'number' ? s.target : parseInt(s.target as string) || 0) : undefined,
    average: s.average ? (typeof s.average === 'number' ? s.average : parseInt(s.average as string) || 0) : undefined,
  }));

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-3xl font-black text-black flex items-center gap-3">
            <FileText className="w-8 h-8 text-indigo-600" />
            {report.title}
          </h2>
          <p className="text-stone-500 font-medium flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            {report.date} • {profile.schoolName}
          </p>
        </div>
        <div className="flex gap-4">
          <Card className="px-6 py-3 bg-emerald-50 border-emerald-100 rounded-2xl flex items-center gap-3">
            <Percent className="w-5 h-5 text-emerald-600" />
            <div>
              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Attendance</p>
              <p className="text-xl font-black text-emerald-900">{report.attendance}%</p>
            </div>
          </Card>
          {report.readingAge && (
            <Card className="px-6 py-3 bg-indigo-50 border-indigo-100 rounded-2xl flex items-center gap-3">
              <BookOpen className="w-5 h-5 text-indigo-600" />
              <div>
                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Reading Age</p>
                <p className="text-xl font-black text-indigo-900">{report.readingAge}</p>
              </div>
            </Card>
          )}
        </div>
      </div>

      <Card className="p-8 border-2 border-black/5 rounded-[3rem] shadow-xl shadow-black/5">
        <div className="mb-8">
          <h3 className="font-black text-xl flex items-center gap-2 mb-2">
            <TrendingUp className="w-6 h-6 text-emerald-600" />
            {isYear11 ? 'Mock vs Predicted Grades' : 'Student vs Year Group Average'}
          </h3>
          <p className="text-stone-400 text-sm font-medium">
            {isYear11 
              ? 'Tracking progress towards final GCSE targets.' 
              : 'Performance compared to the year group average.'}
          </p>
        </div>

        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{fill: '#888', fontSize: 10, fontWeight: 700}}
                angle={-45}
                textAnchor="end"
                interval={0}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{fill: '#888', fontSize: 10, fontWeight: 700}}
                domain={isYear11 ? [0, 9] : [0, 100]}
              />
              <Tooltip 
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', fontWeight: 700 }}
              />
              <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ paddingBottom: '20px', fontSize: '12px', fontWeight: '700' }} />
              <Bar 
                name={isYear11 ? 'Mock Grade' : 'Student %'} 
                dataKey="current" 
                fill={isYear11 ? '#6366f1' : '#10b981'} 
                radius={[6, 6, 0, 0]} 
                barSize={30}
              />
              {isYear11 ? (
                <Bar 
                  name="Predicted Grade" 
                  dataKey="target" 
                  fill="#fbbf24" 
                  radius={[6, 6, 0, 0]} 
                  barSize={30}
                />
              ) : (
                <Bar 
                  name="Year Group Avg" 
                  dataKey="average" 
                  fill="#94a3b8" 
                  radius={[6, 6, 0, 0]} 
                  barSize={30}
                />
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {report.subjects.map((s, i) => (
          <motion.div
            key={s.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="p-6 border-2 border-black/5 rounded-2xl hover:border-indigo-200 transition-all group">
              <div className="flex justify-between items-start mb-4">
                <h4 className="font-black text-lg text-black group-hover:text-indigo-600 transition-colors">{s.name}</h4>
                <Badge className={`${
                  isYear11 
                    ? (Number(s.current) >= 7 ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-indigo-700')
                    : (Number(s.current) >= (s.average as number) ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700')
                } border-none font-black text-xs px-3 py-1 rounded-lg`}>
                  {isYear11 ? `Grade ${s.current}` : `${s.current}%`}
                </Badge>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-stone-400">
                  <span>{isYear11 ? 'Predicted' : 'Year Avg'}</span>
                  <span className="text-stone-600">{isYear11 ? `Grade ${s.target}` : `${s.average}%`}</span>
                </div>
                <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${isYear11 ? (Number(s.current) / 9) * 100 : s.current}%` }}
                    className={`h-full ${isYear11 ? 'bg-indigo-500' : 'bg-emerald-500'}`}
                  />
                </div>
                {isYear11 && s.target && Number(s.current) < Number(s.target) && (
                  <p className="text-[10px] font-bold text-amber-600 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    Advancement: +{Number(s.target) - Number(s.current)} grades expected
                  </p>
                )}
                {!isYear11 && s.average && Number(s.current) < Number(s.average) && (
                  <p className="text-[10px] font-bold text-red-500 flex items-center gap-1">
                    <Target className="w-3 h-3" />
                    Focus: Below year average by {Number(s.average) - Number(s.current)}%
                  </p>
                )}
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

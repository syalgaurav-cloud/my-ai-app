import React, { useState, useEffect } from 'react';
import { UserProfile, Question, AssessmentResult, Task } from '../types';
import { Card, Button, Badge } from './UI';
import { geminiService } from '../services/gemini';
import { db } from '../firebase';
import { handleFirestoreError, OperationType } from '../utils/errorHandling';
import { doc, setDoc, updateDoc, collection, query, where, getDocs, limit, orderBy, getDoc } from 'firebase/firestore';
import { format } from 'date-fns';
import { Trophy, Brain, Target, ArrowRight, CheckCircle2, XCircle, Sparkles, Zap, Rocket, Star, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const AssessmentView = ({ profile, onComplete }: { profile: UserProfile, onComplete: () => void }) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [finished, setFinished] = useState(false);
  const [result, setResult] = useState<AssessmentResult | null>(null);

  const today = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
    const startAssessment = async () => {
      try {
        // Fetch past performance
        const assessmentsQuery = query(
          collection(db, 'assessments'),
          where('uid', '==', profile.uid),
          orderBy('date', 'desc'),
          limit(5)
        );
        const assessmentsSnap = await getDocs(assessmentsQuery);
        const pastAssessments = assessmentsSnap.docs.map(d => d.data() as AssessmentResult);
        const avgAccuracy = pastAssessments.length > 0 
          ? pastAssessments.reduce((acc, curr) => acc + curr.accuracy, 0) / pastAssessments.length
          : 70; // Default to 70 if no history

        const planRef = doc(db, 'studyPlans', `${profile.uid}-${today}`);
        const planSnap = await getDoc(planRef);
        const tasks = planSnap.exists() ? planSnap.data().tasks as Task[] : [];
        
        const generatedQuestions = await geminiService.generateAssessment(tasks, profile, avgAccuracy);
        setQuestions(generatedQuestions);
      } catch (error) {
        console.error("Error starting assessment:", error);
      } finally {
        setLoading(false);
      }
    };

    startAssessment();
  }, [profile.uid, today]);

  const handleAnswer = (option: string) => {
    const newAnswers = [...answers];
    newAnswers[currentIndex] = option;
    setAnswers(newAnswers);

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      calculateResult(newAnswers);
    }
  };

  const calculateResult = async (finalAnswers: string[]) => {
    let score = 0;
    const weaknesses: string[] = [];
    const strengths: string[] = [];
    const subjectPerformance: { [subject: string]: { score: number, total: number } } = {};

    questions.forEach((q, i) => {
      if (!subjectPerformance[q.subject]) {
        subjectPerformance[q.subject] = { score: 0, total: 0 };
      }
      subjectPerformance[q.subject].total++;

      if (q.correctAnswer === finalAnswers[i]) {
        score++;
        strengths.push(q.subject);
        subjectPerformance[q.subject].score++;
      } else {
        weaknesses.push(q.subject);
      }
    });

    const accuracy = (score / questions.length) * 100;
    const assessmentResult: AssessmentResult = {
      id: `${profile.uid}-${today}-result`,
      uid: profile.uid,
      date: today,
      score,
      totalQuestions: questions.length,
      accuracy,
      strengths: Array.from(new Set(strengths)),
      weaknesses: Array.from(new Set(weaknesses)),
      subjectPerformance,
      improvementTrend: accuracy > 70 ? 'Upward' : 'Steady'
    };

    try {
      await setDoc(doc(db, 'assessments', assessmentResult.id), assessmentResult);
      
      const allValidSubjects = [
        'Biology', 'Chemistry', 'Computer Science', 'Economics', 'English', 'Maths', 'Physics', 'Politics', 'Religious Studies', 'Spanish',
        'English Language', 'English Literature', 'French', 'History', 'Further Maths', 'Psychology', 'Mathematics', 'Food & Nutrition'
      ];

      const newStrongTopics = Array.from(new Set([...profile.strongTopics, ...assessmentResult.strengths]))
        .filter(s => allValidSubjects.includes(s));
      const newWeakTopics = Array.from(new Set([...profile.weakTopics, ...assessmentResult.weaknesses]))
        .filter(s => allValidSubjects.includes(s))
        .filter(topic => !newStrongTopics.includes(topic));

      await updateDoc(doc(db, 'users', profile.uid), {
        xp: profile.xp + (score * 100),
        weakTopics: newWeakTopics,
        strongTopics: newStrongTopics,
        level: Math.floor((profile.xp + score * 100) / 1000) + 1
      });

      const reportContent = await geminiService.generateParentReport({
        topics: strengths,
        accuracy,
        timeSpent: 30,
        improvementTrend: assessmentResult.improvementTrend
      });

      await setDoc(doc(db, 'parentReports', `${profile.uid}-${today}-report`), {
        uid: profile.uid,
        date: today,
        sent: true,
        content: reportContent
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'assessments/parentReports');
    }

    setResult(assessmentResult);
    setFinished(true);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-6">
        <div className="relative">
          <div className="absolute inset-0 bg-indigo-500/20 blur-2xl rounded-full animate-pulse" />
          <Brain className="w-16 h-16 text-indigo-600 animate-bounce relative z-10" />
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-2xl font-black text-black">Scanning Your Brain...</h3>
          <p className="text-stone-500 font-medium">Preparing your personalized challenge.</p>
        </div>
      </div>
    );
  }

  if (finished && result) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl mx-auto text-center space-y-10 py-10"
      >
        <div className="relative inline-block">
          <motion.div 
            initial={{ rotate: -10, scale: 0.8 }}
            animate={{ rotate: 0, scale: 1 }}
            className="p-10 bg-black rounded-[2.5rem] shadow-2xl shadow-black/20"
          >
            <Trophy className="w-20 h-20 text-yellow-400" />
          </motion.div>
          <motion.div 
            animate={{ scale: [1, 1.2, 1], rotate: [0, 15, 0] }}
            transition={{ repeat: Infinity, duration: 3 }}
            className="absolute -top-4 -right-4 p-4 bg-emerald-500 rounded-full shadow-lg"
          >
            <Sparkles className="w-8 h-8 text-white" />
          </motion.div>
        </div>

        <div className="space-y-3">
          <h2 className="text-5xl font-black text-black tracking-tight">Mission Cleared!</h2>
          <p className="text-stone-500 text-xl font-medium">You've unlocked <span className="text-emerald-600 font-black">+{result.score * 100} XP</span>. Absolute legend. 👑</p>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <Card className="p-8 border-2 border-black/5 rounded-[2.5rem] bg-emerald-50/50">
            <p className="text-xs font-black text-emerald-600 uppercase tracking-widest mb-2">Accuracy</p>
            <p className="text-5xl font-black text-emerald-700">{result.accuracy}%</p>
          </Card>
          <Card className="p-8 border-2 border-black/5 rounded-[2.5rem] bg-indigo-50/50">
            <p className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-2">Score</p>
            <p className="text-5xl font-black text-indigo-700">{result.score}<span className="text-2xl text-indigo-300">/{result.totalQuestions}</span></p>
          </Card>
        </div>

        <Card className="text-left p-10 border-2 border-black/5 rounded-[3rem] space-y-8">
          <h3 className="font-black text-2xl flex items-center gap-3">
            <Zap className="w-6 h-6 text-yellow-500 fill-current" />
            Post-Mission Intel
          </h3>
          <div className="space-y-6">
            <div className="flex items-start gap-5">
              <div className="p-3 bg-emerald-100 rounded-2xl">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="font-black text-black text-lg">Strengths</p>
                <p className="text-stone-500 font-medium leading-relaxed">You crushed it in {result.strengths.join(', ') || 'today\'s topics'}. Keep that energy!</p>
              </div>
            </div>
            <div className="flex items-start gap-5">
              <div className="p-3 bg-indigo-100 rounded-2xl">
                <Target className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <p className="font-black text-black text-lg">Next Boss Level</p>
                <p className="text-stone-500 font-medium leading-relaxed">Tomorrow we'll focus on mastering {result.weaknesses.join(', ') || 'new concepts'}.</p>
              </div>
            </div>
          </div>
        </Card>

        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onComplete} 
          className="w-full py-6 rounded-3xl bg-black text-white font-black text-xl shadow-2xl shadow-black/20 hover:bg-emerald-600 transition-colors"
        >
          Return to Base
        </motion.button>
      </motion.div>
    );
  }

  const currentQuestion = questions[currentIndex];

  return (
    <div className="max-w-3xl mx-auto space-y-10 py-10">
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-end justify-between gap-6"
      >
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-indigo-600 font-black text-xs uppercase tracking-widest">
            <Star className="w-4 h-4 fill-current" />
            Daily Challenge
          </div>
          <h1 className="text-4xl font-black text-black tracking-tight">Assessment</h1>
          <p className="text-stone-500 font-medium">Show us what you've got, {profile.displayName.split(' ')[0]}! 🚀</p>
        </div>
        <Badge className="bg-black text-white border-none font-black text-xs px-4 py-2 rounded-xl">
          {currentIndex + 1} / {questions.length}
        </Badge>
      </motion.header>

      <div className="w-full bg-stone-100 h-3 rounded-full overflow-hidden">
        <motion.div 
          className="bg-indigo-600 h-full"
          initial={{ width: 0 }}
          animate={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
          transition={{ type: 'spring', bounce: 0, duration: 0.5 }}
        />
      </div>

      <Card className="p-12 border-2 border-black/5 rounded-[3rem] shadow-2xl shadow-black/5">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="space-y-10"
          >
            <div className="space-y-4">
              <Badge className="bg-indigo-50 text-indigo-600 border-none px-3 py-1 font-black text-[10px] uppercase tracking-widest">
                {currentQuestion.difficulty}
              </Badge>
              <h3 className="text-3xl font-bold text-black leading-tight tracking-tight">
                {currentQuestion.text}
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {currentQuestion.options.map((option, idx) => (
                <motion.button
                  key={option}
                  whileHover={{ scale: 1.02, x: 10 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleAnswer(option)}
                  className="text-left p-6 rounded-[1.5rem] border-2 border-stone-100 bg-stone-50 hover:border-black hover:bg-white transition-all group flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white border-2 border-stone-100 flex items-center justify-center font-black text-stone-400 group-hover:border-black group-hover:text-black transition-colors">
                      {String.fromCharCode(65 + idx)}
                    </div>
                    <span className="text-xl font-bold text-stone-700 group-hover:text-black">{option}</span>
                  </div>
                  <ChevronRight className="w-6 h-6 text-stone-300 group-hover:text-black group-hover:translate-x-1 transition-all" />
                </motion.button>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </Card>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { UserProfile, DailyPlan, Task, Question, Subject, AssessmentResult } from '../types';
import { Card, Button, Badge, cn } from './UI';
import { geminiService } from '../services/gemini';
import { db } from '../firebase';
import { handleFirestoreError, OperationType } from '../utils/errorHandling';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { format } from 'date-fns';
import Markdown from 'react-markdown';
import { CheckCircle2, Circle, BookOpen, ArrowRight, Brain, Lightbulb, Zap, Rocket, Sparkles, ChevronRight, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const StudyPlanView = ({ profile }: { profile: UserProfile }) => {
  const [plan, setPlan] = useState<DailyPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTaskIndex, setActiveTaskIndex] = useState<number | null>(null);
  const [quizMode, setQuizMode] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);

  const today = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
    const fetchPlan = async () => {
      const planPath = `studyPlans/${profile.uid}-${today}`;
      try {
        const planRef = doc(db, 'studyPlans', `${profile.uid}-${today}`);
        const planSnap = await getDoc(planRef);

        if (planSnap.exists()) {
          setPlan(planSnap.data() as DailyPlan);
        } else {
          // Fetch past performance for adaptive difficulty
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

          const getStudentSubjects = (p: UserProfile): Subject[] => {
            const name = p.displayName.toLowerCase();
            const uid = p.uid.toLowerCase();
            if (name.includes('aryav') || uid === 'aryav') {
              return ['Biology', 'Chemistry', 'Computer Science', 'Economics', 'English', 'Maths', 'Physics', 'Politics', 'Religious Studies', 'Spanish'];
            } else if (name.includes('anaaya') || uid === 'anaaya') {
              return ['Biology', 'Chemistry', 'English Language', 'English Literature', 'French', 'History', 'Maths', 'Further Maths', 'Physics', 'Psychology'];
            }
            return ['Mathematics', 'Further Maths', 'Physics', 'Chemistry', 'Biology', 'English Language', 'English Literature', 'French', 'History', 'Psychology', 'Food & Nutrition'];
          };

          const studentSubjects = getStudentSubjects(profile);
          
          // Mandatory subjects (weak ones)
          const weakSubjects = studentSubjects.filter(s => 
            profile.weakTopics.some(wt => {
              const topic = wt.toLowerCase();
              const subject = s.toLowerCase();
              return topic === subject || 
                     topic.includes(subject) || 
                     subject.includes(topic) ||
                     (s === 'Maths' && topic.includes('mathematics')) ||
                     (s === 'Mathematics' && topic.includes('maths'));
            })
          );

          // All weak subjects are mandatory
          let priorities: Subject[] = [...weakSubjects];

          // Fill up to at least 4 subjects total (or more if weak subjects exceed 4)
          // to ensure variety and a solid daily workload
          const targetCount = Math.max(4, weakSubjects.length + 1);
          
          const remainingSubjects = studentSubjects.filter(s => !priorities.includes(s));
          const shuffledRemaining = [...remainingSubjects].sort(() => Math.random() - 0.5);
          
          while (priorities.length < targetCount && shuffledRemaining.length > 0) {
            const nextSubject = shuffledRemaining.pop()!;
            priorities.push(nextSubject);
          }

          // Final shuffle for UI variety
          const finalPriorities = priorities.sort(() => Math.random() - 0.5);

          const tasks = await geminiService.generateDailyPlan(finalPriorities, profile.weakTopics, profile, avgAccuracy);
          const newPlan: DailyPlan = {
            id: `${profile.uid}-${today}`,
            uid: profile.uid,
            date: today,
            tasks,
            completed: false
          };
          await setDoc(planRef, newPlan);
          setPlan(newPlan);
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, planPath);
      }
      setLoading(false);
    };

    fetchPlan();
  }, [profile.uid, today]);

  const handleTaskComplete = async (index: number) => {
    if (!plan) return;
    const newTasks = [...plan.tasks];
    newTasks[index].status = 'completed';
    const allCompleted = newTasks.every(t => t.status === 'completed');
    
    try {
      const updatedPlan = { ...plan, tasks: newTasks, completed: allCompleted };
      setPlan(updatedPlan);
      await updateDoc(doc(db, 'studyPlans', plan.id), { tasks: newTasks, completed: allCompleted });

      await updateDoc(doc(db, 'users', profile.uid), { 
        xp: profile.xp + 50,
        streak: profile.streak > 0 ? profile.streak : 1
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `studyPlans/${plan.id}`);
    }

    setActiveTaskIndex(null);
    setQuizMode(false);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-6">
        <div className="relative">
          <div className="absolute inset-0 bg-emerald-500/20 blur-2xl rounded-full animate-pulse" />
          <Rocket className="w-16 h-16 text-emerald-600 animate-bounce relative z-10" />
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-2xl font-black text-black">Building Your Mission...</h3>
          <p className="text-stone-500 font-medium">AI is crafting the perfect study path for you.</p>
        </div>
      </div>
    );
  }

  if (!plan) return null;

  const activeTask = activeTaskIndex !== null ? plan.tasks[activeTaskIndex] : null;

  return (
    <div className="space-y-10 pb-20">
      <motion.header 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="space-y-2"
      >
        <div className="flex items-center gap-2 text-emerald-600 font-black text-xs uppercase tracking-widest">
          <Zap className="w-4 h-4 fill-current" />
          Daily Mission
        </div>
        <h1 className="text-5xl font-black text-black tracking-tight">Today's Path</h1>
        <p className="text-stone-500 text-lg font-medium">Complete these tasks to level up your brain. 🧠</p>
      </motion.header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Task List - Timeline Style */}
        <div className="lg:col-span-4 space-y-6">
          <div className="relative pl-8 space-y-8">
            <div className="absolute left-[15px] top-2 bottom-2 w-1 bg-stone-100 rounded-full" />
            
            {plan.tasks.map((task, index) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative"
              >
                {/* Timeline Dot */}
                <div className={cn(
                  "absolute -left-[25px] top-1/2 -translate-y-1/2 w-8 h-8 rounded-full border-4 border-white shadow-sm flex items-center justify-center transition-all z-10",
                  task.status === 'completed' ? "bg-emerald-500" : 
                  activeTaskIndex === index ? "bg-black scale-110" : "bg-stone-200"
                )}>
                  {task.status === 'completed' && <CheckCircle2 className="w-4 h-4 text-white" />}
                </div>

                <Card 
                  className={cn(
                    "cursor-pointer transition-all p-5 rounded-3xl border-2",
                    activeTaskIndex === index 
                      ? "border-black bg-white shadow-xl shadow-black/5 -translate-y-1" 
                      : "border-transparent bg-stone-50 hover:bg-white hover:border-stone-200",
                    task.status === 'completed' && "opacity-60"
                  )}
                  onClick={() => {
                    setActiveTaskIndex(index);
                    setQuizMode(false);
                    setCurrentQuestionIndex(0);
                    setSelectedAnswer(null);
                    setShowExplanation(false);
                  }}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="space-y-2">
                      <Badge className={cn(
                        "border-none px-2 py-0.5 text-[10px] font-black uppercase tracking-widest rounded-lg",
                        getSubjectColor(task.subject)
                      )}>
                        {task.subject}
                      </Badge>
                      <h4 className="font-black text-black leading-tight">{task.topic}</h4>
                    </div>
                    <ChevronRight className={cn(
                      "w-5 h-5 transition-transform",
                      activeTaskIndex === index ? "translate-x-1 text-black" : "text-stone-300"
                    )} />
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-8">
          <AnimatePresence mode="wait">
            {activeTask ? (
              <motion.div
                key={activeTask.id + (quizMode ? '-quiz' : '-content')}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              >
                {!quizMode ? (
                  <Card className="p-10 border-2 border-black/5 rounded-[3rem] shadow-2xl shadow-black/5">
                    <div className="flex items-start justify-between mb-10">
                      <div className="flex items-center gap-5">
                        <div className="w-16 h-16 rounded-[1.5rem] bg-black flex items-center justify-center shadow-xl shadow-black/20">
                          <Brain className="w-8 h-8 text-white" />
                        </div>
                        <div className="space-y-1">
                          <h2 className="text-3xl font-black text-black tracking-tight">{activeTask.topic}</h2>
                          <p className="text-stone-400 font-bold uppercase tracking-widest text-xs">{activeTask.subject}</p>
                        </div>
                      </div>
                      <Badge className="bg-emerald-100 text-emerald-700 border-none font-black text-xs px-3 py-1">
                        +50 XP
                      </Badge>
                    </div>
                    
                    <div className="bg-emerald-50/50 rounded-[2rem] p-8 mb-10 border-2 border-emerald-100 relative overflow-hidden group">
                      <Sparkles className="absolute -right-4 -top-4 w-24 h-24 text-emerald-200/50 group-hover:rotate-12 transition-transform" />
                      <p className="text-emerald-800 font-bold text-lg leading-relaxed relative z-10">
                        "Hey {profile.displayName.split(' ')[0]}! This topic is a game-changer. Let's break it down so you can own it."
                      </p>
                    </div>

                    <div className="prose prose-stone prose-lg max-w-none mb-12 prose-headings:font-black prose-p:text-stone-600 prose-p:leading-relaxed prose-strong:text-black">
                      <Markdown>{activeTask.content}</Markdown>
                    </div>

                    <div className="flex justify-end">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setQuizMode(true)}
                        className="bg-black text-white px-10 py-5 rounded-2xl font-black text-lg flex items-center gap-3 shadow-xl shadow-black/20 hover:bg-emerald-600 transition-colors"
                      >
                        Ready for the Challenge? <Zap className="w-6 h-6 fill-current" />
                      </motion.button>
                    </div>
                  </Card>
                ) : (
                  <Card className="p-10 border-2 border-black/5 rounded-[3rem] shadow-2xl shadow-black/5">
                    <div className="flex items-center justify-between mb-12">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-black text-3xl">Quick Check</h3>
                          {currentQuestionIndex === activeTask.questions.length - 1 && (
                            <Badge className="bg-red-100 text-red-700 border-none px-3 py-1 text-[10px] font-black uppercase tracking-widest animate-pulse">
                              Boss Level 👹
                            </Badge>
                          )}
                        </div>
                        <p className="text-stone-400 font-bold uppercase tracking-widest text-xs">Question {currentQuestionIndex + 1} of {activeTask.questions.length}</p>
                      </div>
                      <div className="w-24 h-2 bg-stone-100 rounded-full overflow-hidden">
                        <motion.div 
                          className="h-full bg-emerald-500"
                          initial={{ width: 0 }}
                          animate={{ width: `${((currentQuestionIndex + 1) / activeTask.questions.length) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div className="space-y-10">
                      <p className="text-2xl font-bold text-black leading-tight">{activeTask.questions[currentQuestionIndex].text}</p>
                      
                      <div className="grid grid-cols-1 gap-4">
                        {activeTask.questions[currentQuestionIndex].options.map((option) => (
                          <motion.button
                            key={option}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            disabled={showExplanation}
                            onClick={() => setSelectedAnswer(option)}
                            className={cn(
                              "text-left p-6 rounded-[1.5rem] border-2 transition-all font-bold text-lg",
                              selectedAnswer === option 
                                ? "border-black bg-black text-white shadow-xl shadow-black/10" 
                                : "border-stone-100 bg-stone-50 hover:border-stone-200 text-stone-600",
                              showExplanation && option === activeTask.questions[currentQuestionIndex].correctAnswer && "bg-emerald-500 border-emerald-500 text-white",
                              showExplanation && selectedAnswer === option && option !== activeTask.questions[currentQuestionIndex].correctAnswer && "bg-red-500 border-red-500 text-white"
                            )}
                          >
                            {option}
                          </motion.button>
                        ))}
                      </div>

                      <AnimatePresence>
                        {showExplanation && (
                          <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-8 bg-stone-900 rounded-[2rem] text-white flex gap-5"
                          >
                            <div className="p-3 bg-white/10 rounded-xl h-fit">
                              <Lightbulb className="w-6 h-6 text-yellow-400" />
                            </div>
                            <div className="space-y-2">
                              <p className="font-black text-lg uppercase tracking-widest text-white/50">Explanation</p>
                              <p className="text-lg font-medium text-stone-300 leading-relaxed">{activeTask.questions[currentQuestionIndex].explanation}</p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <div className="flex justify-end gap-4 pt-6">
                        {!showExplanation ? (
                          <Button 
                            disabled={!selectedAnswer} 
                            onClick={() => setShowExplanation(true)}
                            className="px-10 py-5 rounded-2xl font-black text-lg bg-black text-white hover:bg-emerald-600"
                          >
                            Check Answer
                          </Button>
                        ) : (
                          currentQuestionIndex < activeTask.questions.length - 1 ? (
                            <Button 
                              onClick={() => {
                                setCurrentQuestionIndex(prev => prev + 1);
                                setSelectedAnswer(null);
                                setShowExplanation(false);
                              }}
                              className="px-10 py-5 rounded-2xl font-black text-lg bg-black text-white hover:bg-emerald-600"
                            >
                              Next Question <ArrowRight className="w-6 h-6" />
                            </Button>
                          ) : (
                            <Button 
                              onClick={() => handleTaskComplete(activeTaskIndex!)}
                              className="px-10 py-5 rounded-2xl font-black text-lg bg-emerald-600 text-white hover:bg-emerald-700"
                            >
                              Finish Mission <Trophy className="w-6 h-6" />
                            </Button>
                          )
                        )}
                      </div>
                    </div>
                  </Card>
                )}
              </motion.div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-20 bg-stone-50 rounded-[3rem] border-4 border-dashed border-stone-100">
                <div className="w-24 h-24 bg-white rounded-[2rem] flex items-center justify-center shadow-xl shadow-black/5 mb-8">
                  <BookOpen className="w-12 h-12 text-stone-200" />
                </div>
                <h3 className="text-3xl font-black text-black mb-4 tracking-tight">Ready to Level Up?</h3>
                <p className="text-stone-400 text-lg font-medium max-w-sm">Select a mission from your path to start learning and earning XP.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

const getSubjectColor = (subject: Subject) => {
  switch (subject) {
    case 'Mathematics':
    case 'Further Maths':
      return 'bg-blue-100 text-blue-700';
    case 'Physics':
    case 'Chemistry':
    case 'Biology':
      return 'bg-purple-100 text-purple-700';
    case 'English Language':
    case 'English Literature':
      return 'bg-indigo-100 text-indigo-700';
    case 'French':
    case 'Spanish':
      return 'bg-yellow-100 text-yellow-700';
    case 'History':
    case 'Psychology':
      return 'bg-stone-200 text-stone-800';
    default:
      return 'bg-orange-100 text-orange-700';
  }
};

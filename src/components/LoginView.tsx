import React, { useState } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs, doc, setDoc, getDoc } from 'firebase/firestore';
import { UserProfile, AcademicReport } from '../types';
import { Card, Button } from './UI';
import { GraduationCap, Lock, User, ArrowRight, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';

const ANAAYA_REPORT: AcademicReport = {
  title: 'Y11 Grade Report',
  date: 'January 2026',
  attendance: 97.1,
  subjects: [
    { name: 'Biology', current: 8, target: 8 },
    { name: 'Chemistry', current: 9, target: 8 },
    { name: 'English Language', current: 6, target: 7 },
    { name: 'English Literature', current: 6, target: 7 },
    { name: 'French', current: 9, target: 9 },
    { name: 'Food & Nutrition', current: 8, target: 9 },
    { name: 'History', current: 7, target: 7 },
    { name: 'Maths', current: 7, target: 8 },
    { name: 'Further Maths', current: 5, target: 6 },
    { name: 'Physics', current: 8, target: 9 },
    { name: 'Psychology', current: 6, target: 7 },
  ]
};

const ARYAV_REPORT: AcademicReport = {
  title: 'Year 9 Academic Monitoring Report',
  date: 'March 2026',
  attendance: 99.08,
  readingAge: '17:00',
  subjects: [
    { name: 'Biology', current: 70, average: 62 },
    { name: 'Chemistry', current: 45, average: 63 },
    { name: 'Computer Science', current: 48, average: 69 },
    { name: 'Economics', current: 58, average: 65 },
    { name: 'English Language', current: 67, average: 59 },
    { name: 'Mathematics', current: 40, average: 71 },
    { name: 'PE', current: 70, average: 62 },
    { name: 'PE (GCSE)', current: 60, average: 76 },
    { name: 'Physics', current: 31, average: 68 },
    { name: 'Religious Studies', current: 57, average: 63 },
    { name: 'Spanish', current: 70, average: 78 },
  ]
};

export const LoginView = ({ onLogin }: { onLogin: (profile: UserProfile) => void }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Check for Anaaya or Aryav
      const docId = username.toLowerCase();
      const userDoc = await getDoc(doc(db, 'users', docId));

      if (!userDoc.exists()) {
        // Initialize if first time
        if (docId === 'anaaya' && password === 'GCSE') {
          const newProfile: UserProfile = {
            uid: 'anaaya',
            displayName: 'Anaaya Syal',
            email: 'anaayasyal@gmail.com',
            role: 'student',
            password: 'GCSE',
            xp: 0,
            level: 0,
            streak: 0,
            weakTopics: ['Further Maths', 'English Language', 'English Literature', 'Psychology', 'History', 'Mathematics'],
            strongTopics: ['Chemistry', 'French', 'Food & Nutrition', 'Biology', 'Physics'],
            yearGroup: 11,
            schoolName: 'Wallington High School for Girls',
            academicReport: ANAAYA_REPORT
          };
          await setDoc(doc(db, 'users', 'anaaya'), newProfile);
          onLogin(newProfile);
          return;
        } else if (docId === 'aryav' && password === 'Year9') {
          // Deep assessment from report:
          // Strong: History (92%), Geography (88%), Art (95%), English Lit (84%)
          // Growth Areas: Mathematics (Algebra/Geometry), Physics (Forces), Spanish (Grammar), Chemistry (Bonding), Computer Science (Logic)
          const newProfile: UserProfile = {
            uid: 'aryav',
            displayName: 'Aryav Syal',
            email: 'aryavsyal@gmail.com',
            role: 'student',
            password: 'Year9',
            xp: 0,
            level: 1,
            streak: 0,
            weakTopics: [
              'Maths', 
              'Physics', 
              'Spanish', 
              'Chemistry',
              'Computer Science'
            ],
            strongTopics: [
              'Biology', 
              'English', 
              'Economics', 
              'Politics', 
              'Religious Studies'
            ],
            yearGroup: 9,
            schoolName: 'Wallington Grammar School',
            academicReport: ARYAV_REPORT
          };
          await setDoc(doc(db, 'users', 'aryav'), newProfile);
          onLogin(newProfile);
          return;
        } else if (docId === 'gaurav' && password === 'Parent') {
          // Pre-create children if they don't exist to ensure dashboard has data
          const anaayaProfile: UserProfile = {
            uid: 'anaaya',
            displayName: 'Anaaya Syal',
            email: 'anaayasyal@gmail.com',
            role: 'student',
            password: 'GCSE',
            xp: 0,
            level: 0,
            streak: 0,
            weakTopics: ['Further Maths', 'English Language', 'English Literature', 'Psychology', 'History', 'Mathematics'],
            strongTopics: ['Chemistry', 'French', 'Food & Nutrition', 'Biology', 'Physics'],
            yearGroup: 11,
            schoolName: 'Wallington High School for Girls',
            academicReport: ANAAYA_REPORT
          };
          const aryavProfile: UserProfile = {
            uid: 'aryav',
            displayName: 'Aryav Syal',
            email: 'aryavsyal@gmail.com',
            role: 'student',
            password: 'Year9',
            xp: 0,
            level: 1,
            streak: 0,
            weakTopics: ['Maths', 'Physics', 'Spanish', 'Chemistry', 'Computer Science'],
            strongTopics: ['Biology', 'English', 'Economics', 'Politics', 'Religious Studies'],
            yearGroup: 9,
            schoolName: 'Wallington Grammar School',
            academicReport: ARYAV_REPORT
          };
          
          const anaayaDoc = await getDoc(doc(db, 'users', 'anaaya'));
          if (!anaayaDoc.exists()) await setDoc(doc(db, 'users', 'anaaya'), anaayaProfile);
          
          const aryavDoc = await getDoc(doc(db, 'users', 'aryav'));
          if (!aryavDoc.exists()) await setDoc(doc(db, 'users', 'aryav'), aryavProfile);

          const newProfile: UserProfile = {
            uid: 'gaurav',
            displayName: 'Gaurav Syal',
            email: 'syal.gaurav@gmail.com',
            role: 'parent',
            password: 'Parent',
            children: ['anaaya', 'aryav'],
            xp: 0,
            level: 0,
            streak: 0,
            weakTopics: [],
            strongTopics: [],
            yearGroup: 0,
            schoolName: 'Parent Dashboard'
          };
          await setDoc(doc(db, 'users', 'gaurav'), newProfile);
          onLogin(newProfile);
          return;
        } else {
          setError('Invalid username or password');
        }
      } else {
        const profile = userDoc.data() as UserProfile;
        if (profile.password === password) {
          // If parent, ensure children exist and are linked
          if (profile.role === 'parent') {
            const anaayaProfile: UserProfile = {
              uid: 'anaaya',
              displayName: 'Anaaya Syal',
              email: 'anaayasyal@gmail.com',
              role: 'student',
              password: 'GCSE',
              xp: 0,
              level: 0,
              streak: 0,
              weakTopics: ['Further Maths', 'English Language', 'English Literature', 'Psychology', 'History', 'Mathematics'],
              strongTopics: ['Chemistry', 'French', 'Food & Nutrition', 'Biology', 'Physics'],
              yearGroup: 11,
              schoolName: 'Wallington High School for Girls'
            };
            const aryavProfile: UserProfile = {
              uid: 'aryav',
              displayName: 'Aryav Syal',
              email: 'aryavsyal@gmail.com',
              role: 'student',
              password: 'Year9',
              xp: 0,
              level: 1,
              streak: 0,
              weakTopics: ['Mathematics', 'Physics', 'Spanish'],
              strongTopics: ['History', 'Geography', 'Art'],
              yearGroup: 9,
              schoolName: 'Wallington Grammar School'
            };

            const anaayaDoc = await getDoc(doc(db, 'users', 'anaaya'));
            if (!anaayaDoc.exists()) await setDoc(doc(db, 'users', 'anaaya'), anaayaProfile);
            
            const aryavDoc = await getDoc(doc(db, 'users', 'aryav'));
            if (!aryavDoc.exists()) await setDoc(doc(db, 'users', 'aryav'), aryavProfile);

            // Ensure gaurav has children array
            if (!profile.children || profile.children.length < 2) {
              const updatedProfile = { ...profile, children: ['anaaya', 'aryav'] };
              await setDoc(doc(db, 'users', 'gaurav'), updatedProfile);
              onLogin(updatedProfile);
              return;
            }
          }
          onLogin(profile);
        } else {
          setError('Invalid password');
        }
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf9f6] flex flex-col items-center justify-center p-6 overflow-hidden relative">
      {/* Decorative elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-100 rounded-full blur-[120px] opacity-60 animate-float" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-100 rounded-full blur-[120px] opacity-60 animate-float" style={{ animationDelay: '2s' }} />

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="max-w-md w-full text-center space-y-10 relative z-10"
      >
        <div className="flex justify-center">
          <motion.div 
            whileHover={{ scale: 1.05, rotate: 5 }}
            className="p-6 bg-black rounded-[2.5rem] shadow-2xl"
          >
            <GraduationCap className="w-16 h-16 text-emerald-400" />
          </motion.div>
        </div>
        
        <div className="space-y-3">
          <h1 className="text-5xl font-extrabold tracking-tight text-black">
            Wallington <span className="text-emerald-600">Ace</span>
          </h1>
          <p className="text-stone-500 text-xl font-medium">Level up your academic game.</p>
        </div>

        <div className="glass-card p-10 rounded-[2.5rem] border-2 border-black/5">
          <form onSubmit={handleLogin} className="space-y-8">
            <div className="space-y-5 text-left">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-stone-400 ml-1">Username</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400 group-focus-within:text-emerald-500 transition-colors" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Anaaya, Aryav, or Gaurav"
                    className="w-full pl-12 pr-4 py-4 bg-white border-2 border-stone-100 rounded-2xl focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all font-medium"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-stone-400 ml-1">Password</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400 group-focus-within:text-emerald-500 transition-colors" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-12 pr-4 py-4 bg-white border-2 border-stone-100 rounded-2xl focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all font-medium"
                    required
                  />
                </div>
              </div>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-4 bg-red-50 text-red-600 text-sm font-bold rounded-2xl border-2 border-red-100"
              >
                {error}
              </motion.div>
            )}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full py-5 bg-black text-white text-xl font-bold rounded-2xl flex items-center justify-center gap-3 shadow-xl hover:bg-emerald-600 transition-colors disabled:opacity-50"
            >
              {loading ? 'Entering...' : 'Start Your Session'}
              {!loading && <ArrowRight className="w-6 h-6" />}
            </motion.button>
          </form>
        </div>

        <div className="flex items-center justify-center gap-3 text-stone-400 font-bold text-sm uppercase tracking-widest">
          <ShieldCheck className="w-5 h-5 text-emerald-500" />
          <span>Academic Vault Secure</span>
        </div>
      </motion.div>
    </div>
  );
};

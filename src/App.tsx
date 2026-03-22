import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, User, signOut } from 'firebase/auth';
import { handleFirestoreError, OperationType } from './utils/errorHandling';
import { doc, getDoc, setDoc, onSnapshot, updateDoc } from 'firebase/firestore';
import { UserProfile } from './types';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { StudyPlanView } from './components/StudyPlanView';
import { AssessmentView } from './components/AssessmentView';
import { Button, Card, Badge } from './components/UI';
import { GraduationCap, Brain, Trophy, BarChart3, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { LoginView } from './components/LoginView';
import { ParentDashboard } from './components/ParentDashboard';
import { ToastContainer } from './components/ToastContainer';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'learn' | 'assess' | 'settings' | 'family'>('dashboard');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          const profileDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (profileDoc.exists()) {
            setProfile(profileDoc.data() as UserProfile);
          } else {
            const newProfile: UserProfile = {
              uid: firebaseUser.uid,
              displayName: 'Anaaya Syal',
              email: firebaseUser.email || 'anaayasyal@gmail.com',
              role: 'student',
              xp: 0,
              level: 0,
              streak: 0,
              weakTopics: ['Further Maths', 'English Language', 'English Literature', 'Psychology', 'History', 'Mathematics'],
              strongTopics: ['Chemistry', 'French', 'Food & Nutrition', 'Biology', 'Physics'],
              yearGroup: 11,
              schoolName: 'Wallington High School for Girls'
            };
            await setDoc(doc(db, 'users', firebaseUser.uid), newProfile);
            setProfile(newProfile);
          }

          // Real-time listener for profile updates (XP, level, etc.)
          onSnapshot(doc(db, 'users', firebaseUser.uid), (snapshot) => {
            if (snapshot.exists()) {
              setProfile(snapshot.data() as UserProfile);
            }
          }, (error) => {
            handleFirestoreError(error, OperationType.GET, `users/${firebaseUser.uid}`);
          });
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `users/${firebaseUser.uid}`);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    if (user) {
      await signOut(auth);
    } else {
      setProfile(null);
      window.location.reload(); // Simple way to clear state and go back to login
    }
  };

  const handleCustomLogin = (profile: UserProfile) => {
    setProfile(profile);
    // Real-time listener for profile updates (XP, level, etc.)
    onSnapshot(doc(db, 'users', profile.uid), (snapshot) => {
      if (snapshot.exists()) {
        setProfile(snapshot.data() as UserProfile);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${profile.uid}`);
    });
  };

  if (loading) {
    return (
      <>
        <ToastContainer />
        <div className="min-h-screen flex flex-col items-center justify-center bg-white space-y-6">
          <div className="relative">
            <div className="absolute inset-0 bg-emerald-500/20 blur-3xl rounded-full animate-pulse" />
            <div className="w-20 h-20 rounded-[2.5rem] bg-black flex items-center justify-center shadow-2xl relative z-10">
              <GraduationCap className="w-10 h-10 text-white animate-bounce" />
            </div>
          </div>
          <div className="text-center space-y-2">
            <h3 className="text-2xl font-black text-black tracking-tight">Loading SmartStudy...</h3>
            <p className="text-stone-400 font-medium">Preparing your personalized learning space.</p>
          </div>
        </div>
      </>
    );
  }

  if (!profile) {
    return (
      <>
        <ToastContainer />
        <LoginView onLogin={handleCustomLogin} />
      </>
    );
  }

  if (profile.role === 'parent') {
    return (
      <>
        <ToastContainer />
        <Layout 
          profile={profile} 
          activeTab={activeTab === 'family' ? 'family' : 'dashboard'} 
          onTabChange={(tab) => setActiveTab(tab as any)}
          onLogout={handleLogout}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key="parent-dashboard"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ type: "spring", damping: 20, stiffness: 100 }}
            >
              <ParentDashboard profile={profile} />
            </motion.div>
          </AnimatePresence>
        </Layout>
      </>
    );
  }

  return (
    <>
      <ToastContainer />
      <Layout 
        profile={profile} 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
        onLogout={handleLogout}
      >
      <AnimatePresence mode="wait">
        {activeTab === 'dashboard' && (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ type: "spring", damping: 20, stiffness: 100 }}
          >
            <Dashboard profile={profile} onStartLearning={() => setActiveTab('learn')} />
          </motion.div>
        )}
        {activeTab === 'learn' && (
          <motion.div
            key="learn"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ type: "spring", damping: 20, stiffness: 100 }}
          >
            <StudyPlanView profile={profile} />
          </motion.div>
        )}
        {activeTab === 'assess' && (
          <motion.div
            key="assess"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ type: "spring", damping: 20, stiffness: 100 }}
          >
            <AssessmentView profile={profile} onComplete={() => setActiveTab('dashboard')} />
          </motion.div>
        )}
        {activeTab === 'settings' && (
          <motion.div
            key="settings"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ type: "spring", damping: 20, stiffness: 100 }}
          >
            <SettingsView profile={profile} />
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
   </>
  );
}

const SettingsView = ({ profile }: { profile: UserProfile }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', profile.uid), { password: newPassword });
      setMessage('Password updated successfully!');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error(err);
      setMessage('Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-12 pb-20">
      <header className="space-y-2">
        <div className="flex items-center gap-2 text-stone-400 font-black text-xs uppercase tracking-widest">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          >
            <Brain className="w-4 h-4" />
          </motion.div>
          Account Settings
        </div>
        <h1 className="text-5xl font-black text-black tracking-tight">Settings</h1>
        <p className="text-stone-500 text-lg font-medium">Manage your account preferences and security. 🔒</p>
      </header>

      <div className="grid grid-cols-1 gap-8">
        <Card className="p-10 border-2 border-black/5 rounded-[3rem] shadow-2xl shadow-black/5">
          <div className="flex items-center gap-4 mb-10">
            <div className="w-16 h-16 rounded-3xl bg-emerald-100 flex items-center justify-center">
              <Lock className="w-8 h-8 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-black text-2xl text-black">Change Password</h3>
              <p className="text-stone-400 font-medium">Keep your account secure with a strong password.</p>
            </div>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-xs font-black uppercase tracking-widest text-stone-400 ml-1">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full p-5 bg-stone-50 border-2 border-transparent rounded-[1.5rem] focus:outline-none focus:border-emerald-500 focus:bg-white transition-all font-bold text-lg"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-black uppercase tracking-widest text-stone-400 ml-1">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full p-5 bg-stone-50 border-2 border-transparent rounded-[1.5rem] focus:outline-none focus:border-emerald-500 focus:bg-white transition-all font-bold text-lg"
                  required
                />
              </div>
            </div>
            
            {message && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-5 rounded-2xl font-bold text-center ${message.includes('successfully') ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}
              >
                {message}
              </motion.div>
            )}
            
            <Button 
              type="submit" 
              disabled={loading} 
              className="w-full py-6 rounded-[1.5rem] bg-black text-white font-black text-xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-black/20"
            >
              {loading ? 'Updating...' : 'Update Password'}
            </Button>
          </form>
        </Card>

        <Card className="p-10 border-2 border-black/5 rounded-[3rem] bg-stone-50/50">
          <h3 className="font-black text-xl text-black mb-6">Profile Information</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-white rounded-2xl border-2 border-black/5">
              <span className="text-stone-400 font-bold text-sm uppercase tracking-widest">Display Name</span>
              <span className="font-black text-black">{profile.displayName}</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-white rounded-2xl border-2 border-black/5">
              <span className="text-stone-400 font-bold text-sm uppercase tracking-widest">Email Address</span>
              <span className="font-black text-black">{profile.email}</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-white rounded-2xl border-2 border-black/5">
              <span className="text-stone-400 font-bold text-sm uppercase tracking-widest">Account Type</span>
              <Badge className="bg-black text-white border-none font-black text-[10px] uppercase tracking-widest rounded-lg">{profile.role}</Badge>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

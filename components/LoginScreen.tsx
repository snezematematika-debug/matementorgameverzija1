
import React, { useState } from 'react';
import { motion } from 'motion/react';
import { LogIn, Mail, Lock, ArrowRight, Github } from 'lucide-react';
import { signInWithGoogle } from '../services/firebase';

const MathSymbol: React.FC<{ symbol: string; x: string; y: string; delay: number; size?: string }> = ({ symbol, x, y, delay, size = "text-2xl" }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0 }}
    animate={{ 
      opacity: [0.1, 0.3, 0.1], 
      scale: [1, 1.2, 1],
      y: [0, -20, 0]
    }}
    transition={{ 
      duration: 5, 
      repeat: Infinity, 
      delay,
      ease: "easeInOut"
    }}
    className={`absolute ${x} ${y} ${size} font-mono text-indigo-400 pointer-events-none select-none`}
  >
    {symbol}
  </motion.div>
);

const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error("Google login failed", error);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-sky-50 overflow-hidden flex items-center justify-center font-sans">
      {/* Background Soft Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-blue-200/50 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-indigo-100/50 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Math Symbols Pattern - Darker for light background */}
      <MathSymbol symbol="π" x="left-[10%]" y="top-[15%]" delay={0} />
      <MathSymbol symbol="Σ" x="right-[15%]" y="top-[25%]" delay={1} size="text-4xl" />
      <MathSymbol symbol="√" x="left-[20%]" y="bottom-[20%]" delay={2} />
      <MathSymbol symbol="∞" x="right-[25%]" y="bottom-[15%]" delay={1.5} size="text-3xl" />
      <MathSymbol symbol="∫" x="left-[45%]" y="top-[10%]" delay={3} />
      <MathSymbol symbol="Δ" x="right-[40%]" y="bottom-[10%]" delay={0.5} />
      <MathSymbol symbol="f(x)" x="left-[5%]" y="bottom-[40%]" delay={4} size="text-xl" />
      <MathSymbol symbol="x²" x="right-[5%]" y="top-[50%]" delay={2.5} />

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none"></div>

      {/* Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative w-full max-w-md mx-4 flex flex-col items-center"
      >
        {/* Subtle shadow glow */}
        <div className="absolute -inset-4 bg-sky-400/10 rounded-[3rem] blur-2xl pointer-events-none"></div>
        
        <div className="relative w-full bg-white/80 backdrop-blur-2xl border border-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] overflow-hidden">
          <div className="p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.3 }}
                className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-tr from-sky-500 to-indigo-600 rounded-2xl shadow-lg mb-4"
              >
                <svg viewBox="0 0 512 512" className="w-10 h-10 text-white">
                  <path 
                    d="M100 380 L200 180 L256 300 L312 180 L412 380" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="54" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                  />
                  <circle cx="256" cy="300" r="32" fill="white" />
                </svg>
              </motion.div>
              <h1 className="text-2xl font-bold text-slate-900 mb-2 tracking-tight">Добредојдовте во Mate-Mentor</h1>
              <p className="text-slate-500 text-sm">Вашиот асистент во светот на математиката</p>
            </div>

            {/* Form */}
            <div className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  type="email" 
                  placeholder="Е-пошта"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition-all"
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  type="password" 
                  placeholder="Лозинка"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition-all"
                />
              </div>

              <button className="w-full bg-sky-600 hover:bg-sky-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-sky-200 transition-all flex items-center justify-center gap-2 group">
                {isRegistering ? 'Регистрирај се' : 'Најави се'}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <div className="relative flex items-center justify-center py-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <span className="relative px-4 bg-white text-xs text-slate-400 uppercase tracking-widest">или</span>
              </div>

              <button 
                onClick={handleGoogleLogin}
                className="w-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-medium py-3 rounded-xl transition-all flex items-center justify-center gap-3 shadow-sm"
              >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                Најави се со Google
              </button>
            </div>

            {/* Footer */}
            <div className="mt-8 text-center">
              <button 
                onClick={() => setIsRegistering(!isRegistering)}
                className="text-sm text-sky-600 hover:text-sky-700 font-medium transition-colors"
              >
                {isRegistering ? 'Веќе имате сметка? Најавете се' : 'Немате сметка? Регистрирајте се'}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginScreen;

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, Lock, User, Sparkles, CheckCircle, AlertCircle, ArrowRight, Compass, Shield, ShieldAlert, Award } from 'lucide-react';
import { supabase, isSupabaseConfigured, mockAuth, UserProfile } from '../lib/supabase';
import SadafLogo from './SadafLogo';

interface SignUpViewProps {
  onSignUpSuccess: () => void;
  onNavigateToLogin: () => void;
}

export default function SignUpView({ onSignUpSuccess, onNavigateToLogin }: SignUpViewProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'customer' | 'admin' | 'founder'>('customer');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Secret passcode to sign up as admin or founder under live Supabase if needed, or simply let it register.
  // In our sandbox/simulation or setup, we will just register it directly.
  const [secretPasscode, setSecretPasscode] = useState('');
  const [showPasscodeField, setShowPasscodeField] = useState(false);

  const handleRoleChange = (selectedRole: 'customer' | 'admin' | 'founder') => {
    setRole(selectedRole);
    if (selectedRole !== 'customer') {
      setShowPasscodeField(true);
    } else {
      setShowPasscodeField(false);
      setSecretPasscode('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !password) {
      setError('Please fully write all required attributes.');
      return;
    }

    // Passcode validation for elevated admin/founder roles if desired, simple security check
    if (role !== 'customer' && secretPasscode !== 'Cairo99' && secretPasscode !== 'sadaf123') {
      setError('Invalid authorization token for elevated access. (Use standard "sadaf123" for demo).');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    await new Promise((resolve) => setTimeout(resolve, 800));

    if (isSupabaseConfigured && supabase) {
      // Live Supabase signup code
      try {
        const { data, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              fullName,
              role
            }
          }
        });

        if (authError) {
          throw authError;
        }

        if (data.user) {
          setSuccess('Exclusive invitation generated! Please review your email inbox to verify coordinates.');
          setTimeout(() => {
            onSignUpSuccess();
          }, 2400);
        }
      } catch (err: any) {
        setError(err.message || 'Signature registration failed.');
        setLoading(false);
      }
    } else {
      // Sandbox local fallback
      const users = mockAuth.getUsers();
      const exists = users.some((u) => u.email.toLowerCase() === email.toLowerCase());

      if (exists) {
        setError('This email vector is already registered inside SADAF archives.');
        setLoading(false);
        return;
      }

      const newUser: UserProfile = {
        id: `usr-${Date.now()}`,
        email,
        role,
        fullName,
        createdAt: new Date().toISOString()
      };

      const updated = [...users, newUser];
      mockAuth.saveUsers(updated);
      setSuccess(`[SANDBOX] Exclusive ${role} successfully registered. Welcome to SADAF.`);
      
      setTimeout(() => {
        onSignUpSuccess();
      }, 1500);
    }
  };

  return (
    <div className="w-full min-h-[70vh] flex items-center justify-center py-12 px-4 relative font-sans text-[#E8E0D5]">
      {/* Dynamic Ambient Background Vector Glows */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-[#C9A84C]/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#4FC3F7]/5 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-lg bg-[#0A0F2C]/90 border border-[#C9A84C]/25 rounded-3xl p-8 md:p-10 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute inset-1 border border-[#C9A84C]/10 rounded-2xl pointer-events-none" />

        <div className="flex flex-col items-center text-center mb-6 relative z-10">
          <SadafLogo size={36} withMarbleBackground={false} />
          <h2 className="text-xl md:text-2xl font-serif text-[#C9A84C] font-semibold mt-4 uppercase tracking-widest">
            SADAF IDENTITY SIGN UP
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-sans">
            Acquire your exclusive heritage connection interface.
          </p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-5 p-3.5 bg-red-950/40 border border-red-500/30 text-red-200 rounded-xl text-xs flex items-center gap-2"
          >
            <AlertCircle size={14} className="shrink-0 text-red-400" />
            <span>{error}</span>
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-5 p-4 bg-green-950/40 border border-green-500/30 text-green-200 rounded-xl text-xs flex items-start gap-2"
          >
            <CheckCircle size={14} className="shrink-0 text-green-400 mt-0.5" />
            <div>
              <strong className="text-white block mb-0.5">Registration Registered!</strong>
              <span>{success}</span>
            </div>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 relative z-10 text-left">
          {/* Form Input fields */}
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-widest text-[#E8E0D5]/60 mb-1.5">
              Full legal name
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                <User size={14} />
              </span>
              <input
                id="signup-name"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Layla Al-Khouri"
                className="w-full bg-black/40 border border-[#C9A84C]/25 text-xs text-white placeholder-slate-600 rounded-xl pl-10 pr-4 py-3 outline-none focus:border-[#4FC3F7] transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-mono uppercase tracking-widest text-[#E8E0D5]/60 mb-1.5">
              Email coordinate
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                <Mail size={14} />
              </span>
              <input
                id="signup-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="layla@sadaf.luxury"
                className="w-full bg-black/40 border border-[#C9A84C]/25 text-xs text-white placeholder-slate-600 rounded-xl pl-10 pr-4 py-3 outline-none focus:border-[#4FC3F7] transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-mono uppercase tracking-widest text-[#E8E0D5]/60 mb-1.5">
              Lustrous cipher key
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                <Lock size={14} />
              </span>
              <input
                id="signup-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
                className="w-full bg-black/40 border border-[#C9A84C]/25 text-xs text-white placeholder-slate-600 rounded-xl pl-10 pr-4 py-3 outline-none focus:border-[#4FC3F7] transition"
              />
            </div>
          </div>

          {/* Role selection tab matrix */}
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-widest text-[#E8E0D5]/60 mb-1.5">
              Select Role Authorization Link
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { r: 'customer', title: 'Customer', desc: 'Curator' },
                { r: 'admin', title: 'Admin', desc: 'Atelier Controller' },
                { r: 'founder', title: 'Founder', desc: 'Direct Executive' }
              ].map((item) => (
                <button
                  key={item.r}
                  type="button"
                  onClick={() => handleRoleChange(item.r as any)}
                  className={`p-3 rounded-xl border select-none text-left flex flex-col justify-between transition h-20 cursor-pointer ${
                    role === item.r
                      ? 'bg-[#C9A84C]/10 border-[#C9A84C] text-[#C9A84C]'
                      : 'bg-black/35 border-white/10 text-slate-400 hover:border-white/20'
                  }`}
                >
                  <span className="text-xs font-serif font-bold leading-tight">{item.title}</span>
                  <span className="text-[8px] font-mono tracking-wider text-slate-500 uppercase">{item.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* If Elevated role, prompt secret passcode */}
          {showPasscodeField && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="p-3 bg-[#111A45]/40 border border-[#C9A84C]/20 rounded-xl space-y-2 mt-2"
            >
              <div className="flex justify-between items-center text-[10px] text-[#C9A84C] font-mono uppercase tracking-wider font-semibold">
                <span>Passcode key authorization</span>
                <span className="text-slate-500 text-[8px] italic">demo use: "sadaf123"</span>
              </div>
              <input
                type="password"
                required
                value={secretPasscode}
                onChange={(e) => setSecretPasscode(e.target.value)}
                placeholder="Enter specialized passcode coordinate"
                className="w-full bg-black/60 border border-[#C9A84C]/20 text-[11px] text-white placeholder-slate-600 rounded-lg p-2 outline-none focus:border-red-400 transition"
              />
            </motion.div>
          )}

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-[#C9A84C] to-[#E8E0D5]/80 hover:text-[#0A0F2C] text-[#0A0F2C] text-xs font-mono font-bold uppercase tracking-widest rounded-xl transition-all duration-300 transform active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-[#C9A84C]/15"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-[#0A0F2C] border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Register Secure Persona <Award size={13} />
                </>
              )}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center border-t border-white/5 pt-4 w-full text-xs">
          <span className="text-slate-500">Already have an elite coordinate?</span>{' '}
          <button
            onClick={onNavigateToLogin}
            className="text-[#C9A84C] hover:text-[#4FC3F7] font-semibold cursor-pointer underline"
          >
            Access account link
          </button>
        </div>
      </motion.div>
    </div>
  );
}

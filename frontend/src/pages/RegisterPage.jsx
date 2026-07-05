import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, GraduationCap, Users, BookOpen, ShieldCheck, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import AuthLayout from '../components/auth/AuthLayout';
import GoogleAuthButton from '../components/auth/GoogleAuthButton';
import { Input } from '../components/common/Primitives';
import Button from '../components/common/Button';
import { useAuthStore } from '../stores/authStore';

const schema = z.object({
  fullName: z.string().min(2, 'Enter your full name'),
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(8, 'At least 8 characters'),
});

const ROLES = [
  { value: 'TEACHER', label: 'Teacher', desc: 'Manage classes and message parents & students', icon: GraduationCap },
  { value: 'PARENT', label: 'Parent', desc: 'Stay in touch with your child\u2019s teachers', icon: Users },
  { value: 'STUDENT', label: 'Student', desc: 'Ask questions and get homework help', icon: BookOpen },
  { value: 'ADMIN', label: 'School Admin', desc: 'Set up your school and manage staff', icon: ShieldCheck },
];

export default function RegisterPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [role, setRole] = useState(null);
  const register_ = useAuthStore((s) => s.register);
  const isLoading = useAuthStore((s) => s.isLoading);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (values) => {
    const result = await register_({ ...values, role });
    if (result.success) {
      if (result.data.verificationEmailSent) {
        toast.success('Account created! Check your email to verify.');
      } else {
        toast.success('Account created! You can sign in right away — email verification is unavailable right now.');
      }
      navigate('/onboarding/school', { state: { role } });
    } else {
      toast.error(result.error);
    }
  };

  return (
    <AuthLayout
      title={step === 1 ? 'What\u2019s your role?' : 'Create your account'}
      subtitle={step === 1 ? 'This helps us tailor Talkarox to you.' : `Setting up as a ${ROLES.find((r) => r.value === role)?.label.toLowerCase()}.`}
    >
      <AnimatePresence mode="wait">
        {step === 1 ? (
          <motion.div key="role" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} className="space-y-3">
            {ROLES.map((r) => (
              <motion.button
                key={r.value}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setRole(r.value);
                  setStep(2);
                }}
                className="w-full flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-card text-left hover:border-brand hover:shadow-card transition-all"
              >
                <div className="w-11 h-11 rounded-card bg-brand-50 flex items-center justify-center flex-shrink-0">
                  <r.icon size={20} className="text-brand-600" />
                </div>
                <div>
                  <p className="font-semibold text-ink">{r.label}</p>
                  <p className="text-xs text-ink-mute">{r.desc}</p>
                </div>
              </motion.button>
            ))}
            <p className="text-center text-sm text-ink-mute pt-2">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-brand hover:underline">Sign in</Link>
            </p>
          </motion.div>
        ) : (
          <motion.div key="form" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} className="space-y-4">
            <button onClick={() => setStep(1)} className="flex items-center gap-1.5 text-sm font-medium text-ink-mute hover:text-ink mb-2">
              <ArrowLeft size={15} /> Change role
            </button>

            <GoogleAuthButton role={role} onSuccess={() => navigate('/onboarding/school', { state: { role } })} />

            <div className="flex items-center gap-3 text-xs text-ink-faint">
              <div className="flex-1 h-px bg-gray-200" />
              or use your email
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input label="Full name" icon={User} placeholder="Anita Sharma" error={errors.fullName?.message} {...register('fullName')} />
              <Input label="Email" type="email" icon={Mail} placeholder="you@school.edu" error={errors.email?.message} {...register('email')} />
              <Input label="Password" type="password" icon={Lock} placeholder="At least 8 characters" error={errors.password?.message} {...register('password')} />
              <Button type="submit" fullWidth loading={isLoading}>Create account</Button>
            </form>
            <p className="text-xs text-ink-faint text-center">
              By continuing, you agree to Talkarox\u2019s Terms and Privacy Policy.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </AuthLayout>
  );
}
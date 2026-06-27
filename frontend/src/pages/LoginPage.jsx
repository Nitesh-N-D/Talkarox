import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import AuthLayout from '../components/auth/AuthLayout';
import GoogleAuthButton from '../components/auth/GoogleAuthButton';
import { Input } from '../components/common/Primitives';
import Button from '../components/common/Button';
import { useAuthStore } from '../stores/authStore';

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export default function LoginPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const login = useAuthStore((s) => s.login);
  const isLoading = useAuthStore((s) => s.isLoading);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (values) => {
    const result = await login(values);
    if (result.success) {
      toast.success(`Welcome back, ${result.user.fullName.split(' ')[0]}!`);
      navigate('/dashboard');
    } else {
      toast.error(result.error);
    }
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to continue your conversations.">
      <div className="space-y-4">
        <GoogleAuthButton onSuccess={() => navigate('/dashboard')} />

        <div className="flex items-center gap-3 text-xs text-ink-faint">
          <div className="flex-1 h-px bg-gray-200" />
          or continue with email
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Email"
            type="email"
            icon={Mail}
            placeholder="you@school.edu"
            error={errors.email?.message}
            {...register('email')}
          />
          <div>
            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                icon={Lock}
                placeholder="••••••••"
                error={errors.password?.message}
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-3 top-[34px] text-ink-faint hover:text-ink-mute"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <div className="flex justify-end mt-1.5">
              <Link to="/forgot-password" className="text-xs font-medium text-brand hover:underline">
                Forgot password?
              </Link>
            </div>
          </div>

          <Button type="submit" fullWidth loading={isLoading}>
            Sign in
          </Button>
        </form>

        <p className="text-center text-sm text-ink-mute">
          New to Talkarox?{' '}
          <Link to="/register" className="font-semibold text-brand hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}

import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import AuthLayout from '../components/auth/AuthLayout';
import { Input } from '../components/common/Primitives';
import Button from '../components/common/Button';
import { resetPassword } from '../services/api';

const schema = z.object({
  password: z.string().min(8, 'At least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async ({ password }) => {
    if (!token) {
      toast.error('Reset link is invalid or expired');
      return;
    }
    setLoading(true);
    try {
      await resetPassword(token, password);
      toast.success('Password updated! Please sign in.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Set a new password" subtitle="Choose something memorable and secure.">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label="New password" type="password" icon={Lock} placeholder="At least 8 characters" error={errors.password?.message} {...register('password')} />
        <Input label="Confirm password" type="password" icon={Lock} placeholder="Re-enter password" error={errors.confirmPassword?.message} {...register('confirmPassword')} />
        <Button type="submit" fullWidth loading={loading}>Update password</Button>
        <p className="text-center text-sm text-ink-mute">
          <Link to="/login" className="font-semibold text-brand hover:underline">Back to sign in</Link>
        </p>
      </form>
    </AuthLayout>
  );
}

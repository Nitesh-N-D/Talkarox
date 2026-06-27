import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, CheckCircle2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import AuthLayout from '../components/auth/AuthLayout';
import { Input } from '../components/common/Primitives';
import Button from '../components/common/Button';
import { requestPasswordReset } from '../services/api';

const schema = z.object({ email: z.string().email('Enter a valid email address') });

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [emailServiceConfigured, setEmailServiceConfigured] = useState(true);
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async ({ email }) => {
    setLoading(true);
    try {
      const { data } = await requestPasswordReset(email);
      setEmailServiceConfigured(data.emailServiceConfigured !== false);
      setSent(true);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not send reset email');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <AuthLayout title="Check your inbox" subtitle="We've sent password reset instructions.">
        <div className="text-center py-4">
          <CheckCircle2 size={48} className="text-grow-600 mx-auto mb-4" />
          {emailServiceConfigured ? (
            <p className="text-sm text-ink-mute mb-6">
              If an account exists with that email, a reset link is on its way. It may take a minute to arrive.
            </p>
          ) : (
            <p className="text-sm text-ink-mute mb-6">
              Email sending isn't configured on this server yet, so no email will actually arrive. Ask whoever
              set up Talkarox to add a Brevo API key, or reset the password directly from the database for now.
            </p>
          )}
          <Link to="/login" className="text-sm font-semibold text-brand hover:underline">Back to sign in</Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Forgot your password?" subtitle="Enter your email and we'll send you a reset link.">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label="Email" type="email" icon={Mail} placeholder="you@school.edu" error={errors.email?.message} {...register('email')} />
        <Button type="submit" fullWidth loading={loading}>Send reset link</Button>
        <p className="text-center text-sm text-ink-mute">
          <Link to="/login" className="font-semibold text-brand hover:underline">Back to sign in</Link>
        </p>
      </form>
    </AuthLayout>
  );
}

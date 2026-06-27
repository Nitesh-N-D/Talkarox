import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import AuthLayout from '../components/auth/AuthLayout';
import Button from '../components/common/Button';
import { verifyEmail } from '../services/api';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState('loading'); // loading | success | error

  useEffect(() => {
    if (!token) {
      setStatus('error');
      return;
    }
    verifyEmail(token)
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'));
  }, [token]);

  return (
    <AuthLayout title="Email verification" subtitle="">
      <div className="text-center py-6">
        {status === 'loading' && (
          <>
            <Loader2 size={44} className="text-brand mx-auto mb-4 animate-spin" />
            <p className="text-ink-mute">Verifying your email…</p>
          </>
        )}
        {status === 'success' && (
          <>
            <CheckCircle2 size={48} className="text-grow-600 mx-auto mb-4" />
            <h2 className="font-display font-bold text-ink text-lg mb-2">Email verified!</h2>
            <p className="text-sm text-ink-mute mb-6">You're all set. Sign in to continue.</p>
            <Link to="/login"><Button>Sign in</Button></Link>
          </>
        )}
        {status === 'error' && (
          <>
            <XCircle size={48} className="text-danger mx-auto mb-4" />
            <h2 className="font-display font-bold text-ink text-lg mb-2">Verification failed</h2>
            <p className="text-sm text-ink-mute mb-6">This link may have expired. Try signing in to request a new one.</p>
            <Link to="/login"><Button variant="outline">Back to sign in</Button></Link>
          </>
        )}
      </div>
    </AuthLayout>
  );
}

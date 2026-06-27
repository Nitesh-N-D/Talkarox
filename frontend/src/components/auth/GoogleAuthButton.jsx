import { GoogleLogin } from '@react-oauth/google';
import { useAuthStore } from '../../stores/authStore';
import toast from 'react-hot-toast';

export default function GoogleAuthButton({ onSuccess }) {
  const loginWithGoogle = useAuthStore((s) => s.loginWithGoogle);

  return (
    <div className="w-full flex justify-center">
      <GoogleLogin
        onSuccess={async (credentialResponse) => {
          const result = await loginWithGoogle(credentialResponse.credential);
          if (result.success) {
            onSuccess?.(result);
          } else {
            toast.error(result.error);
          }
        }}
        onError={() => toast.error('Google sign-in was cancelled or failed.')}
        theme="outline"
        size="large"
        width="320"
        shape="rectangular"
        text="continue_with"
      />
    </div>
  );
}

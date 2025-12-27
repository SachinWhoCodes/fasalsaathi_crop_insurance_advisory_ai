import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Sprout, Mail, Lock } from 'lucide-react';

export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const success = await login(email, password);
      if (success) {
        toast.success(t('loginSuccess') || 'Login successful!');
        navigate('/');
      } else {
        toast.error(t('loginError') || 'Invalid email or password');
      }
    } catch (error) {
      toast.error(t('loginError') || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="glass-card rounded-2xl p-8 animate-fade-in">
          <div className="flex flex-col items-center mb-8">
            <div className="rounded-full bg-primary/10 p-4 mb-4">
              <Sprout className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-center">
              {t('welcomeBack') || 'Welcome Back'}
            </h1>
            <p className="text-muted-foreground text-center mt-2">
              {t('loginSubtitle') || 'Sign in to continue to FasalSaathi AI'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">{t('email') || 'Email'}</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder={t('enterEmail') || 'Enter your email'}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{t('password') || 'Password'}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder={t('enterPassword') || 'Enter your password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? t('signingIn') || 'Signing in...' : t('signIn') || 'Sign In'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">
              {t('noAccount') || "Don't have an account?"}{' '}
            </span>
            <Link to="/auth/register" className="text-primary hover:underline font-medium">
              {t('signUp') || 'Sign Up'}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

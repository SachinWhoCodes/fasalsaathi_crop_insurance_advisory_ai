import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Sprout, Mail, Lock, User, Phone, MapPin } from 'lucide-react';

export default function Register() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
  });
  const [location, setLocation] = useState<{
    city: string;
    state: string;
    latitude: number;
    longitude: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const handleGetLocation = () => {
    setIsGettingLocation(true);
    
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      setIsGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          // Use reverse geocoding API to get city/state
          const response = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
          );
          const data = await response.json();
          
          setLocation({
            city: data.city || data.locality || 'Unknown',
            state: data.principalSubdivision || 'Unknown',
            latitude,
            longitude,
          });
          toast.success('Location detected successfully!');
        } catch (error) {
          toast.error('Failed to get location details');
        } finally {
          setIsGettingLocation(false);
        }
      },
      (error) => {
        toast.error('Failed to get your location. Please enable location access.');
        setIsGettingLocation(false);
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const success = await register({
        ...formData,
        location: location || undefined,
      });

      if (success) {
        toast.success('Account created successfully!');
        navigate('/');
      } else {
        toast.error('Email already exists');
      }
    } catch (error) {
      toast.error('An error occurred');
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
              {t('createAccount') || 'Create Account'}
            </h1>
            <p className="text-muted-foreground text-center mt-2">
              {t('registerSubtitle') || 'Join FasalSaathi AI today'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">{t('fullName') || 'Full Name'}</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="name"
                  type="text"
                  placeholder={t('enterName') || 'Enter your name'}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">{t('email') || 'Email'}</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder={t('enterEmail') || 'Enter your email'}
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">{t('phone') || 'Phone Number'} ({t('optional') || 'optional'})</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder={t('enterPhone') || 'Enter your phone'}
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="pl-10"
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
                  placeholder={t('enterPassword') || 'Create a password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="pl-10"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t('location') || 'Location'} ({t('optional') || 'optional'})</Label>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleGetLocation}
                disabled={isGettingLocation}
              >
                <MapPin className="h-4 w-4 mr-2" />
                {isGettingLocation
                  ? t('detectingLocation') || 'Detecting...'
                  : location
                  ? `${location.city}, ${location.state}`
                  : t('detectLocation') || 'Detect Location'}
              </Button>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? t('creatingAccount') || 'Creating account...' : t('signUp') || 'Sign Up'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">
              {t('haveAccount') || 'Already have an account?'}{' '}
            </span>
            <Link to="/auth/login" className="text-primary hover:underline font-medium">
              {t('signIn') || 'Sign In'}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

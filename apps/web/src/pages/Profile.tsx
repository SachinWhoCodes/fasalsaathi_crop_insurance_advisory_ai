
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { User, Mail, Phone, MapPin, Save } from 'lucide-react';

export default function Profile() {
  const { t } = useTranslation();
  const { user, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Email change is NOT supported here (Firebase requires re-auth). We keep email read-only.
      await updateProfile({
        name: formData.name,
        phone: formData.phone,
      });
      setIsEditing(false);
      toast.success(t('profileUpdated') || 'Profile updated successfully!');
    } catch {
      toast.error(t('profileUpdateError') || 'Failed to update profile');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="glass-card rounded-2xl p-8 animate-fade-in">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-primary/10 p-4">
                <User className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{t('myProfile') || 'My Profile'}</h1>
                <p className="text-muted-foreground">
                  {t('manageAccount') || 'Manage your account details'}
                </p>
              </div>
            </div>
            {!isEditing && (
              <Button onClick={() => setIsEditing(true)} variant="outline">
                {t('edit') || 'Edit'}
              </Button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">{t('fullName') || 'Full Name'}</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="pl-10"
                  disabled={!isEditing}
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
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="pl-10"
                  disabled
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">{t('phone') || 'Phone Number'}</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="pl-10"
                  disabled={!isEditing}
                />
              </div>
            </div>

            {user?.location && (
              <div className="space-y-2">
                <Label>{t('location') || 'Location'}</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input value={`${user.location.city}, ${user.location.state}`} className="pl-10" disabled />
                </div>
                <p className="text-xs text-muted-foreground">
                  {t('locationNote') || 'Location cannot be changed after registration'}
                </p>
              </div>
            )}

            {isEditing && (
              <div className="flex gap-3 pt-4">
                <Button type="submit" className="flex-1">
                  <Save className="h-4 w-4 mr-2" />
                  {t('saveChanges') || 'Save Changes'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    setFormData({
                      name: user?.name || '',
                      email: user?.email || '',
                      phone: user?.phone || '',
                    });
                  }}
                >
                  {t('cancel') || 'Cancel'}
                </Button>
              </div>
            )}
          </form>

          <div className="mt-8 pt-8 border-t border-border">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">{t('accountInfo') || 'Account Information'}</h3>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>{t('userId') || 'User ID'}: {user?.id}</p>
                  <p>{t('memberSince') || 'Member since'}: {new Date().toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
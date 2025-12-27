import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Sprout, User, LogOut } from 'lucide-react';
import { Button } from './ui/button';
import { LanguageSwitcher } from './LanguageSwitcher';
import { ThemeToggle } from './ThemeToggle';
import { useAuth } from '@/contexts/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

export const Navbar = () => {
  const { t } = useTranslation();
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-bold text-xl">
            <div className="rounded-lg bg-primary p-2">
              <Sprout className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              FasalSaathi AI
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <Link to="/">
              <Button variant="ghost">{t('home')}</Button>
            </Link>
            <Link to="/reports">
              <Button variant="ghost">{t('reports')}</Button>
            </Link>
            <Link to="/insurance">
              <Button variant="ghost">{t('insurance')}</Button>
            </Link>
            <Link to="/applications">
              <Button variant="ghost">{t('applications')}</Button>
            </Link>
            <Link to="/about">
              <Button variant="ghost">{t('about')}</Button>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
            
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="rounded-full">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{user?.name}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="w-full cursor-pointer">
                      <User className="h-4 w-4 mr-2" />
                      {t('profile') || 'Profile'}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={logout} className="cursor-pointer">
                    <LogOut className="h-4 w-4 mr-2" />
                    {t('logout') || 'Logout'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link to="/auth/login">
                <Button variant="outline">{t('login') || 'Login'}</Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

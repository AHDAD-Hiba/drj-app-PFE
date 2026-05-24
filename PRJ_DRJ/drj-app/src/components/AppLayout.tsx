import { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { Brand } from '@/components/Brand';
import { Footer } from '@/components/Footer';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, Building2, LogOut, ChevronDown, Map, FilePlus2, Layers } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export const AppLayout = ({ children }: { children: ReactNode }) => {
  const { t } = useTranslation();
  const { utilisateur, signOut, role, isRegional, isPrefectoral } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: '/saisie',           label: t('nav.entry'),       icon: FilePlus2,      show: isPrefectoral },
    //{ path: '/dashboard',        label: t('nav.overview'),    icon: LayoutDashboard, show: true },
    { path: '/domain-dashboard', label: 'Domaines',           icon: Layers,          show: true },
    { path: '/carte',            label: t('nav.map'),         icon: Map,             show: true },
    { path: '/directions',       label: t('nav.directions'),  icon: Building2,       show: isRegional },
  ];

  const fullName = utilisateur?.nom ?? '';

  const initials = fullName
    .split(' ')
    .map((s: string) => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || '?';

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur border-b border-border">
        <div className="container flex items-center justify-between h-16 gap-4">
          <button onClick={() => navigate('/dashboard')} className="flex-shrink-0">
            <Brand compact />
          </button>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.filter(n => n.show).map(item => {
              const Icon = item.icon;
              const active = location.pathname.startsWith(item.path);
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-smooth ${
                    active
                      ? 'bg-primary-soft text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <LanguageSwitcher variant="minimal" />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2 px-2">
                  <div className="h-8 w-8 rounded-full gradient-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                    {initials}
                  </div>
                  <div className="hidden sm:flex flex-col items-start leading-tight">
                    <span className="text-xs font-semibold">{fullName}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {role ? t(`roles.${role}`) : ''}
                    </span>
                  </div>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground hidden sm:block" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm">{fullName}</span>
                    <span className="text-xs text-muted-foreground font-normal">
                      {utilisateur?.email}
                    </span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut}>
                  <LogOut className="h-4 w-4 me-2" />
                  {t('auth.logout')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Mobile nav */}
        <nav className="md:hidden flex items-center gap-1 px-4 pb-2 overflow-x-auto">
          {navItems.filter(n => n.show).map(item => {
            const Icon = item.icon;
            const active = location.pathname.startsWith(item.path);
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-smooth ${
                  active ? 'bg-primary-soft text-primary' : 'text-muted-foreground bg-muted/50'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {item.label}
              </button>
            );
          })}
        </nav>
      </header>

      <main className="flex-1 container py-6 sm:py-8">{children}</main>

      <Footer />
    </div>
  );
};

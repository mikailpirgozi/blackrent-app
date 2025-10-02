import { User, Lock, Mail, KeyRound, Sparkles, Shield } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { Separator } from '../ui/separator';
import { Typography } from '../ui/typography';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../../context/AuthContext';
import { useAuthError } from '../../hooks/useEnhancedError';
import type { LoginCredentials } from '../../types';
import { EnhancedErrorToast } from '../common/EnhancedErrorToast';

interface LoginFormProps {
  onLoginSuccess?: () => void;
}

export default function LoginForm({ onLoginSuccess }: LoginFormProps) {
  const { login, state } = useAuth();
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState<LoginCredentials>({
    username: '',
    password: '',
  });
  const [rememberMe, setRememberMe] = useState(true); // defaultne zapnuté
  const { error, showError, clearError, executeWithErrorHandling } =
    useAuthError();
  const [showDemo, setShowDemo] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials(prev => ({ ...prev, [name]: value }));
    if (error) clearError();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (!credentials.username || !credentials.password) {
      showError('Prosím zadajte používateľské meno a heslo', {
        action: 'login',
        entity: 'credentials',
      });
      return;
    }

    const success = await executeWithErrorHandling(
      async () => {
        const result = await login(credentials, rememberMe);
        if (!result) {
          throw new Error('Nesprávne používateľské meno alebo heslo');
        }
        return result;
      },
      { action: 'login', entity: 'user' }
    );

    if (success) {
      onLoginSuccess?.();
      // 🚀 DIRECT navigation to /rentals to bypass root redirect timing issue
      window.setTimeout(() => {
        navigate('/rentals');
      }, 100);
    }
  };

  const demoAccounts = [
    {
      username: 'admin',
      label: 'Admin',
      role: 'Administrátor',
      desc: 'Všetky práva',
      password: 'admin123',
      icon: Shield,
      color: 'from-violet-500 to-purple-600',
    },
    {
      username: 'employee',
      label: 'Zamestnanec',
      role: 'Zamestnanec',
      desc: 'Obmedzené práva',
      password: 'employee123',
      icon: User,
      color: 'from-blue-500 to-cyan-600',
    },
    {
      username: 'company1',
      label: 'Firma',
      role: 'Firma',
      desc: 'Iba vlastné dáta',
      password: 'company123',
      icon: Mail,
      color: 'from-emerald-500 to-teal-600',
    },
  ];

  const handleDemoLogin = async (username: string) => {
    const account = demoAccounts.find(acc => acc.username === username);
    if (account) {
      const success = await login(
        { username, password: account.password },
        rememberMe
      );
      if (success) {
        onLoginSuccess?.();
        // 🚀 DIRECT navigation to /rentals to bypass root redirect timing issue
        window.setTimeout(() => {
          navigate('/rentals');
        }, 100);
      }
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 animate-gradient" />
      
      {/* Animated orbs */}
      <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob" />
      <div className="absolute top-0 -right-4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000" />
      <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000" />

      {/* Content */}
      <div className="relative flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md">
          {/* Logo and title section */}
          <div className="text-center mb-8 animate-fade-in">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 mb-4 shadow-lg shadow-blue-500/50">
              <Lock className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">
              BlackRent
            </h1>
            <p className="text-blue-200 text-sm flex items-center justify-center gap-1">
              <Sparkles className="h-4 w-4" />
              Systém správy prenájmu vozidiel
            </p>
          </div>

          {/* Main login card */}
          <Card className="border-0 shadow-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl animate-slide-up">
            <CardContent className="p-8">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-2">
                  Vitajte späť
                </h2>
                <p className="text-slate-600 dark:text-slate-400 text-sm">
                  Prihláste sa do svojho účtu
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Username field */}
                <div className="space-y-2">
                  <Label 
                    htmlFor="username" 
                    className="text-sm font-medium text-slate-700 dark:text-slate-300"
                  >
                    Používateľské meno
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <Input
                      id="username"
                      name="username"
                      type="text"
                      autoComplete="username"
                      autoFocus
                      value={credentials.username}
                      onChange={handleChange}
                      disabled={state.isLoading}
                      required
                      className="pl-10 h-11 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 transition-all"
                      placeholder="Zadajte používateľské meno"
                    />
                  </div>
                </div>

                {/* Password field */}
                <div className="space-y-2">
                  <Label 
                    htmlFor="password" 
                    className="text-sm font-medium text-slate-700 dark:text-slate-300"
                  >
                    Heslo
                  </Label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      value={credentials.password}
                      onChange={handleChange}
                      disabled={state.isLoading}
                      required
                      className="pl-10 h-11 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 transition-all"
                      placeholder="Zadajte heslo"
                    />
                  </div>
                </div>

                {/* Remember me */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="rememberMe"
                      checked={rememberMe}
                      onCheckedChange={(checked: boolean) => setRememberMe(checked)}
                      name="rememberMe"
                      className="border-slate-300 dark:border-slate-600"
                    />
                    <Label 
                      htmlFor="rememberMe" 
                      className="text-sm text-slate-600 dark:text-slate-400 cursor-pointer"
                    >
                      Zapamätať si ma
                    </Label>
                  </div>
                </div>

                {/* Submit button */}
                <Button
                  type="submit"
                  className="w-full h-11 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium shadow-lg shadow-blue-500/50 transition-all duration-200 hover:shadow-xl hover:shadow-blue-500/60 disabled:opacity-50"
                  disabled={state.isLoading}
                >
                  {state.isLoading ? (
                    <span className="flex items-center gap-2">
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Prihlasuje sa...
                    </span>
                  ) : (
                    'Prihlásiť sa'
                  )}
                </Button>
              </form>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white dark:bg-slate-900 px-2 text-slate-500 dark:text-slate-400">
                    Alebo
                  </span>
                </div>
              </div>

              {/* Demo accounts toggle */}
              <div className="text-center">
                <Button 
                  variant="ghost" 
                  onClick={() => setShowDemo(!showDemo)}
                  className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                >
                  {showDemo ? 'Skryť demo účty' : 'Ukázať demo účty'}
                </Button>
              </div>

              {/* Demo accounts */}
              {showDemo && (
                <div className="mt-6 space-y-3 animate-slide-down">
                  <Typography
                    variant="body2"
                    className="mb-3 text-slate-600 dark:text-slate-400 text-center text-sm"
                  >
                    Demo účty pre rýchle prihlásenie:
                  </Typography>
                  <div className="space-y-2">
                    {demoAccounts.map((account) => {
                      const Icon = account.icon;
                      return (
                        <div
                          key={account.username}
                          className="group relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] hover:border-blue-500/50"
                          onClick={() => handleDemoLogin(account.username)}
                        >
                          {/* Gradient hover effect */}
                          <div className={`absolute inset-0 bg-gradient-to-r ${account.color} opacity-0 group-hover:opacity-5 transition-opacity`} />
                          
                          <div className="relative flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg bg-gradient-to-br ${account.color}`}>
                                <Icon className="h-5 w-5 text-white" />
                              </div>
                              <div>
                                <div className="font-semibold text-slate-900 dark:text-white">
                                  {account.label}
                                </div>
                                <div className="text-xs text-slate-500 dark:text-slate-400">
                                  {account.desc}
                                </div>
                                <div className="text-xs text-slate-400 dark:text-slate-500 mt-1 font-mono">
                                  {account.username} / {account.password}
                                </div>
                              </div>
                            </div>
                            <span className={`px-3 py-1 text-xs font-medium bg-gradient-to-r ${account.color} text-white rounded-full`}>
                              {account.role}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="mt-8 text-center space-y-2 animate-fade-in">
            <p className="text-sm text-blue-200">
              © 2024 BlackRent. Všetky práva vyhradené.
            </p>
            {rememberMe && (
              <p className="text-xs text-blue-300/80">
                Prihlásenie zostane aktívne aj po zatvorení prehliadača
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Error Toast */}
      <EnhancedErrorToast
        error={error}
        context={{ action: 'login', location: 'auth' }}
        onClose={clearError}
        position="top"
      />
    </div>
  );
}

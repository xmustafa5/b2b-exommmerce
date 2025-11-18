'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { authApi } from '@/lib/api';
import { useAuth } from '@/providers/auth-provider';

export default function LoginPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { refetch } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const loginMutation = useMutation({
    mutationFn: (data: { email: string; password: string }) => authApi.login(data),
    onSuccess: async (data) => {
      // Store tokens
      localStorage.setItem('accessToken', data.tokens.accessToken);
      localStorage.setItem('refreshToken', data.tokens.refreshToken);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Refetch user data
      await refetch();

      // Redirect based on role
      switch(data.user.role) {
        case 'SUPER_ADMIN':
          router.push('/admin/dashboard');
          break;
        case 'LOCATION_ADMIN':
          router.push('/admin/orders');
          break;
        case 'SHOP_OWNER':
          router.push('/dashboard');
          break;
        default:
          router.push('/');
      }
    },
    onError: (error: any) => {
      setError(error.response?.data?.message || t('loginError'));
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError(t('emailRequired'));
      return;
    }

    loginMutation.mutate({ email, password });
  };

  const handleLanguageChange = (lang: string) => {
    localStorage.setItem('i18nextLng', lang);
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
        {/* Language Selector */}
        <div className="flex justify-end space-x-2">
          <button
            onClick={() => handleLanguageChange('en')}
            className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
          >
            English
          </button>
          <button
            onClick={() => handleLanguageChange('ar')}
            className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
          >
            العربية
          </button>
        </div>

        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {t('signIn')}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            B2B Platform - Baghdad
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                {t('email')}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder={t('email')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                {t('password')}
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder={t('password')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-end">
            <div className="text-sm">
              <a href="/forgot-password" className="font-medium text-indigo-600 hover:text-indigo-500">
                Forgot your password?
              </a>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loginMutation.isPending ? 'Loading...' : t('signIn')}
            </button>
          </div>

          {/* Test Credentials Info */}
          <div className="mt-4 p-4 bg-blue-50 rounded-md">
            <p className="text-sm text-blue-800 font-semibold mb-2">Test Credentials:</p>
            <div className="text-xs text-blue-700 space-y-1">
              <p><strong>Admin:</strong> admin@b2b-platform.com / Admin@123</p>
              <p><strong>Location Admin:</strong> location.admin@b2b-platform.com / LocationAdmin@123</p>
              <p><strong>Shop Owner:</strong> shop1@b2b-platform.com / ShopOwner@123</p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
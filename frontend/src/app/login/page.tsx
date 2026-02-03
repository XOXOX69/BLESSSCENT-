'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Eye, EyeOff, Sparkles } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login } = useAuth();
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setError('');
    try {
      await login(data.email, data.password);
    } catch (err: any) {
      setError(err.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-black relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-yellow-400/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-yellow-500/5 rounded-full blur-2xl" />
        </div>
        
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center items-center w-full p-12">
          <div className="mb-8">
            <div className="w-24 h-24 bg-gradient-to-br from-yellow-400 via-amber-500 to-yellow-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-yellow-500/25 transform rotate-3 hover:rotate-0 transition-transform duration-300">
              <span className="text-black text-5xl font-black">B</span>
            </div>
          </div>
          
          <h1 className="text-5xl font-black text-white mb-4 tracking-tight">
            BLESS<span className="text-yellow-400">CENT</span>
          </h1>
          
          <p className="text-gray-400 text-lg text-center max-w-sm mb-8">
            Premium Perfume Management System
          </p>
          
          <div className="flex items-center gap-2 text-yellow-400/80">
            <Sparkles className="w-5 h-5" />
            <span className="text-sm font-medium">Elevate Your Fragrance Business</span>
            <Sparkles className="w-5 h-5" />
          </div>
          
          {/* Feature highlights */}
          <div className="mt-16 grid grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-yellow-400">500+</div>
              <div className="text-gray-500 text-sm">Products</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-yellow-400">1K+</div>
              <div className="text-gray-500 text-sm">Members</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-yellow-400">99%</div>
              <div className="text-gray-500 text-sm">Uptime</div>
            </div>
          </div>
        </div>

        {/* Decorative corner elements */}
        <div className="absolute top-0 right-0 w-32 h-32 border-t-2 border-r-2 border-yellow-400/20" />
        <div className="absolute bottom-0 left-0 w-32 h-32 border-b-2 border-l-2 border-yellow-400/20" />
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-900 to-black p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex w-16 h-16 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-xl items-center justify-center mb-4">
              <span className="text-black text-3xl font-black">B</span>
            </div>
            <h1 className="text-2xl font-bold text-white">
              BLESS<span className="text-yellow-400">CENT</span>
            </h1>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-8 shadow-2xl">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">Welcome Back</h2>
              <p className="text-gray-400">Sign in to your account</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {error && (
                <div className="p-4 text-sm text-red-400 bg-red-500/10 rounded-xl border border-red-500/20 flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-400 rounded-full" />
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-300 font-medium">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@blesscent.com"
                  className="h-12 bg-gray-900/50 border-gray-600 text-white placeholder:text-gray-500 focus:border-yellow-400 focus:ring-yellow-400/20 rounded-xl"
                  {...register('email')}
                  disabled={isSubmitting}
                />
                {errors.email && (
                  <p className="text-sm text-red-400">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-300 font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="h-12 bg-gray-900/50 border-gray-600 text-white placeholder:text-gray-500 focus:border-yellow-400 focus:ring-yellow-400/20 rounded-xl pr-12"
                    {...register('password')}
                    disabled={isSubmitting}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-yellow-400 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </Button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-400">{errors.password.message}</p>
                )}
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-black font-bold rounded-xl shadow-lg shadow-yellow-500/25 transition-all duration-300 hover:shadow-yellow-500/40" 
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>

            <div className="mt-8 pt-6 border-t border-gray-700/50 text-center">
              <p className="text-gray-500 text-sm">
                Powered by <span className="text-yellow-400 font-medium">BLESSCENT</span>
              </p>
            </div>
          </div>

          <p className="text-center text-gray-600 text-sm mt-6">
            © 2026 BLESSCENT. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}

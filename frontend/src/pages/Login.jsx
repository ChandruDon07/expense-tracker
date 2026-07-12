import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod'; // Wait, let's import it correctly: @hookform/resolvers/zod!
import * as z from 'zod';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Wallet, Mail, Lock, AlertCircle, ArrowRight } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [apiError, setApiError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    }
  });

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    setApiError(null);
    try {
      await login(data.email, data.password);
      navigate('/');
    } catch (err) {
      setApiError(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-premium p-4">
      {/* Glow effects in background */}
      <div className="absolute top-1/4 left-1/4 h-72 w-72 rounded-full bg-primary/10 blur-[100px]"></div>
      <div className="absolute bottom-1/4 right-1/4 h-72 w-72 rounded-full bg-violet-500/10 blur-[100px]"></div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 mb-3">
            <Wallet size={28} />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground bg-gradient-to-r from-primary to-violet-600 bg-clip-text text-transparent">
            WalletIQ
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Smart Personal Finance & Expense Management
          </p>
        </div>

        <div className="glass rounded-3xl p-8 border border-white/20 dark:border-white/5">
          <h2 className="text-2xl font-bold text-foreground mb-6 text-center sm:text-left">
            Welcome Back
          </h2>

          {apiError && (
            <div className="mb-6 flex items-start gap-3 rounded-2xl bg-destructive/10 border border-destructive/20 p-4 text-sm text-destructive">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <span>{apiError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-foreground/80 pl-1" htmlFor="email">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-muted-foreground">
                  <Mail size={18} />
                </div>
                <input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  {...register('email')}
                  className={`
                    w-full pl-11 pr-4 py-3 bg-secondary/50 dark:bg-slate-900/40 border rounded-2xl text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all
                    ${errors.email ? 'border-destructive ring-destructive/20' : 'border-border/60'}
                  `}
                />
              </div>
              {errors.email && (
                <p className="text-xs font-medium text-destructive pl-1">{errors.email.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center px-1">
                <label className="text-sm font-semibold text-foreground/80" htmlFor="password">
                  Password
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-muted-foreground">
                  <Lock size={18} />
                </div>
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  {...register('password')}
                  className={`
                    w-full pl-11 pr-4 py-3 bg-secondary/50 dark:bg-slate-900/40 border rounded-2xl text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all
                    ${errors.password ? 'border-destructive ring-destructive/20' : 'border-border/60'}
                  `}
                />
              </div>
              {errors.password && (
                <p className="text-xs font-medium text-destructive pl-1">{errors.password.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-primary text-primary-foreground font-semibold rounded-2xl shadow-lg shadow-primary/20 hover:scale-[1.01] hover:shadow-primary/35 active:scale-100 disabled:opacity-50 disabled:scale-100 transition-all cursor-pointer mt-6"
            >
              {isSubmitting ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent"></div>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{' '}
              <Link to="/register" className="font-semibold text-primary hover:underline transition-all">
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;

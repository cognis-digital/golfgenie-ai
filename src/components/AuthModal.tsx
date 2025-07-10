import React, { useState } from 'react';
import { X, Mail, Lock, User, Phone, Eye, EyeOff, Loader, Shield, Zap, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { signIn, signUp, resetPassword, isAdminEmail } from '../lib/auth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onAuthSuccess }) => {
  const [mode, setMode] = useState<'signin' | 'signup' | 'reset'>('signin');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [info, setInfo] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    phone: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
    setSuccess('');
    setInfo('');
  };

  const validateForm = () => {
    if (!formData.email || !formData.email.includes('@')) {
      setError('Please enter a valid email address');
      return false;
    }

    if (mode !== 'reset' && (!formData.password || formData.password.length < 6)) {
      setError('Password must be at least 6 characters long');
      return false;
    }

    if (mode === 'signup' && formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    if (mode === 'signup' && !formData.name.trim()) {
      setError('Please enter your name');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    setError('');
    setSuccess('');
    setInfo('');

    try {
      if (mode === 'signin') {
        const { user, error, isAdmin } = await signIn(formData.email, formData.password);
        if (error) {
          setError(error);
        } else if (user) {
          const adminText = isAdmin ? ' (Admin Account)' : '';
          setSuccess(`Successfully signed in!${adminText}`);
          setTimeout(() => {
            onAuthSuccess();
            onClose();
          }, 1000);
        }
      } else if (mode === 'signup') {
        const { user, error, isAdmin, successMessage } = await signUp(formData.email, formData.password, formData.name);
        if (error) {
          setError(error);
        } else {
          const message = successMessage || `Account created!${isAdmin ? ' Admin account created!' : ''}`;
          setSuccess(message);
          
          // If email confirmation is required, show info message and switch to signin after delay
          if (user && !user.email_confirmed_at) {
            setInfo('Please check your email (including spam folder) for a confirmation link before signing in.');
            setTimeout(() => {
              setMode('signin');
              setSuccess('');
              setInfo('');
            }, 5000);
          } else {
            // If no email confirmation needed, switch to signin mode
            setTimeout(() => {
              setMode('signin');
              setSuccess('');
            }, 3000);
          }
        }
      } else if (mode === 'reset') {
        const { error } = await resetPassword(formData.email);
        if (error) {
          setError(error);
        } else {
          setSuccess('Password reset email sent! Check your inbox and spam folder.');
          setTimeout(() => {
            setMode('signin');
            setSuccess('');
          }, 3000);
        }
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      confirmPassword: '',
      name: '',
      phone: ''
    });
    setError('');
    setSuccess('');
    setInfo('');
  };

  const switchMode = (newMode: 'signin' | 'signup' | 'reset') => {
    setMode(newMode);
    resetForm();
  };

  const fillDemoCredentials = () => {
    setFormData({
      ...formData,
      email: 'admin@mbg.com',
      password: 'password'
    });
    setError('');
    setSuccess('');
    setInfo('');
  };

  const createAdminAccount = () => {
    setFormData({
      email: 'admin@mbg.com',
      password: 'password',
      confirmPassword: 'password',
      name: 'Admin User',
      phone: ''
    });
    setMode('signup');
    setError('');
    setSuccess('');
    setInfo('');
  };

  const isAdminSignup = mode === 'signup' && isAdminEmail(formData.email);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <h2 className="text-2xl font-bold text-gray-900">
                {mode === 'signin' && 'Welcome Back'}
                {mode === 'signup' && 'Create Account'}
                {mode === 'reset' && 'Reset Password'}
              </h2>
              {isAdminSignup && (
                <div className="bg-amber-100 text-amber-800 px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1">
                  <Shield className="h-3 w-3" />
                  <span>Admin</span>
                </div>
              )}
            </div>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Demo Credentials Button */}
          {mode === 'signin' && (
            <div className="mb-4">
              <button
                onClick={fillDemoCredentials}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-3 px-4 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg"
              >
                <Zap className="h-4 w-4" />
                <span>Fill Demo Admin Credentials</span>
              </button>
              <p className="text-xs text-gray-500 text-center mt-2">
                Email: admin@mbg.com | Password: password
              </p>
            </div>
          )}

          {/* Create Admin Account Button */}
          {mode === 'signin' && error.includes('Admin account not found') && (
            <div className="mb-4">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg mb-3">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
                  <div className="text-sm text-amber-800">
                    <p className="font-medium">Admin Account Required</p>
                    <p className="text-xs mt-1">
                      The admin account doesn't exist yet. Create it first to access admin features.
                    </p>
                  </div>
                </div>
              </div>
              <button
                onClick={createAdminAccount}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white py-3 px-4 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg"
              >
                <Shield className="h-4 w-4" />
                <span>Create Admin Account</span>
              </button>
            </div>
          )}

          {/* Admin Notice */}
          {isAdminSignup && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-sm">
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4" />
                <span className="font-medium">Admin Account Detected</span>
              </div>
              <p className="mt-1">You're creating an admin account with full system access.</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg text-sm flex items-start space-x-2">
              <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* Info Message */}
          {info && (
            <div className="mb-4 p-3 bg-blue-100 border border-blue-400 text-blue-700 rounded-lg text-sm flex items-start space-x-2">
              <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>{info}</span>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm flex items-start space-x-2">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Email Confirmation Help */}
          {error.includes('confirmation link') && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start space-x-2">
                <Mail className="h-4 w-4 text-yellow-600 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium">Email Confirmation Required</p>
                  <ul className="text-xs mt-1 space-y-1">
                    <li>• Check your email inbox for a confirmation message</li>
                    <li>• Look in your spam/junk folder if you don't see it</li>
                    <li>• Click the confirmation link in the email</li>
                    <li>• Then return here to sign in</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Field (Sign Up Only) */}
            {mode === 'signup' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Enter your full name"
                    required
                  />
                </div>
              </div>
            )}

            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address *
                {mode === 'signup' && (
                  <span className="text-xs text-gray-500 ml-2">
                    (Use @mbg.com or @mbg for admin access)
                  </span>
                )}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Enter your email"
                  required
                />
                {isAdminSignup && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <Shield className="h-5 w-5 text-amber-600" />
                  </div>
                )}
              </div>
            </div>

            {/* Phone Field (Sign Up Only) */}
            {mode === 'signup' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>
            )}

            {/* Password Field */}
            {mode !== 'reset' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            )}

            {/* Confirm Password Field (Sign Up Only) */}
            {mode === 'signup' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Confirm your password"
                    required
                  />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full ${
                isAdminSignup 
                  ? 'bg-amber-600 hover:bg-amber-700' 
                  : 'bg-emerald-600 hover:bg-emerald-700'
              } disabled:bg-gray-400 text-white py-3 px-4 rounded-lg font-semibold transition-colors duration-200 flex items-center justify-center space-x-2`}
            >
              {isLoading && <Loader className="h-4 w-4 animate-spin" />}
              {isAdminSignup && <Shield className="h-4 w-4" />}
              <span>
                {mode === 'signin' && (isLoading ? 'Signing In...' : 'Sign In')}
                {mode === 'signup' && (isLoading ? 'Creating Account...' : isAdminSignup ? 'Create Admin Account' : 'Create Account')}
                {mode === 'reset' && (isLoading ? 'Sending Email...' : 'Send Reset Email')}
              </span>
            </button>
          </form>

          {/* Mode Switching */}
          <div className="mt-6 text-center space-y-2">
            {mode === 'signin' && (
              <>
                <p className="text-sm text-gray-600">
                  Don't have an account?{' '}
                  <button
                    onClick={() => switchMode('signup')}
                    className="text-emerald-600 hover:text-emerald-700 font-medium"
                  >
                    Sign up
                  </button>
                </p>
                <p className="text-sm text-gray-600">
                  Forgot your password?{' '}
                  <button
                    onClick={() => switchMode('reset')}
                    className="text-emerald-600 hover:text-emerald-700 font-medium"
                  >
                    Reset it
                  </button>
                </p>
              </>
            )}

            {mode === 'signup' && (
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <button
                  onClick={() => switchMode('signin')}
                  className="text-emerald-600 hover:text-emerald-700 font-medium"
                >
                  Sign in
                </button>
              </p>
            )}

            {mode === 'reset' && (
              <p className="text-sm text-gray-600">
                Remember your password?{' '}
                <button
                  onClick={() => switchMode('signin')}
                  className="text-emerald-600 hover:text-emerald-700 font-medium"
                >
                  Sign in
                </button>
              </p>
            )}
          </div>

          {/* Admin Info */}
          {mode === 'signup' && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start space-x-2">
                <Shield className="h-4 w-4 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium">Admin Account Access</p>
                  <p className="text-xs mt-1">
                    Use an @mbg.com or @mbg email address to create an admin account with full system privileges.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Development Note */}
          <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="flex items-start space-x-2">
              <Info className="h-4 w-4 text-gray-600 mt-0.5" />
              <div className="text-xs text-gray-600">
                <p className="font-medium">Development Note</p>
                <p className="mt-1">
                  If you encounter email confirmation issues, you can disable email confirmations in your Supabase project settings under Authentication → Settings.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
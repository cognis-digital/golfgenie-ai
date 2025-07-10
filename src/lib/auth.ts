import { supabase, isSupabaseConfigured, testSupabaseConnection } from './supabase';
import type { User } from '@supabase/supabase-js';

export interface AuthUser extends User {
  // Add any additional user properties if needed
}

export const getCurrentUser = async (): Promise<AuthUser | null> => {
  if (!isSupabaseConfigured) {
    console.warn('Supabase not configured - returning null user');
    return null;
  }

  try {
    // Test connection first with improved error handling
    const connectionTest = await testSupabaseConnection();
    if (!connectionTest.success) {
      console.warn('Supabase connection failed, using offline mode:', connectionTest.error);
      return null;
    }

    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      if (error.message === 'Auth session missing!') {
        console.warn('Auth session missing - user not authenticated');
      } else {
        console.warn('Error getting current user:', error.message);
      }
      return null;
    }
    return user as AuthUser;
  } catch (error: any) {
    console.warn('Error in getCurrentUser:', error.message);
    return null;
  }
};

export const isAdminEmail = (email: string): boolean => {
  if (!email) return false;
  const adminDomains = ['@mbg.com', '@mbg'];
  return adminDomains.some(domain => email.toLowerCase().endsWith(domain));
};

export const isCurrentUserAdmin = (user: User | null): boolean => {
  if (!user || !user.email) return false;
  return isAdminEmail(user.email);
};

export const signIn = async (email: string, password: string) => {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not properly configured. Please check your environment variables.');
  }

  try {
    // Test connection first with improved error handling
    const connectionTest = await testSupabaseConnection();
    if (!connectionTest.success) {
      throw new Error(`Database connection failed: ${connectionTest.error}`);
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      let errorMessage = error.message;
      
      // Handle specific error cases with user-friendly messages
      if (error.message === 'Invalid login credentials') {
        if (email === 'admin@mbg.com') {
          errorMessage = 'Admin account not found. Please create the admin account first by clicking "Create Admin Account" below.';
        } else {
          errorMessage = 'Invalid email or password. Please check your credentials and try again.';
        }
      } else if (error.message === 'Email not confirmed') {
        errorMessage = 'Please check your email and click the confirmation link before signing in. Check your spam folder if you don\'t see the email.';
      } else if (error.message.includes('email_not_confirmed')) {
        errorMessage = 'Please check your email and click the confirmation link before signing in. Check your spam folder if you don\'t see the email.';
      }
      
      return { user: null, error: errorMessage, isAdmin: false };
    }

    const isAdmin = data.user ? isCurrentUserAdmin(data.user) : false;
    return { user: data.user, error: null, isAdmin };
  } catch (error: any) {
    console.error('Sign in error:', error);
    return { user: null, error: error.message || 'An unexpected error occurred', isAdmin: false };
  }
};

export const signUp = async (email: string, password: string, name: string) => {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not properly configured. Please check your environment variables.');
  }

  try {
    // Test connection first with improved error handling
    const connectionTest = await testSupabaseConnection();
    if (!connectionTest.success) {
      throw new Error(`Database connection failed: ${connectionTest.error}`);
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name,
        },
        // For admin accounts, we can try to skip email confirmation in development
        emailRedirectTo: undefined
      }
    });

    if (error) {
      let errorMessage = error.message;
      
      // Handle specific signup errors
      if (error.message.includes('User already registered')) {
        errorMessage = 'An account with this email already exists. Please sign in instead or use a different email address.';
      }
      
      return { user: null, error: errorMessage, isAdmin: false };
    }

    const isAdmin = data.user ? isCurrentUserAdmin(data.user) : false;
    
    // Provide different success messages based on account type and confirmation status
    let successMessage = 'Account created successfully!';
    if (isAdmin) {
      successMessage = 'Admin account created successfully!';
    }
    
    // Check if email confirmation is required
    if (data.user && !data.user.email_confirmed_at) {
      successMessage += ' Please check your email for a confirmation link before signing in.';
    }
    
    return { user: data.user, error: null, isAdmin, successMessage };
  } catch (error: any) {
    console.error('Sign up error:', error);
    return { user: null, error: error.message || 'An unexpected error occurred', isAdmin: false };
  }
};

export const resetPassword = async (email: string) => {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not properly configured. Please check your environment variables.');
  }

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    
    if (error) {
      let errorMessage = error.message;
      
      // Handle specific reset password errors
      if (error.message.includes('User not found')) {
        errorMessage = 'No account found with this email address. Please check the email or create a new account.';
      }
      
      return { error: errorMessage };
    }

    return { error: null };
  } catch (error: any) {
    console.error('Reset password error:', error);
    return { error: error.message || 'An unexpected error occurred' };
  }
};

export const updateProfile = async (profileData: { name: string; phone: string }) => {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not properly configured. Please check your environment variables.');
  }

  try {
    const { error } = await supabase.auth.updateUser({
      data: {
        name: profileData.name,
        phone: profileData.phone,
      }
    });

    if (error) {
      return { error: error.message };
    }

    return { error: null };
  } catch (error: any) {
    console.error('Update profile error:', error);
    return { error: error.message || 'An unexpected error occurred' };
  }
};

export const signOut = async () => {
  if (!isSupabaseConfigured) {
    console.warn('Supabase not configured - cannot sign out');
    return;
  }

  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Sign out error:', error);
    throw error;
  }
};

export const onAuthStateChange = (callback: (user: AuthUser | null) => void) => {
  if (!isSupabaseConfigured) {
    console.warn('Supabase not configured - auth state changes will not be tracked');
    callback(null);
    return { data: { subscription: { unsubscribe: () => {} } } };
  }

  return supabase.auth.onAuthStateChange((event, session) => {
    callback(session?.user as AuthUser || null);
  });
};
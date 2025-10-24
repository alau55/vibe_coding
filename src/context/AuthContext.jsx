import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active session on mount
    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event);

        if (session?.user) {
          setUser(session.user);
          await fetchUserProfile(session.user.id);
        } else {
          setUser(null);
          setUserProfile(null);
        }

        setLoading(false);
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const checkSession = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) throw error;

      if (session?.user) {
        setUser(session.user);
        await fetchUserProfile(session.user.id);
      }
    } catch (error) {
      console.error('Error checking session:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setUserProfile(data);
    } catch (error) {
      console.error('Error fetching user profile:', error.message);
    }
  };

  const signUp = async (email, password, fullName) => {
    try {
      // Sign up the user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) throw error;

      // The trigger will automatically create the user profile
      toast.success('Account created successfully! Please check your email for verification.');

      return { data, error: null };
    } catch (error) {
      console.error('Error signing up:', error.message);
      toast.error(error.message || 'Failed to create account');
      return { data: null, error };
    }
  };

  const signIn = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast.success('Welcome back!');
      return { data, error: null };
    } catch (error) {
      console.error('Error signing in:', error.message);
      toast.error(error.message || 'Failed to sign in');
      return { data: null, error };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setUser(null);
      setUserProfile(null);
      toast.success('Signed out successfully');
    } catch (error) {
      console.error('Error signing out:', error.message);
      toast.error('Failed to sign out');
    }
  };

  const value = {
    user,
    userProfile,
    loading,
    signUp,
    signIn,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

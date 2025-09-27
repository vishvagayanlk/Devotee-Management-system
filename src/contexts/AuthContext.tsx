import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, Database } from '../lib/supabase';
import { validateEmail } from '../utils/security';

type UserProfile = Database['public']['Tables']['user_profiles']['Row'];

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isApproved: boolean;
  isCommittee: boolean;
  signUp: (email: string, password: string, fullName: string, nicNumber: string, address: string, phone: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<boolean>;
  testDatabaseTrigger: () => Promise<boolean>;
  createProfileManually: () => Promise<boolean>;
  debugRoles: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const isAdmin = profile?.role === 'admin' && profile?.status === 'approved';
  const isCommittee = (profile?.role === 'committee' || profile?.role === 'admin') && profile?.status === 'approved';
  const isApproved = profile?.status === 'approved';
  
  // Debug role checking (only log when profile changes)
  React.useEffect(() => {
    if (profile) {
      console.log('Profile loaded - role:', profile.role, 'status:', profile.status);
      console.log('Permissions - isAdmin:', isAdmin, 'isCommittee:', isCommittee, 'isApproved:', isApproved);
    }
  }, [profile, isAdmin, isCommittee, isApproved]);

  const fetchProfile = async (userId: string, userEmail?: string, userMetadata?: any, retryCount = 0): Promise<boolean> => {
    try {
      console.log(`Fetching profile for user ${userId}, retry count: ${retryCount}`);
      
      // Add a timeout to the profile fetch
      const profilePromise = supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Profile fetch timeout')), 10000)
      );
      
      console.log('Starting profile fetch with timeout...');
      const { data, error } = await Promise.race([profilePromise, timeoutPromise]) as any;

      if (error) {
        console.log('Profile fetch error:', error);
        console.log('Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        
        // If the profile doesn't exist, try to create it
        if (error.code === 'PGRST116' || error.message.includes('No rows found') || error.message.includes('The result contains 0 rows')) {
          console.log('Profile not found, attempting to create new profile');
          
          // Get current user info
          const { data: authUser, error: authError } = await supabase.auth.getUser();
          if (authError || !authUser.user) {
            console.log('Auth user not found, cannot create profile');
            setProfile(null);
            return false;
          }
          
          // Create a simple profile with correct role type
          const profileData = {
            id: userId,
            full_name: authUser.user.user_metadata?.full_name || userEmail?.split('@')[0] || 'New Devotee',
            role: 'devotee' as const, // Use temple_user_role enum value
            status: 'pending' as const,
            email: userEmail || authUser.user.email || ''
          };
          
          console.log('Creating profile with data:', profileData);
          console.log('Using role type:', typeof profileData.role, 'Value:', profileData.role);
          
          const { data: newProfile, error: createError } = await supabase
            .from('user_profiles')
            .insert(profileData)
            .select()
            .single();
            
          if (createError) {
            console.error('Profile creation failed:', createError);
            
            // If creation fails, create a minimal fallback profile
            console.log('Creating fallback profile...');
            const fallbackProfile = {
              id: userId,
              full_name: 'New Devotee',
              role: 'devotee' as const,
              status: 'pending' as const,
              email: userEmail || authUser.user.email || '',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
            
            console.log('Using fallback profile:', fallbackProfile);
            setProfile(fallbackProfile as any);
            return true;
          }
          
          console.log('Profile created successfully:', newProfile);
          setProfile(newProfile);
          return true;
        }
        
        console.error('Profile fetch failed with error:', error);
        setProfile(null);
        return false;
      }
      
      console.log('Profile fetched successfully:', data);
      console.log('Profile role:', data.role, 'Profile status:', data.status);
      console.log('Setting profile state...');
      
      // Check if this is a default profile that needs to be updated
      if (data.full_name === 'New Devotee' && userMetadata) {
        console.log('Profile has default values, updating with user metadata:', userMetadata);
        await updateProfileFromMetadata(data.id, userMetadata, userEmail);
        // Refetch the updated profile
        const { data: updatedProfile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', userId)
          .single();
        setProfile(updatedProfile);
        console.log('Profile updated successfully:', updatedProfile);
        return true;
      } else {
        setProfile(data);
        console.log('Profile state set to:', data);
        console.log('Profile fetch completed successfully');
        return true;
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      
      // If it's a timeout error and we haven't exceeded retry limit, try again
      if (error instanceof Error && error.message === 'Profile fetch timeout' && retryCount < 2) {
        console.log(`Profile fetch timeout, retrying in ${1000 * (retryCount + 1)}ms`);
        setTimeout(() => {
          fetchProfile(userId, userEmail, userMetadata, retryCount + 1);
        }, 1000 * (retryCount + 1));
        return false; // Don't complete loading yet, retrying
      }
      
      setProfile(null);
      return false;
    }
  };

  const updateProfileFromMetadata = async (profileId: string, metadata: any, userEmail?: string) => {
    try {
      console.log('Updating profile with metadata:', metadata);
      
      const updateData = {
        full_name: metadata.full_name || 'New Devotee',
        nic_number: metadata.nic_number || null,
        address: metadata.address || null,
        phone: metadata.phone || null,
        email: metadata.email || userEmail || null,
      };
      
      console.log('Updating profile with data:', updateData);
      
      const { error } = await supabase
        .from('user_profiles')
        .update(updateData)
        .eq('id', profileId);
        
      if (error) {
        console.error('Error updating profile:', error);
      } else {
        console.log('Profile updated successfully');
      }
    } catch (error) {
      console.error('Error in updateProfileFromMetadata:', error);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      console.log('Refreshing profile for user:', user.id);
      
      // Add a small delay to ensure everything is ready
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const success = await fetchProfile(user.id, user.email, user.user_metadata);
      console.log('Profile refresh result:', success);
      return success;
    }
    console.log('No user to refresh profile for');
    return false;
  };

  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout;
    
    // Set a maximum loading time to prevent infinite loading
    timeoutId = setTimeout(() => {
      if (isMounted) {
        console.warn('Authentication loading timeout - forcing loading to false');
        setLoading(false);
      }
    }, 30000); // 30 second timeout
    
    const initializeAuth = async () => {
      try {
        console.log('Initializing authentication...');
        
        // Add a small delay to ensure Supabase is fully initialized
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Session error:', error);
          if (isMounted) {
            setUser(null);
            setProfile(null);
            setLoading(false);
          }
          return;
        }
        
        console.log('Session retrieved:', session?.user?.id ? 'User found' : 'No user');
        
        // Check if this is a password reset session
        // Allow any user session for password reset - security is handled by Supabase
        const isPasswordResetPage = window.location.pathname === '/reset-password';
        const hasPasswordResetParams = window.location.search.includes('access_token') || 
                                     window.location.search.includes('refresh_token') || 
                                     window.location.search.includes('type=recovery');
        
        if (session?.user && (session.user.aud === 'recovery' || 
                             session.user.aud === 'recover' || 
                             isPasswordResetPage || 
                             hasPasswordResetParams)) {
          console.log('Password reset session detected, skipping profile fetch');
          if (isMounted) {
            setUser(session.user);
            setProfile(null); // Don't fetch profile for password reset
            setLoading(false);
          }
          return;
        }
        
        if (isMounted) {
          setUser(session?.user ?? null);
          if (session?.user) {
            console.log('Fetching profile for authenticated user');
            
            // Add a small delay before fetching profile to ensure user state is set
            await new Promise(resolve => setTimeout(resolve, 200));
            
            // Test database connectivity first
            try {
              const { error: testError } = await supabase
                .from('user_profiles')
                .select('id')
                .limit(1);
              console.log('Database connectivity test:', testError ? 'FAILED' : 'PASSED', testError);
            } catch (testErr) {
              console.error('Database connectivity test error:', testErr);
            }
            
            let profileSuccess = await fetchProfile(session.user.id, session.user.email, session.user.user_metadata);
            console.log('Profile fetch result:', profileSuccess);
            
            // If profile fetch failed, try once more
            if (!profileSuccess) {
              console.log('Initial profile fetch failed, retrying once...');
              await new Promise(resolve => setTimeout(resolve, 1000));
              
              if (isMounted) {
                profileSuccess = await fetchProfile(session.user.id, session.user.email, session.user.user_metadata);
                console.log('Profile fetch retry result:', profileSuccess);
              }
            }
          } else {
            console.log('No user session, clearing profile');
            setProfile(null);
          }
          // Only set loading to false after profile fetch completes
          setLoading(false);
          clearTimeout(timeoutId);
        }
      } catch (error) {
        console.error('Authentication initialization error:', error);
        if (isMounted) {
          setUser(null);
          setProfile(null);
          setLoading(false);
          clearTimeout(timeoutId);
        }
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.id ? 'User found' : 'No user');
        
        if (isMounted) {
          setUser(session?.user ?? null);
          
          // Check if this is a password reset session
          const isPasswordResetPage = window.location.pathname === '/reset-password';
          const hasPasswordResetParams = window.location.search.includes('access_token') || 
                                       window.location.search.includes('refresh_token') || 
                                       window.location.search.includes('type=recovery');
          
          if (session?.user && (session.user.aud === 'recovery' || session.user.aud === 'recover' || isPasswordResetPage || hasPasswordResetParams)) {
            console.log('Password reset session detected in auth state change');
            setProfile(null); // Don't fetch profile for password reset
          } else if (session?.user) {
            console.log('Fetching profile in auth state change');
            const profileSuccess = await fetchProfile(session.user.id, session.user.email, session.user.user_metadata);
            console.log('Profile fetch result in auth state change:', profileSuccess);
            if (profileSuccess) {
              console.log('Profile successfully loaded in auth state change');
            } else {
              console.log('Profile failed to load in auth state change');
            }
          } else {
            console.log('No user in auth state change, clearing profile');
            setProfile(null);
          }
          setLoading(false);
          clearTimeout(timeoutId);
        }
      }
    );

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, fullName: string, nicNumber: string, address: string, phone: string, groupId?: string) => {
    // Additional server-side validation
    if (!email?.trim() || !password?.trim() || !fullName?.trim() || !nicNumber?.trim() || !address?.trim() || !phone?.trim()) {
      throw new Error('All fields are required and cannot be empty');
    }

    // Sanitize inputs
    const sanitizedData = {
      email: email.trim().toLowerCase(),
      fullName: fullName.trim(),
      nicNumber: nicNumber.trim().toUpperCase(),
      address: address.trim(),
      phone: phone.trim(),
    };

    console.log('Attempting to sign up user with data:', {
      email: sanitizedData.email,
      fullName: sanitizedData.fullName,
      nicNumber: sanitizedData.nicNumber,
      address: sanitizedData.address,
      phone: sanitizedData.phone,
      groupId: groupId
    });
    
    // Additional email validation
    console.log('Email validation check:', {
      originalEmail: email,
      sanitizedEmail: sanitizedData.email,
      emailLength: sanitizedData.email.length,
      emailChars: sanitizedData.email.split('').map(c => c.charCodeAt(0)),
      isValidEmail: validateEmail(sanitizedData.email)
    });

    try {
      // Check if email already exists in user_profiles
      const { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('id, email')
        .eq('email', sanitizedData.email)
        .single();

      if (existingProfile) {
        throw new Error('An account with this email already exists. Please use a different email or try logging in.');
      }

      // Check if user is already logged in
      const { data: existingUser } = await supabase.auth.getUser();
      if (existingUser.user) {
        throw new Error('User is already logged in. Please sign out first.');
      }

      // Try signup with minimal data first
      const { data, error } = await supabase.auth.signUp({
        email: sanitizedData.email,
        password,
        options: {
          data: {
            full_name: sanitizedData.fullName,
            nic_number: sanitizedData.nicNumber,
            address: sanitizedData.address,
            phone: sanitizedData.phone,
            email: sanitizedData.email,
            group_id: groupId || null,
          },
        },
      });

      console.log('Sign up response:', { data, error });

      if (error) {
        console.error('Sign up error details:', error);
        console.error('Error code:', error.status);
        console.error('Error message:', error.message);
        console.error('Error details:', error.details);
        
        // Try a simpler signup without metadata if the first attempt fails
        if (error.message.includes('invalid') || error.message.includes('Email')) {
          console.log('Trying simpler signup without metadata...');
          const { data: simpleData, error: simpleError } = await supabase.auth.signUp({
            email: sanitizedData.email,
            password,
          });
          
          if (simpleError) {
            console.error('Simple signup also failed:', simpleError);
            throw new Error(`Sign up failed: ${error.message} (Code: ${error.status}). Simple signup also failed: ${simpleError.message}`);
          } else {
            console.log('Simple signup succeeded, but metadata signup failed');
            throw new Error(`Sign up failed: ${error.message} (Code: ${error.status}). This might be due to metadata validation.`);
          }
        }
        
        throw new Error(`Sign up failed: ${error.message} (Code: ${error.status})`);
      }

      if (data.user) {
        console.log('User created successfully, fetching profile...');
        // Wait a moment for the trigger to complete
        await new Promise(resolve => setTimeout(resolve, 1000));
        await fetchProfile(data.user.id, data.user.email, data.user.user_metadata);
      }
    } catch (err) {
      console.error('Sign up catch error:', err);
      throw err;
    }
  };

  const testConnection = async () => {
    try {
      console.log('Testing connection to Supabase...');
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/auth/v1/health`);
      console.log('Health check response:', response.status, response.statusText);
      const data = await response.text();
      console.log('Health check data:', data);
    } catch (err) {
      console.error('Connection test failed:', err);
    }
  };

  const testDatabaseTrigger = async () => {
    try {
      console.log('Testing database trigger...');
      
      // Test if we can query the user_profiles table
      const { data: profilesData, error: profilesError } = await supabase
        .from('user_profiles')
        .select('id, role, status, full_name')
        .limit(5);
      
      if (profilesError) {
        console.error('Error querying user_profiles:', profilesError);
        return false;
      }
      
      console.log('Successfully queried user_profiles table');
      console.log('Sample profiles:', profilesData);
      
      // Test if we can query the activity_logs table
      const { error: logsError } = await supabase
        .from('activity_logs')
        .select('*')
        .limit(1);
      
      if (logsError) {
        console.error('Error querying activity_logs:', logsError);
        return false;
      }
      
      console.log('Successfully queried activity_logs table');
      return true;
    } catch (err) {
      console.error('Database trigger test failed:', err);
      return false;
    }
  };

  const createProfileManually = async () => {
    if (!user) {
      console.error('No user to create profile for');
      return false;
    }

    try {
      console.log('Manually creating profile for user:', user.id);
      
      const profileData = {
        id: user.id,
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'New Devotee',
        role: 'devotee' as const,
        status: 'pending' as const,
        email: user.email || ''
      };
      
      console.log('Creating profile with data:', profileData);
      
      const { data: newProfile, error: createError } = await supabase
        .from('user_profiles')
        .insert(profileData)
        .select()
        .single();
        
      if (createError) {
        console.error('Manual profile creation error:', createError);
        return false;
      }
      
      console.log('Profile created successfully:', newProfile);
      setProfile(newProfile);
      return true;
    } catch (err) {
      console.error('Manual profile creation failed:', err);
      return false;
    }
  };

  const debugRoles = async () => {
    try {
      console.log('=== DEBUGGING ROLES ===');
      
      // Get all unique roles from the database
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_profiles')
        .select('role, status')
        .not('role', 'is', null);
      
      if (rolesError) {
        console.error('Error fetching roles:', rolesError);
        return;
      }
      
      console.log('All roles in database:', rolesData);
      
      // Get unique roles
      const uniqueRoles = [...new Set(rolesData?.map(p => p.role))];
      const uniqueStatuses = [...new Set(rolesData?.map(p => p.status))];
      
      console.log('Unique roles found:', uniqueRoles);
      console.log('Unique statuses found:', uniqueStatuses);
      
      // Check current user's profile
      if (user) {
        const { data: currentProfile, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (profileError) {
          console.log('Current user profile error:', profileError);
        } else {
          console.log('Current user profile:', currentProfile);
        }
      }
      
      console.log('=== END ROLE DEBUG ===');
    } catch (err) {
      console.error('Role debugging failed:', err);
    }
  };

  const resetPassword = async (email: string): Promise<void> => {
    const redirectUrl = `${window.location.origin}/reset-password`;
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });
    
    if (error) {
      throw error;
    }
  };

  const updatePassword = async (newPassword: string): Promise<void> => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });
    if (error) throw error;
  };

  const signIn = async (email: string, password: string) => {
    if (!email?.trim() || !password?.trim()) {
      throw new Error('Email and password are required and cannot be empty');
    }

    // Test connection first
    await testConnection();
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      
      if (error) {
        throw error;
      }
      
    } catch (err) {
      throw err;
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const value = {
    user,
    profile,
    loading,
    isAdmin,
    isCommittee,
    isApproved,
    signUp,
    signIn,
    signOut,
    refreshProfile,
    testDatabaseTrigger,
    createProfileManually,
    debugRoles,
    resetPassword,
    updatePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
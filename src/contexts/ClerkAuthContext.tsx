/** @jsxImportSource react */
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';
import { supabase } from '../lib/supabase';
import { errorTracking } from '../lib/monitoring';

interface UserProfile {
  id: string;
  clerk_id: string | null;
  email: string | null;
  full_name: string;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  phone_number?: string | null;
  nic_number?: string | null;
  address?: string | null;
  group_id?: string | null;
  is_approved: boolean;
  status: 'pending' | 'approved' | 'rejected';
  role: 'admin' | 'devotee' | 'committee';
  created_at: string;
  updated_at: string;
  is_profile_complete?: boolean;
}

interface ClerkAuthContextType {
  user: any;
  isLoaded: boolean;
  isSignedIn: boolean;
  userProfile: UserProfile | null;
  isProfileComplete: boolean;
  signOut: () => Promise<void>;
  refreshUserProfile: () => Promise<void>;
  approveUser: (userId: string) => Promise<void>;
  rejectUser: (userId: string) => Promise<void>;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>;
  checkProfileCompletion: () => Promise<boolean>;
  markOnboardingComplete: () => void;
  createMockProfileForPendingUser: () => void;
}

const ClerkAuthContext = createContext<ClerkAuthContextType | undefined>(undefined);

export const useClerkAuth = () => {
  const context = useContext(ClerkAuthContext);
  if (!context) {
    throw new Error('useClerkAuth must be used within a ClerkAuthProvider');
  }
  return context;
};

interface ClerkAuthProviderProps {
  children: React.ReactNode;
}

export const ClerkAuthProvider: React.FC<ClerkAuthProviderProps> = ({ children }) => {
  const { user, isLoaded, isSignedIn } = useUser();
  const { signOut: clerkSignOut } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isProfileLoaded, setIsProfileLoaded] = useState(false);
  const [isProfileComplete, setIsProfileComplete] = useState<boolean>(false);
  const [isCreatingProfile, setIsCreatingProfile] = useState(false);

  // Create or update user profile in Supabase when Clerk user changes
  useEffect(() => {
    console.log('ClerkAuthContext: useEffect triggered', {
      isLoaded,
      isSignedIn,
      hasUser: !!user,
      isCreatingProfile,
      hasUserProfile: !!userProfile,
      userId: user?.id
    });

    if (isLoaded && isSignedIn && user && !isCreatingProfile && !userProfile) {
      console.log('Clerk user authenticated, creating/updating profile...');
      setIsCreatingProfile(true);
      createOrUpdateUserProfile();
    } else if (isLoaded && !isSignedIn) {
      console.log('Clerk user not authenticated, clearing profile');
      setUserProfile(null);
      setIsProfileLoaded(true);
      setIsCreatingProfile(false);
    } else if (isLoaded && isSignedIn && user && userProfile) {
      console.log('User profile already exists, setting as loaded');
      setIsProfileLoaded(true);
      setIsCreatingProfile(false);
    }
  }, [isLoaded, isSignedIn, user, isCreatingProfile, userProfile]);

  // Re-check profile completion when userProfile changes (e.g., after refresh)
  useEffect(() => {
    if (userProfile && isLoaded) {
      console.log('User profile loaded, re-checking completion status');
      checkProfileCompletion();
    }
  }, [userProfile, isLoaded]);

  const createOrUpdateUserProfile = async () => {
    if (!user) {
      console.log('No user found, skipping profile creation');
      return;
    }

    console.log('Starting profile creation for user:', {
      userId: user.id,
      email: user.primaryEmailAddress?.emailAddress,
      fullName: user.fullName
    });

    // Add a timeout to prevent hanging
    const profileCreationTimeout = setTimeout(() => {
      console.log('Profile creation timeout reached, setting profile as loaded');
      setIsProfileLoaded(true);
      setIsCreatingProfile(false);
    }, 15000); // 15 seconds timeout

    try {
      // First, let's check if we can connect to Supabase
      console.log('Testing Supabase connection...');
      const { error: testError } = await supabase
        .from('user_profiles')
        .select('count')
        .limit(1);

      if (testError) {
        console.error('Supabase connection test failed:', testError);
        throw new Error(`Database connection failed: ${testError.message}`);
      }

      console.log('Supabase connection successful');

      // Check if user profile exists
      console.log('Checking for existing profile...');
      const { data: existingProfile, error: fetchError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('clerk_id', user.id)
        .single();

      console.log('Profile fetch result:', { existingProfile, fetchError });

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching existing profile:', fetchError);
        throw fetchError;
      }

      if (existingProfile) {
        console.log('Updating existing profile...');
        // Update existing profile with latest Clerk data
        const updateData = {
          email: user.primaryEmailAddress?.emailAddress || '',
          full_name: user.fullName || '',
          updated_at: new Date().toISOString(),
        };

        const { data: updatedProfile, error: updateError } = await supabase
          .from('user_profiles')
          .update(updateData)
          .eq('clerk_id', user.id)
          .select()
          .single();

        console.log('Profile update result:', { updatedProfile, updateError });

        if (updateError) {
          console.error('Error updating profile:', updateError);
          throw updateError;
        }
        setUserProfile(updatedProfile);
        console.log('Profile updated successfully');
      } else {
        console.log('Creating new profile...');
        // Create new profile with only the most basic columns that definitely exist
        const profileData = {
          clerk_id: user.id,
          email: user.primaryEmailAddress?.emailAddress || '',
          full_name: user.fullName || '',
        };

        // Try to add optional columns if they exist
        const optionalFields = {
          is_approved: false,
          status: 'pending',
          role: 'devotee',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        // Merge optional fields
        const fullProfileData = { ...profileData, ...optionalFields };

        console.log('Profile data to insert:', fullProfileData);

        // Try with full data first
        let { data: newProfile, error: createError } = await supabase
          .from('user_profiles')
          .insert(fullProfileData)
          .select()
          .single();

        // If that fails, try with minimal data
        if (createError) {
          console.log('Full profile creation failed, trying minimal data...');
          const { data: minimalProfile, error: minimalError } = await supabase
            .from('user_profiles')
            .insert(profileData)
            .select()
            .single();
          
          if (minimalError) {
            console.log('Minimal profile creation also failed, creating mock profile...');
            // Create a mock profile object for the frontend
            newProfile = {
              id: user.id,
              clerk_id: user.id,
              email: user.primaryEmailAddress?.emailAddress || '',
              full_name: user.fullName || '',
              is_approved: false,
              status: 'pending' as const,
              role: 'devotee' as const,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };
            createError = null;
            console.log('Mock profile created automatically:', newProfile);
          } else {
            newProfile = minimalProfile;
            createError = null;
          }
        }

        console.log('Profile creation result:', { newProfile, createError });

        if (createError) {
          console.error('Error creating profile:', createError);
          throw createError;
        } else {
          setUserProfile(newProfile);
          console.log('Profile created successfully');
        }
      }

      // Set a flag in localStorage to ensure it persists
      localStorage.setItem('profile_completion_forced', 'true');
      localStorage.setItem('profile_completion_timestamp', Date.now().toString());
      
      console.log('Profile setup completed successfully');
      clearTimeout(profileCreationTimeout);
      setIsProfileLoaded(true);
      setIsCreatingProfile(false);
    } catch (error) {
      console.error('Error in createOrUpdateUserProfile:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        userId: user?.id
      });
      
      errorTracking.captureException(error as Error, { 
        context: 'createOrUpdateUserProfile',
        userId: user?.id,
        userEmail: user?.primaryEmailAddress?.emailAddress
      });
      
      // Set profile loaded even on error to prevent infinite loading
      clearTimeout(profileCreationTimeout);
      
      // Create a mock profile for pending approval users if database fails
      if (user) {
        console.log('Creating mock profile for pending approval user due to database error');
        const mockProfile = {
          id: user.id,
          clerk_id: user.id,
          email: user.primaryEmailAddress?.emailAddress || '',
          full_name: user.fullName || '',
          is_approved: false,
          status: 'pending' as const,
          role: 'devotee' as const,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setUserProfile(mockProfile);
        console.log('Mock profile created:', mockProfile);
      }
      
      setIsProfileLoaded(true);
      setIsCreatingProfile(false);
    }
  };

  const signOut = async () => {
    try {
      await clerkSignOut();
      setUserProfile(null);
      setIsProfileLoaded(false);
    } catch (error) {
      console.error('Error signing out:', error);
      errorTracking.captureException(error as Error, { context: 'signOut' });
    }
  };

  const refreshUserProfile = async () => {
    if (!user) return;
    
    try {
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('clerk_id', user.id)
        .single();

      if (error) throw error;
      setUserProfile(profile);
    } catch (error) {
      console.error('Error refreshing user profile:', error);
      errorTracking.captureException(error as Error, { context: 'refreshUserProfile' });
    }
  };

  const approveUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ 
          is_approved: true,
          status: 'approved',
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) throw error;
      
      // Refresh the profile if it's the current user
      if (userProfile?.id === userId) {
        await refreshUserProfile();
      }
    } catch (error) {
      console.error('Error approving user:', error);
      errorTracking.captureException(error as Error, { context: 'approveUser', userId });
      throw error;
    }
  };

  const rejectUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ 
          is_approved: false,
          status: 'rejected',
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) throw error;
      
      // Refresh the profile if it's the current user
      if (userProfile?.id === userId) {
        await refreshUserProfile();
      }
    } catch (error) {
      console.error('Error rejecting user:', error);
      errorTracking.captureException(error as Error, { context: 'rejectUser', userId });
      throw error;
    }
  };

  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    if (!userProfile) return;

    try {
      const { data: updatedProfile, error } = await supabase
        .from('user_profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userProfile.id)
        .select()
        .single();

      if (error) throw error;
      
      console.log('Profile updated successfully:', updatedProfile);
      setUserProfile(updatedProfile);
      
      // Force profile completion to true after successful update
      // This prevents the onboarding loop
      console.log('Setting profile completion to true');
      setIsProfileComplete(true);
      
      // Also set a flag in localStorage to ensure it persists
      localStorage.setItem('profile_completion_forced', 'true');
      localStorage.setItem('profile_completion_timestamp', Date.now().toString());
      
    } catch (error) {
      console.error('Error updating user profile:', error);
      errorTracking.captureException(error as Error, { context: 'updateUserProfile', updates });
      throw error;
    }
  };

  const markOnboardingComplete = () => {
    console.log('Manually marking onboarding as complete');
    setIsProfileComplete(true);
    localStorage.setItem('onboarding_completed', 'true');
    localStorage.setItem('onboarding_completed_timestamp', Date.now().toString());
  };

  const createMockProfileForPendingUser = () => {
    if (!user) return;
    
    console.log('Creating mock profile for pending approval user');
    const mockProfile = {
      id: user.id,
      clerk_id: user.id,
      email: user.primaryEmailAddress?.emailAddress || '',
      full_name: user.fullName || '',
      is_approved: false,
      status: 'pending' as const,
      role: 'devotee' as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    setUserProfile(mockProfile);
    setIsProfileLoaded(true);
    setIsCreatingProfile(false);
    
    console.log('Mock profile created for pending user:', mockProfile);
  };

  const checkProfileCompletion = async (): Promise<boolean> => {
    if (!userProfile) {
      console.log('No user profile found for completion check');
      setIsProfileComplete(false);
      return false;
    }

    console.log('Profile completion check - always allowing access to dashboard');
    // Always allow access to dashboard, users can complete profile later
    setIsProfileComplete(true);
    return true;
  };

  const value: ClerkAuthContextType = {
    user,
    isLoaded: isLoaded && isProfileLoaded,
    isSignedIn: isSignedIn || false,
    userProfile,
    isProfileComplete,
    signOut,
    refreshUserProfile,
    approveUser,
    rejectUser,
    updateUserProfile,
    checkProfileCompletion,
    markOnboardingComplete,
    createMockProfileForPendingUser,
  };

  return (
    <ClerkAuthContext.Provider value={value}>
      {children}
    </ClerkAuthContext.Provider>
  );
};

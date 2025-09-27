/** @jsxImportSource react */
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';
import { supabase } from '../lib/supabase';
import { errorTracking } from '../lib/monitoring';
import { isAdminEmail, getAdminRole } from '../config/adminConfig';

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
  role: 'admin' | 'devotee' | 'committee' | 'super_admin';
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
  forceCreateProfile: () => Promise<void>;
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
      userId: user?.id,
      userEmail: user?.primaryEmailAddress?.emailAddress
    });

    if (isLoaded && isSignedIn && user && !isCreatingProfile) {
      if (!userProfile) {
        console.log('Clerk user authenticated, creating/updating profile...');
        setIsCreatingProfile(true);
        createOrUpdateUserProfile();
      } else {
        console.log('User profile already exists, setting as loaded');
        setIsProfileLoaded(true);
        setIsCreatingProfile(false);
      }
    } else if (isLoaded && !isSignedIn) {
      console.log('Clerk user not authenticated, clearing profile');
      setUserProfile(null);
      setIsProfileLoaded(true);
      setIsCreatingProfile(false);
    }
  }, [isLoaded, isSignedIn, user, isCreatingProfile, userProfile]);

  // Reset profile when user changes (for new signups)
  useEffect(() => {
    if (isLoaded && isSignedIn && user && userProfile && userProfile.clerk_id !== user.id) {
      console.log('User ID changed, resetting profile for new user');
      setUserProfile(null);
      setIsProfileLoaded(false);
      setIsCreatingProfile(false);
    }
  }, [user?.id, userProfile?.clerk_id, isLoaded, isSignedIn]);

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

    console.log('🚀 Starting profile creation for user:', {
      userId: user.id,
      email: user.primaryEmailAddress?.emailAddress,
      fullName: user.fullName,
      timestamp: new Date().toISOString()
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
      let { data: existingProfile, error: fetchError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('clerk_id', user.id)
        .single();

      console.log('Profile fetch result:', { existingProfile, fetchError });

      // If no profile found by clerk_id, try to find by email as fallback
      if (fetchError && fetchError.code === 'PGRST116') {
        console.log('No profile found by clerk_id, trying email lookup...');
        console.log('Looking for email:', user.primaryEmailAddress?.emailAddress);
        console.log('Current Clerk user ID:', user.id);
        
        const { data: emailProfile, error: emailError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('email', user.primaryEmailAddress?.emailAddress)
          .single();
        
        console.log('Email lookup result:', { emailProfile, emailError });
        
        if (!emailError && emailProfile) {
          console.log('Found profile by email, updating clerk_id...');
          console.log('Email profile data:', {
            id: emailProfile.id,
            clerk_id: emailProfile.clerk_id,
            email: emailProfile.email,
            role: emailProfile.role,
            is_approved: emailProfile.is_approved
          });
          existingProfile = emailProfile;
          fetchError = null;
          
          // Update the profile with the correct clerk_id
          console.log('Updating profile with Clerk ID:', user.id);
          const { error: updateError } = await supabase
            .from('user_profiles')
            .update({ 
              clerk_id: user.id,
              updated_at: new Date().toISOString()
            })
            .eq('id', emailProfile.id);
          
          if (updateError) {
            console.error('Error updating clerk_id:', updateError);
          } else {
            console.log('Successfully updated clerk_id');
            existingProfile.clerk_id = user.id;
            console.log('Updated profile data:', {
              id: existingProfile.id,
              clerk_id: existingProfile.clerk_id,
              email: existingProfile.email,
              role: existingProfile.role,
              is_approved: existingProfile.is_approved
            });
          }
        }
      }

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
        console.log('Set user profile data:', {
          id: updatedProfile.id,
          clerk_id: updatedProfile.clerk_id,
          email: updatedProfile.email,
          role: updatedProfile.role,
          is_approved: updatedProfile.is_approved
        });
      } else {
        console.log('Creating new profile...');
        
        // Check if this is an admin email
        const userEmail = user.primaryEmailAddress?.emailAddress || '';
        const isAdmin = isAdminEmail(userEmail);
        
        // Create profile data matching the actual database schema
        const profileData = {
          clerk_id: user.id,
          email: userEmail,
          full_name: user.fullName || '',
          is_approved: isAdmin, // Admin emails are automatically approved
          role: isAdmin ? getAdminRole(userEmail) : 'devotee',
          status: isAdmin ? 'approved' as const : 'pending' as const,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        console.log('Profile data to insert:', profileData);

        const { data: newProfile, error: createError } = await supabase
          .from('user_profiles')
          .insert(profileData)
          .select()
          .single();

        if (createError) {
          console.error('Error creating profile:', createError);
          // Create mock profile as fallback
          const mockProfile = {
            id: user.id,
            clerk_id: user.id,
            email: userEmail,
            full_name: user.fullName || '',
            is_approved: isAdmin,
            role: isAdmin ? getAdminRole(userEmail) : 'devotee',
            status: isAdmin ? 'approved' as const : 'pending' as const,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          setUserProfile(mockProfile);
          console.log('Mock profile created as fallback:', mockProfile);
        } else {
          setUserProfile(newProfile);
          console.log('Profile created successfully:', newProfile);
        }
      }

      clearTimeout(profileCreationTimeout);
      setIsProfileLoaded(true);
      setIsCreatingProfile(false);
      
    } catch (error) {
      console.error('Error in createOrUpdateUserProfile:', error);
      errorTracking.captureException(error as Error);
      clearTimeout(profileCreationTimeout);
      setIsProfileLoaded(true);
      setIsCreatingProfile(false);
      
      // Create a mock profile as fallback
      const userEmail = user.primaryEmailAddress?.emailAddress || '';
      const isAdmin = isAdminEmail(userEmail);
      
      const mockProfile = {
        id: user.id,
        clerk_id: user.id,
        email: userEmail,
        full_name: user.fullName || '',
        is_approved: isAdmin,
        role: isAdmin ? getAdminRole(userEmail) : 'devotee',
        status: isAdmin ? 'approved' as const : 'pending' as const,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      setUserProfile(mockProfile);
      console.log('Mock profile created as fallback:', mockProfile);
    }
  };

  const signOut = async () => {
    try {
      console.log('Signing out user...');
      await clerkSignOut();
      setUserProfile(null);
      setIsProfileLoaded(false);
      setIsProfileComplete(false);
      console.log('User signed out successfully');
    } catch (error) {
      console.error('Error signing out:', error);
      errorTracking.captureException(error as Error);
    }
  };

  const refreshUserProfile = async () => {
    if (!user) return;
    
    console.log('Refreshing user profile...');
    setIsCreatingProfile(true);
    await createOrUpdateUserProfile();
  };

  const approveUser = async (userId: string) => {
    try {
      console.log('Approving user:', userId);
      const { error } = await supabase
        .from('user_profiles')
        .update({ 
          is_approved: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        console.error('Error approving user:', error);
        throw error;
      }

      console.log('User approved successfully');
      
      // Refresh the current user's profile if it's the same user
      if (userProfile && userProfile.id === userId) {
        await refreshUserProfile();
      }
    } catch (error) {
      console.error('Error in approveUser:', error);
      errorTracking.captureException(error as Error);
      throw error;
    }
  };

  const rejectUser = async (userId: string) => {
    try {
      console.log('Rejecting user:', userId);
      const { error } = await supabase
        .from('user_profiles')
        .update({ 
          is_approved: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        console.error('Error rejecting user:', error);
        throw error;
      }

      console.log('User rejected successfully');
      
      // Refresh the current user's profile if it's the same user
      if (userProfile && userProfile.id === userId) {
        await refreshUserProfile();
      }
    } catch (error) {
      console.error('Error in rejectUser:', error);
      errorTracking.captureException(error as Error);
      throw error;
    }
  };

  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    if (!userProfile) return;
    
    try {
      console.log('Updating user profile:', updates);
      const { data, error } = await supabase
        .from('user_profiles')
        .update({ 
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', userProfile.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating user profile:', error);
        throw error;
      }

      setUserProfile(data);
      console.log('User profile updated successfully');
    } catch (error) {
      console.error('Error in updateUserProfile:', error);
      errorTracking.captureException(error as Error);
      throw error;
    }
  };

  const createMockProfileForPendingUser = () => {
    if (!user) return;
    
    console.log('Creating mock profile for pending user...');
    const userEmail = user.primaryEmailAddress?.emailAddress || '';
    const isAdmin = isAdminEmail(userEmail);
    
    const mockProfile = {
      id: user.id,
      clerk_id: user.id,
      email: userEmail,
      full_name: user.fullName || '',
      is_approved: isAdmin,
      role: isAdmin ? getAdminRole(userEmail) : 'devotee',
      status: isAdmin ? 'approved' as const : 'pending' as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    setUserProfile(mockProfile);
    setIsProfileLoaded(true);
    setIsCreatingProfile(false);
    console.log('Mock profile created for pending user:', mockProfile);
  };

  const forceCreateProfile = async () => {
    if (!user) return;
    
    console.log('Force creating profile...');
    setIsCreatingProfile(true);
    await createOrUpdateUserProfile();
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

  const markOnboardingComplete = () => {
    console.log('Marking onboarding as complete');
    setIsProfileComplete(true);
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
    forceCreateProfile,
  };

  return (
    <ClerkAuthContext.Provider value={value}>
      {children}
    </ClerkAuthContext.Provider>
  );
};
/** @jsxImportSource react */
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';
import { supabase } from '../lib/supabase';
import { errorTracking } from '../lib/monitoring';
import { isAdminEmail, getAdminRole, getAdminStatus, getAdminApproval } from '../config/adminConfig';

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

  // Main effect to handle profile creation/loading
  useEffect(() => {
    console.log('ClerkAuthContext: useEffect triggered', {
      isLoaded,
      isSignedIn,
      hasUser: !!user,
      isCreatingProfile,
      hasUserProfile: !!userProfile,
      userId: user?.id
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

  // Re-check profile completion when userProfile changes
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
      console.log('Profile creation timeout reached, creating mock profile');
      createMockProfileForPendingUser();
    }, 10000); // 10 seconds timeout

    try {
      // Test Supabase connection
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

      // Check if user profile exists by clerk_id
      console.log('Checking for existing profile by clerk_id...');
      let { data: existingProfile, error: fetchError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('clerk_id', user.id)
        .single();

      console.log('Profile fetch result:', { existingProfile, fetchError });

      // If no profile found by clerk_id, try to find by email
      if (fetchError && fetchError.code === 'PGRST116') {
        console.log('No profile found by clerk_id, trying email lookup...');
        const { data: emailProfile, error: emailError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('email', user.primaryEmailAddress?.emailAddress)
          .single();
        
        if (!emailError && emailProfile) {
          console.log('Found profile by email, updating clerk_id...');
          existingProfile = emailProfile;
          fetchError = null;
          
          // Update the profile with the correct clerk_id
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
          }
        }
      }

      if (existingProfile) {
        console.log('Updating existing profile...');
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

        if (updateError) {
          console.error('Error updating profile:', updateError);
          // Use existing profile even if update fails
          setUserProfile(existingProfile);
        } else {
          setUserProfile(updatedProfile);
          console.log('Profile updated successfully');
        }
      } else {
        console.log('Creating new profile...');
        
        // Check if this is an admin email
        const userEmail = user.primaryEmailAddress?.emailAddress || '';
        const isAdmin = isAdminEmail(userEmail);
        
        const profileData = {
          clerk_id: user.id,
          email: userEmail,
          full_name: user.fullName || '',
          is_approved: isAdmin, // Admin emails are automatically approved
          status: isAdmin ? 'approved' as const : 'pending' as const,
          role: isAdmin ? getAdminRole(userEmail) : 'devotee' as const,
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
            status: isAdmin ? 'approved' as const : 'pending' as const,
            role: isAdmin ? getAdminRole(userEmail) : 'devotee' as const,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          setUserProfile(mockProfile);
          console.log('Mock profile created:', mockProfile);
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
      clearTimeout(profileCreationTimeout);
      
      // Create mock profile for any user if database fails
      createMockProfileForPendingUser();
    }
  };

  const createMockProfileForPendingUser = () => {
    if (!user) return;
    
    console.log('Creating mock profile for user');
    
    const userEmail = user.primaryEmailAddress?.emailAddress || '';
    const isAdmin = isAdminEmail(userEmail);
    
    const mockProfile = {
      id: user.id,
      clerk_id: user.id,
      email: userEmail,
      full_name: user.fullName || (isAdmin ? 'Temple Administrator' : ''),
      is_approved: isAdmin,
      status: isAdmin ? 'approved' as const : 'pending' as const,
      role: isAdmin ? getAdminRole(userEmail) : 'devotee' as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    setUserProfile(mockProfile);
    setIsProfileLoaded(true);
    setIsCreatingProfile(false);
    
    console.log('Mock profile created:', mockProfile);
  };

  const checkProfileCompletion = async (): Promise<boolean> => {
    if (!userProfile) {
      console.log('No user profile found for completion check');
      setIsProfileComplete(false);
      return false;
    }

    // Check if profile has required fields
    const hasRequiredFields = !!(
      userProfile.full_name &&
      userProfile.email
    );

    console.log('Profile completion check:', {
      hasRequiredFields,
      fullName: userProfile.full_name,
      email: userProfile.email,
      isApproved: userProfile.is_approved
    });

    // Always allow access to dashboard regardless of completion status
    console.log('Profile completion check - always allowing access to dashboard');
    setIsProfileComplete(true);
    return true;
  };

  const markOnboardingComplete = () => {
    setIsProfileComplete(true);
    localStorage.setItem('onboarding_completed', 'true');
    localStorage.setItem('onboarding_completed_timestamp', Date.now().toString());
  };

  const signOut = async () => {
    try {
      await clerkSignOut();
      setUserProfile(null);
      setIsProfileLoaded(false);
      setIsProfileComplete(false);
      localStorage.removeItem('onboarding_completed');
      localStorage.removeItem('onboarding_completed_timestamp');
    } catch (error) {
      console.error('Error signing out:', error);
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
      const { error } = await supabase
        .from('user_profiles')
        .update({ 
          is_approved: true, 
          status: 'approved',
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        console.error('Error approving user:', error);
        throw error;
      }

      // Refresh current user profile if it's the same user
      if (userProfile && userProfile.id === userId) {
        setUserProfile(prev => prev ? { ...prev, is_approved: true, status: 'approved' } : null);
      }
    } catch (error) {
      console.error('Error approving user:', error);
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

      if (error) {
        console.error('Error rejecting user:', error);
        throw error;
      }

      // Refresh current user profile if it's the same user
      if (userProfile && userProfile.id === userId) {
        setUserProfile(prev => prev ? { ...prev, is_approved: false, status: 'rejected' } : null);
      }
    } catch (error) {
      console.error('Error rejecting user:', error);
      throw error;
    }
  };

  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    if (!userProfile) return;

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .update({ 
          ...updates, 
          updated_at: new Date().toISOString() 
        })
        .eq('clerk_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating user profile:', error);
        throw error;
      }

      setUserProfile(data);
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  };

  const value: ClerkAuthContextType = {
    user,
    isLoaded,
    isSignedIn,
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

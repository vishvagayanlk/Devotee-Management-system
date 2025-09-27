import React from 'react';
import { useClerkAuth } from '../contexts/ClerkAuthContext';

const OnboardingDebugger: React.FC = () => {
  const { user, isLoaded, isSignedIn, userProfile, isProfileComplete } = useClerkAuth();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Onboarding Flow Debugger</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Authentication Status</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="font-medium">Clerk Loaded:</span>
              <span className={`ml-2 px-2 py-1 rounded text-sm ${isLoaded ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {isLoaded ? 'Yes' : 'No'}
              </span>
            </div>
            <div>
              <span className="font-medium">User Signed In:</span>
              <span className={`ml-2 px-2 py-1 rounded text-sm ${isSignedIn ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {isSignedIn ? 'Yes' : 'No'}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">User Profile Status</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="font-medium">Profile Loaded:</span>
              <span className={`ml-2 px-2 py-1 rounded text-sm ${userProfile ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {userProfile ? 'Yes' : 'No'}
              </span>
            </div>
            <div>
              <span className="font-medium">Profile Complete:</span>
              <span className={`ml-2 px-2 py-1 rounded text-sm ${isProfileComplete ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {isProfileComplete ? 'Yes' : 'No'}
              </span>
            </div>
          </div>
        </div>

        {user && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Clerk User Data</h2>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
              {JSON.stringify({
                id: user.id,
                emailAddresses: user.emailAddresses?.map(e => e.emailAddress),
                firstName: user.firstName,
                lastName: user.lastName,
                fullName: user.fullName,
                hasImage: !!user.imageUrl,
                createdAt: user.createdAt,
                lastSignInAt: user.lastSignInAt
              }, null, 2)}
            </pre>
          </div>
        )}

        {userProfile && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Supabase Profile Data</h2>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
              {JSON.stringify({
                id: userProfile.id,
                clerk_id: userProfile.clerk_id,
                email: userProfile.email,
                full_name: userProfile.full_name,
                phone: userProfile.phone,
                nic: userProfile.nic,
                address: userProfile.address,
                group_id: userProfile.group_id,
                is_approved: userProfile.is_approved,
                role: userProfile.role,
                created_at: userProfile.created_at,
                updated_at: userProfile.updated_at
              }, null, 2)}
            </pre>
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Flow Logic</h2>
          <div className="space-y-2">
            <div className="flex items-center">
              <span className="font-medium w-48">Not loaded:</span>
              <span className={`px-2 py-1 rounded text-sm ${!isLoaded ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-600'}`}>
                {!isLoaded ? 'Show loading spinner' : 'Continue'}
              </span>
            </div>
            <div className="flex items-center">
              <span className="font-medium w-48">Not signed in:</span>
              <span className={`px-2 py-1 rounded text-sm ${!isSignedIn ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'}`}>
                {!isSignedIn ? 'Show Clerk auth' : 'Continue'}
              </span>
            </div>
            <div className="flex items-center">
              <span className="font-medium w-48">No profile:</span>
              <span className={`px-2 py-1 rounded text-sm ${isSignedIn && !userProfile ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-600'}`}>
                {isSignedIn && !userProfile ? 'Show loading profile' : 'Continue'}
              </span>
            </div>
            <div className="flex items-center">
              <span className="font-medium w-48">Profile incomplete:</span>
              <span className={`px-2 py-1 rounded text-sm ${isSignedIn && userProfile && !isProfileComplete ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-600'}`}>
                {isSignedIn && userProfile && !isProfileComplete ? 'Show profile setup' : 'Continue'}
              </span>
            </div>
            <div className="flex items-center">
              <span className="font-medium w-48">All complete:</span>
              <span className={`px-2 py-1 rounded text-sm ${isSignedIn && userProfile && isProfileComplete ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                {isSignedIn && userProfile && isProfileComplete ? 'Show main app' : 'Continue'}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Refresh Page
          </button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingDebugger;

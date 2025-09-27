import React, { useState } from 'react';
import { useClerkAuth } from '../contexts/ClerkAuthContext';
import { CheckCircle, AlertCircle, RefreshCw, User, Database } from 'lucide-react';

export default function ProfileDebugger() {
  const { user, isLoaded, isSignedIn, userProfile, isProfileComplete, forceCreateProfile, createMockProfileForPendingUser } = useClerkAuth();
  const [isCreating, setIsCreating] = useState(false);

  const handleForceCreate = async () => {
    setIsCreating(true);
    try {
      await forceCreateProfile();
    } catch (error) {
      console.error('Error force creating profile:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleCreateMock = () => {
    createMockProfileForPendingUser();
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Profile Creation Debugger</h1>
        
        {/* Current State */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Current State</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span>Loaded: {isLoaded ? 'Yes' : 'No'}</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span>Signed In: {isSignedIn ? 'Yes' : 'No'}</span>
            </div>
            <div className="flex items-center space-x-2">
              {userProfile ? <CheckCircle className="h-5 w-5 text-green-600" /> : <AlertCircle className="h-5 w-5 text-red-600" />}
              <span>Profile: {userProfile ? 'Exists' : 'Missing'}</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span>Complete: {isProfileComplete ? 'Yes' : 'No'}</span>
            </div>
          </div>
        </div>

        {/* User Info */}
        {user && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">User Information</h2>
            <div className="space-y-2">
              <div><strong>ID:</strong> {user.id}</div>
              <div><strong>Email:</strong> {user.primaryEmailAddress?.emailAddress}</div>
              <div><strong>Name:</strong> {user.fullName}</div>
              <div><strong>Created:</strong> {user.createdAt ? new Date(user.createdAt).toLocaleString() : 'Unknown'}</div>
            </div>
          </div>
        )}

        {/* Profile Info */}
        {userProfile && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Profile Information</h2>
            <div className="space-y-2">
              <div><strong>Profile ID:</strong> {userProfile.id}</div>
              <div><strong>Clerk ID:</strong> {userProfile.clerk_id}</div>
              <div><strong>Email:</strong> {userProfile.email}</div>
              <div><strong>Name:</strong> {userProfile.full_name}</div>
              <div><strong>Role:</strong> {userProfile.role}</div>
              <div><strong>Approved:</strong> {userProfile.is_approved ? 'Yes' : 'No'}</div>
              <div><strong>Status:</strong> {userProfile.status}</div>
              <div><strong>Created:</strong> {new Date(userProfile.created_at).toLocaleString()}</div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Actions</h2>
          <div className="space-y-4">
            <button
              onClick={handleForceCreate}
              disabled={isCreating || !isSignedIn}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
              <RefreshCw className={`h-4 w-4 ${isCreating ? 'animate-spin' : ''}`} />
              <span>{isCreating ? 'Creating...' : 'Force Create Profile'}</span>
            </button>
            
            <button
              onClick={handleCreateMock}
              disabled={!isSignedIn}
              className="flex items-center space-x-2 bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 disabled:bg-gray-400"
            >
              <User className="h-4 w-4" />
              <span>Create Mock Profile</span>
            </button>
            
            <button
              onClick={() => window.location.reload()}
              className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Refresh Page</span>
            </button>
          </div>
        </div>

        {/* Debug Info */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Debug Information</h2>
          <div className="space-y-2 text-sm">
            <div><strong>User ID Match:</strong> {user && userProfile ? (user.id === userProfile.clerk_id ? 'Yes' : 'No') : 'N/A'}</div>
            <div><strong>Profile Loaded:</strong> {userProfile ? 'Yes' : 'No'}</div>
            <div><strong>Is Creating Profile:</strong> {isCreating ? 'Yes' : 'No'}</div>
            <div><strong>Timestamp:</strong> {new Date().toLocaleString()}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
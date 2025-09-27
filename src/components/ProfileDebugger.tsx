import React, { useState, useEffect } from 'react';
import { useClerkAuth } from '../contexts/ClerkAuthContext';
import { supabase } from '../lib/supabase';
import { AlertCircle, CheckCircle, RefreshCw, Database, User } from 'lucide-react';

export default function ProfileDebugger() {
  const { user, isLoaded, isSignedIn, userProfile, isProfileComplete } = useClerkAuth();
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [loading, setLoading] = useState(false);

  const runDiagnostics = async () => {
    setLoading(true);
    const info: any = {};

    try {
      // Test Supabase connection
      console.log('Testing Supabase connection...');
      const { data: testData, error: testError } = await supabase
        .from('user_profiles')
        .select('count')
        .limit(1);
      
      info.supabaseConnection = {
        success: !testError,
        error: testError?.message,
        data: testData
      };

      // Check if user_profiles table exists and has data
      const { data: profilesData, error: profilesError } = await supabase
        .from('user_profiles')
        .select('*')
        .limit(5);
      
      info.userProfilesTable = {
        success: !profilesError,
        error: profilesError?.message,
        count: profilesData?.length || 0,
        sample: profilesData?.[0]
      };

      // Check if user_profile_details table exists
      const { data: detailsData, error: detailsError } = await supabase
        .from('user_profile_details')
        .select('*')
        .limit(1);
      
      info.userProfileDetailsTable = {
        exists: !detailsError || detailsError.code === 'PGRST116',
        error: detailsError?.message,
        code: detailsError?.code
      };

      // Check current user's profile
      if (user?.id) {
        const { data: currentProfile, error: currentError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('clerk_id', user.id)
          .single();
        
        info.currentUserProfile = {
          found: !!currentProfile,
          error: currentError?.message,
          data: currentProfile
        };
      }

      // Check RLS policies
      const { data: policiesData, error: policiesError } = await supabase
        .rpc('get_table_policies', { table_name: 'user_profiles' });
      
      info.rlsPolicies = {
        success: !policiesError,
        error: policiesError?.message,
        policies: policiesData
      };

    } catch (error) {
      info.generalError = error instanceof Error ? error.message : 'Unknown error';
    }

    setDebugInfo(info);
    setLoading(false);
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <Database className="h-6 w-6 mr-2" />
              Profile Loading Debugger
            </h1>
            <button
              onClick={runDiagnostics}
              disabled={loading}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh Diagnostics
            </button>
          </div>

          {/* Current State */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h2 className="text-lg font-semibold mb-3 flex items-center">
              <User className="h-5 w-5 mr-2" />
              Current State
            </h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Clerk Loaded:</span>
                <span className={`ml-2 ${isLoaded ? 'text-green-600' : 'text-red-600'}`}>
                  {isLoaded ? 'Yes' : 'No'}
                </span>
              </div>
              <div>
                <span className="font-medium">Signed In:</span>
                <span className={`ml-2 ${isSignedIn ? 'text-green-600' : 'text-red-600'}`}>
                  {isSignedIn ? 'Yes' : 'No'}
                </span>
              </div>
              <div>
                <span className="font-medium">User Profile:</span>
                <span className={`ml-2 ${userProfile ? 'text-green-600' : 'text-red-600'}`}>
                  {userProfile ? 'Found' : 'Not Found'}
                </span>
              </div>
              <div>
                <span className="font-medium">Profile Complete:</span>
                <span className={`ml-2 ${isProfileComplete ? 'text-green-600' : 'text-red-600'}`}>
                  {isProfileComplete ? 'Yes' : 'No'}
                </span>
              </div>
            </div>
            {user && (
              <div className="mt-3 p-3 bg-white rounded border">
                <p className="text-sm"><strong>User ID:</strong> {user.id}</p>
                <p className="text-sm"><strong>Email:</strong> {user.primaryEmailAddress?.emailAddress}</p>
                <p className="text-sm"><strong>Name:</strong> {user.fullName}</p>
              </div>
            )}
          </div>

          {/* Diagnostics Results */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Database Diagnostics</h2>
            
            {/* Supabase Connection */}
            <div className="p-4 border rounded-lg">
              <div className="flex items-center mb-2">
                <Database className="h-5 w-5 mr-2" />
                <span className="font-medium">Supabase Connection</span>
                {debugInfo.supabaseConnection?.success ? (
                  <CheckCircle className="h-5 w-5 text-green-600 ml-2" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600 ml-2" />
                )}
              </div>
              {debugInfo.supabaseConnection?.error && (
                <p className="text-red-600 text-sm">{debugInfo.supabaseConnection.error}</p>
              )}
            </div>

            {/* User Profiles Table */}
            <div className="p-4 border rounded-lg">
              <div className="flex items-center mb-2">
                <User className="h-5 w-5 mr-2" />
                <span className="font-medium">User Profiles Table</span>
                {debugInfo.userProfilesTable?.success ? (
                  <CheckCircle className="h-5 w-5 text-green-600 ml-2" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600 ml-2" />
                )}
              </div>
              <p className="text-sm text-gray-600">
                Records: {debugInfo.userProfilesTable?.count || 0}
              </p>
              {debugInfo.userProfilesTable?.error && (
                <p className="text-red-600 text-sm">{debugInfo.userProfilesTable.error}</p>
              )}
            </div>

            {/* User Profile Details Table */}
            <div className="p-4 border rounded-lg">
              <div className="flex items-center mb-2">
                <Database className="h-5 w-5 mr-2" />
                <span className="font-medium">User Profile Details Table</span>
                {debugInfo.userProfileDetailsTable?.exists ? (
                  <CheckCircle className="h-5 w-5 text-green-600 ml-2" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600 ml-2" />
                )}
              </div>
              <p className="text-sm text-gray-600">
                Exists: {debugInfo.userProfileDetailsTable?.exists ? 'Yes' : 'No'}
              </p>
              {debugInfo.userProfileDetailsTable?.error && (
                <p className="text-red-600 text-sm">
                  {debugInfo.userProfileDetailsTable.error} (Code: {debugInfo.userProfileDetailsTable?.code})
                </p>
              )}
            </div>

            {/* Current User Profile */}
            {user && (
              <div className="p-4 border rounded-lg">
                <div className="flex items-center mb-2">
                  <User className="h-5 w-5 mr-2" />
                  <span className="font-medium">Current User Profile</span>
                  {debugInfo.currentUserProfile?.found ? (
                    <CheckCircle className="h-5 w-5 text-green-600 ml-2" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-600 ml-2" />
                  )}
                </div>
                {debugInfo.currentUserProfile?.found ? (
                  <div className="text-sm text-gray-600">
                    <p>Profile found in database</p>
                    <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                      {JSON.stringify(debugInfo.currentUserProfile.data, null, 2)}
                    </pre>
                  </div>
                ) : (
                  <p className="text-red-600 text-sm">
                    {debugInfo.currentUserProfile?.error || 'Profile not found'}
                  </p>
                )}
              </div>
            )}

            {/* General Error */}
            {debugInfo.generalError && (
              <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
                <div className="flex items-center mb-2">
                  <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                  <span className="font-medium text-red-800">General Error</span>
                </div>
                <p className="text-red-600 text-sm">{debugInfo.generalError}</p>
              </div>
            )}
          </div>

          {/* Recommendations */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">Recommendations</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              {!debugInfo.supabaseConnection?.success && (
                <li>• Check your Supabase URL and service key in .env.local</li>
              )}
              {!debugInfo.userProfilesTable?.success && (
                <li>• Run the database setup script: node scripts/setup-database.js</li>
              )}
              {!debugInfo.currentUserProfile?.found && user && (
                <li>• The user profile creation may have failed. Check the console for errors.</li>
              )}
              {debugInfo.userProfileDetailsTable?.exists === false && (
                <li>• The user_profile_details table doesn't exist. Run database migrations.</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

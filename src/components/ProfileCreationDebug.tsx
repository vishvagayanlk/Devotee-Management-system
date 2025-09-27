import React, { useState } from 'react';
import { useClerkAuth } from '../contexts/ClerkAuthContext';
import { supabase } from '../lib/supabase';

export default function ProfileCreationDebug() {
  const { user, isLoaded, isSignedIn, userProfile, forceCreateProfile, useEffectCallCount } = useClerkAuth();
  const [testResult, setTestResult] = useState<string>('');
  const [isTesting, setIsTesting] = useState(false);

  const testProfileCreation = async () => {
    setIsTesting(true);
    setTestResult('Testing...');
    
    try {
      console.log('Testing profile creation with current user data:', {
        userId: user?.id,
        email: user?.primaryEmailAddress?.emailAddress,
        fullName: user?.fullName
      });

      const testProfile = {
        id: crypto.randomUUID(),
        clerk_id: user?.id || 'test-' + Date.now(),
        email: user?.primaryEmailAddress?.emailAddress || 'test@example.com',
        full_name: user?.fullName || 'Test User',
        is_approved: false,
        role: 'devotee',
        status: 'pending',
      };

      console.log('Creating test profile:', testProfile);

      const { data, error } = await supabase
        .from('user_profiles')
        .insert(testProfile)
        .select()
        .single();

      if (error) {
        console.error('Test profile creation failed:', error);
        setTestResult(`❌ Error: ${error.message}\nCode: ${error.code}\nDetails: ${JSON.stringify(error.details)}`);
      } else {
        console.log('Test profile created successfully:', data);
        setTestResult(`✅ Success! Profile created with ID: ${data.id}`);
        
        // Clean up the test profile
        await supabase
          .from('user_profiles')
          .delete()
          .eq('id', data.id);
        
        setTestResult(prev => prev + '\n🧹 Test profile cleaned up');
      }
    } catch (error) {
      console.error('Test failed:', error);
      setTestResult(`❌ Exception: ${error.message}`);
    } finally {
      setIsTesting(false);
    }
  };

  const testExistingProfile = async () => {
    if (!user?.id) {
      setTestResult('❌ No user ID available');
      return;
    }

    setIsTesting(true);
    setTestResult('Checking for existing profile...');

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('clerk_id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          setTestResult('ℹ️ No existing profile found (this is expected for new users)');
        } else {
          setTestResult(`❌ Error checking existing profile: ${error.message}`);
        }
      } else {
        setTestResult(`✅ Found existing profile: ${JSON.stringify(data, null, 2)}`);
      }
    } catch (error) {
      setTestResult(`❌ Exception: ${error.message}`);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Profile Creation Debug</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Current State</h2>
          <div className="space-y-2 text-sm">
            <p><strong>isLoaded:</strong> {isLoaded ? '✅' : '❌'}</p>
            <p><strong>isSignedIn:</strong> {isSignedIn ? '✅' : '❌'}</p>
            <p><strong>hasUser:</strong> {user ? '✅' : '❌'}</p>
            <p><strong>hasUserProfile:</strong> {userProfile ? '✅' : '❌'}</p>
            <p><strong>User ID:</strong> {user?.id || 'N/A'}</p>
            <p><strong>User Email:</strong> {user?.primaryEmailAddress?.emailAddress || 'N/A'}</p>
            <p><strong>User Full Name:</strong> {user?.fullName || 'N/A'}</p>
            <p><strong>Profile ID:</strong> {userProfile?.id || 'N/A'}</p>
            <p><strong>Profile Role:</strong> {userProfile?.role || 'N/A'}</p>
            <p><strong>Profile Approved:</strong> {userProfile?.is_approved ? '✅' : '❌'}</p>
            <p><strong>useEffect Call Count:</strong> {useEffectCallCount}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Actions</h2>
          <div className="space-x-4">
            <button
              onClick={testProfileCreation}
              disabled={isTesting}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {isTesting ? 'Testing...' : 'Test Profile Creation'}
            </button>
            <button
              onClick={testExistingProfile}
              disabled={isTesting}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
            >
              {isTesting ? 'Checking...' : 'Check Existing Profile'}
            </button>
            <button
              onClick={() => forceCreateProfile()}
              disabled={isTesting}
              className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:opacity-50"
            >
              Force Create Profile
            </button>
            <button
              onClick={() => {
                // Test the actual ClerkAuthContext profile creation
                console.log('Testing ClerkAuthContext profile creation...');
                setTestResult('Testing ClerkAuthContext profile creation...');
                
                // This should trigger the same logic as the useEffect
                if (user && isSignedIn) {
                  console.log('User is signed in, triggering profile creation...');
                  setTestResult('User is signed in, triggering profile creation...');
                } else {
                  console.log('User not signed in or not loaded');
                  setTestResult('User not signed in or not loaded');
                }
              }}
              disabled={isTesting}
              className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 disabled:opacity-50"
            >
              Test Context Logic
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Test Result</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm whitespace-pre-wrap">
            {testResult || 'No test results yet. Click a button above to test.'}
          </pre>
        </div>
      </div>
    </div>
  );
}

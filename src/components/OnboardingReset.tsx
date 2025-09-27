import React from 'react';

const OnboardingReset: React.FC = () => {
  const clearAllFlags = () => {
    localStorage.removeItem('profile_completion_forced');
    localStorage.removeItem('profile_completion_timestamp');
    localStorage.removeItem('profile_setup_completed');
    localStorage.removeItem('profile_setup_timestamp');
    console.log('All onboarding flags cleared');
    window.location.reload();
  };

  const forceProfileComplete = () => {
    localStorage.setItem('profile_completion_forced', 'true');
    localStorage.setItem('profile_completion_timestamp', Date.now().toString());
    console.log('Profile completion forced');
    window.location.reload();
  };

  const checkFlags = () => {
    const flags = {
      profile_completion_forced: localStorage.getItem('profile_completion_forced'),
      profile_completion_timestamp: localStorage.getItem('profile_completion_timestamp'),
      profile_setup_completed: localStorage.getItem('profile_setup_completed'),
      profile_setup_timestamp: localStorage.getItem('profile_setup_timestamp'),
    };
    console.log('Current flags:', flags);
    alert(JSON.stringify(flags, null, 2));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Onboarding Reset Tool</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Current Flags</h2>
          <button
            onClick={checkFlags}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 mr-4"
          >
            Check Current Flags
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Reset Actions</h2>
          <div className="space-y-4">
            <button
              onClick={clearAllFlags}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 mr-4"
            >
              Clear All Flags (Reset Onboarding)
            </button>
            <button
              onClick={forceProfileComplete}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Force Profile Complete (Skip Onboarding)
            </button>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-800 mb-2">Instructions:</h3>
          <ul className="text-yellow-700 text-sm space-y-1">
            <li>• <strong>Clear All Flags:</strong> Removes all onboarding flags and forces user to go through onboarding again</li>
            <li>• <strong>Force Profile Complete:</strong> Sets flags to skip onboarding and go directly to dashboard</li>
            <li>• <strong>Check Current Flags:</strong> Shows what flags are currently set in localStorage</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default OnboardingReset;

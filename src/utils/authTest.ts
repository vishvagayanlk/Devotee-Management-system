/**
 * Authentication Flow Test Utilities
 * This file contains helper functions to test the authentication flow
 */

import { UserProfile } from '../contexts/ClerkAuthContext';

export interface AuthTestScenario {
  name: string;
  userProfile: UserProfile | null;
  isSignedIn: boolean;
  expectedAccess: {
    dashboard: boolean;
    records: boolean;
    events: boolean;
    devoteeManagement: boolean;
    allRecords: boolean;
    allEvents: boolean;
    profile: boolean;
    settings: boolean;
    admin: boolean;
  };
}

export const authTestScenarios: AuthTestScenario[] = [
  {
    name: 'Not signed in',
    userProfile: null,
    isSignedIn: false,
    expectedAccess: {
      dashboard: false,
      records: false,
      events: false,
      devoteeManagement: false,
      allRecords: false,
      allEvents: false,
      profile: false,
      settings: false,
      admin: false,
    },
  },
  {
    name: 'Signed in but not approved',
    userProfile: {
      id: '1',
      clerk_id: 'clerk_1',
      email: 'test@example.com',
      full_name: 'Test User',
      is_approved: false,
      status: 'pending',
      role: 'devotee',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    isSignedIn: true,
    expectedAccess: {
      dashboard: false, // Should be blocked due to not approved
      records: false,
      events: false,
      devoteeManagement: false,
      allRecords: false,
      allEvents: false,
      profile: false,
      settings: false,
      admin: false,
    },
  },
  {
    name: 'Approved devotee',
    userProfile: {
      id: '2',
      clerk_id: 'clerk_2',
      email: 'devotee@example.com',
      full_name: 'Devotee User',
      is_approved: true,
      status: 'approved',
      role: 'devotee',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    isSignedIn: true,
    expectedAccess: {
      dashboard: true,
      records: true,
      events: true,
      devoteeManagement: false, // Should be blocked - not committee
      allRecords: false,
      allEvents: false,
      profile: true,
      settings: false, // Should be blocked - not admin
      admin: false,
    },
  },
  {
    name: 'Approved committee member',
    userProfile: {
      id: '3',
      clerk_id: 'clerk_3',
      email: 'committee@example.com',
      full_name: 'Committee User',
      is_approved: true,
      status: 'approved',
      role: 'committee',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    isSignedIn: true,
    expectedAccess: {
      dashboard: true,
      records: true,
      events: true,
      devoteeManagement: true,
      allRecords: true,
      allEvents: true,
      profile: true,
      settings: false, // Should be blocked - not admin
      admin: false,
    },
  },
  {
    name: 'Approved admin',
    userProfile: {
      id: '4',
      clerk_id: 'clerk_4',
      email: 'admin@example.com',
      full_name: 'Admin User',
      is_approved: true,
      status: 'approved',
      role: 'admin',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    isSignedIn: true,
    expectedAccess: {
      dashboard: true,
      records: true,
      events: true,
      devoteeManagement: true,
      allRecords: true,
      allEvents: true,
      profile: true,
      settings: true,
      admin: true,
    },
  },
];

export const testRouteAccess = (
  userProfile: UserProfile | null,
  isSignedIn: boolean,
  route: keyof AuthTestScenario['expectedAccess']
): boolean => {
  // Check if user is signed in
  if (!isSignedIn || !userProfile) {
    return false;
  }

  // Check if user is approved
  if (!userProfile.is_approved) {
    return false;
  }

  // Check role-based access
  switch (route) {
    case 'dashboard':
    case 'records':
    case 'events':
    case 'profile':
      return true; // All approved users can access these

    case 'devoteeManagement':
    case 'allRecords':
    case 'allEvents':
      return userProfile.role === 'committee' || userProfile.role === 'admin';

    case 'settings':
    case 'admin':
      return userProfile.role === 'admin';

    default:
      return false;
  }
};

export const runAuthTests = (): { passed: number; failed: number; results: string[] } => {
  const results: string[] = [];
  let passed = 0;
  let failed = 0;

  authTestScenarios.forEach((scenario) => {
    results.push(`\n=== Testing: ${scenario.name} ===`);
    
    Object.entries(scenario.expectedAccess).forEach(([route, expectedAccess]) => {
      const actualAccess = testRouteAccess(
        scenario.userProfile,
        scenario.isSignedIn,
        route as keyof AuthTestScenario['expectedAccess']
      );
      
      if (actualAccess === expectedAccess) {
        results.push(`✅ ${route}: ${actualAccess ? 'ALLOWED' : 'BLOCKED'} (expected)`);
        passed++;
      } else {
        results.push(`❌ ${route}: ${actualAccess ? 'ALLOWED' : 'BLOCKED'} (expected ${expectedAccess ? 'ALLOWED' : 'BLOCKED'})`);
        failed++;
      }
    });
  });

  results.push(`\n=== Test Results ===`);
  results.push(`Passed: ${passed}`);
  results.push(`Failed: ${failed}`);
  results.push(`Total: ${passed + failed}`);

  return { passed, failed, results };
};

// Console test function for development
export const testAuthFlow = () => {
  console.log('🔐 Testing Authentication Flow...');
  const { passed, failed, results } = runAuthTests();
  results.forEach(result => console.log(result));
  
  if (failed === 0) {
    console.log('🎉 All authentication tests passed!');
  } else {
    console.log('⚠️ Some authentication tests failed. Please review the implementation.');
  }
  
  return { passed, failed };
};

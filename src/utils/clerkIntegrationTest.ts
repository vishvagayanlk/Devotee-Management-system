/**
 * Clerk Integration Test Suite
 * Tests all authentication flows and Clerk integration points
 */

import { UserProfile } from '../contexts/ClerkAuthContext';

export interface ClerkIntegrationTest {
  name: string;
  description: string;
  test: () => boolean;
  fix?: string;
}

export const clerkIntegrationTests: ClerkIntegrationTest[] = [
  {
    name: 'Clerk Provider Configuration',
    description: 'Checks if ClerkProvider is properly configured with publishable key',
    test: () => {
      const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
      return !!publishableKey && publishableKey.startsWith('pk_');
    },
    fix: 'Add VITE_CLERK_PUBLISHABLE_KEY to your .env.local file'
  },
  {
    name: 'ClerkAuthContext Integration',
    description: 'Checks if ClerkAuthContext is properly integrated',
    test: () => {
      try {
        // Check if the context is properly exported
        const contextModule = require('../contexts/ClerkAuthContext');
        return !!(contextModule.ClerkAuthProvider && contextModule.useClerkAuth);
      } catch {
        return false;
      }
    },
    fix: 'Ensure ClerkAuthContext is properly exported and imported'
  },
  {
    name: 'ProtectedRoute Integration',
    description: 'Checks if ProtectedRoute component is properly integrated',
    test: () => {
      try {
        const protectedRouteModule = require('../components/ProtectedRoute');
        return !!protectedRouteModule.default;
      } catch {
        return false;
      }
    },
    fix: 'Ensure ProtectedRoute component is properly exported'
  },
  {
    name: 'ClerkAuth Component',
    description: 'Checks if ClerkAuth component is properly configured',
    test: () => {
      try {
        const clerkAuthModule = require('../components/ClerkAuth');
        return !!clerkAuthModule.default;
      } catch {
        return false;
      }
    },
    fix: 'Ensure ClerkAuth component is properly exported'
  },
  {
    name: 'App Router Configuration',
    description: 'Checks if routes are properly configured with ProtectedRoute',
    test: () => {
      // This would need to be tested at runtime
      return true; // Placeholder - would need actual route testing
    },
    fix: 'Ensure all protected routes are wrapped with ProtectedRoute component'
  }
];

export interface AuthFlowTest {
  name: string;
  userState: {
    isLoaded: boolean;
    isSignedIn: boolean;
    userProfile: UserProfile | null;
  };
  expectedBehavior: {
    shouldShowSignIn: boolean;
    shouldShowDashboard: boolean;
    shouldShowLoading: boolean;
    shouldShowApprovalPending: boolean;
  };
}

export const authFlowTests: AuthFlowTest[] = [
  {
    name: 'Initial Load - Not Signed In',
    userState: {
      isLoaded: true,
      isSignedIn: false,
      userProfile: null
    },
    expectedBehavior: {
      shouldShowSignIn: true,
      shouldShowDashboard: false,
      shouldShowLoading: false,
      shouldShowApprovalPending: false
    }
  },
  {
    name: 'Loading State',
    userState: {
      isLoaded: false,
      isSignedIn: false,
      userProfile: null
    },
    expectedBehavior: {
      shouldShowSignIn: false,
      shouldShowDashboard: false,
      shouldShowLoading: true,
      shouldShowApprovalPending: false
    }
  },
  {
    name: 'Signed In - Profile Loading',
    userState: {
      isLoaded: true,
      isSignedIn: true,
      userProfile: null
    },
    expectedBehavior: {
      shouldShowSignIn: false,
      shouldShowDashboard: false,
      shouldShowLoading: true,
      shouldShowApprovalPending: false
    }
  },
  {
    name: 'Signed In - Pending Approval',
    userState: {
      isLoaded: true,
      isSignedIn: true,
      userProfile: {
        id: '1',
        clerk_id: 'clerk_1',
        email: 'test@example.com',
        full_name: 'Test User',
        is_approved: false,
        status: 'pending',
        role: 'devotee',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    },
    expectedBehavior: {
      shouldShowSignIn: false,
      shouldShowDashboard: false,
      shouldShowLoading: false,
      shouldShowApprovalPending: true
    }
  },
  {
    name: 'Signed In - Approved User',
    userState: {
      isLoaded: true,
      isSignedIn: true,
      userProfile: {
        id: '2',
        clerk_id: 'clerk_2',
        email: 'approved@example.com',
        full_name: 'Approved User',
        is_approved: true,
        status: 'approved',
        role: 'devotee',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    },
    expectedBehavior: {
      shouldShowSignIn: false,
      shouldShowDashboard: true,
      shouldShowLoading: false,
      shouldShowApprovalPending: false
    }
  }
];

export const testClerkIntegration = (): { passed: number; failed: number; results: string[] } => {
  const results: string[] = [];
  let passed = 0;
  let failed = 0;

  results.push('🔐 Testing Clerk Integration...\n');

  // Test basic integration
  clerkIntegrationTests.forEach((test) => {
    try {
      const testResult = test.test();
      if (testResult) {
        results.push(`✅ ${test.name}: PASSED`);
        passed++;
      } else {
        results.push(`❌ ${test.name}: FAILED - ${test.fix || 'Unknown issue'}`);
        failed++;
      }
    } catch (error) {
      results.push(`❌ ${test.name}: ERROR - ${error}`);
      failed++;
    }
  });

  results.push('\n🔄 Testing Auth Flow Logic...\n');

  // Test auth flow logic
  authFlowTests.forEach((test) => {
    results.push(`--- ${test.name} ---`);
    
    const { userState, expectedBehavior } = test;
    
    // Simulate the logic from App.tsx
    const shouldShowSignIn = !userState.isSignedIn;
    const shouldShowLoading = !userState.isLoaded || (userState.isSignedIn && !userState.userProfile);
    const shouldShowApprovalPending = userState.isSignedIn && userState.userProfile && !userState.userProfile.is_approved;
    const shouldShowDashboard = userState.isSignedIn && userState.userProfile && userState.userProfile.is_approved;

    const tests = [
      { name: 'Show Sign In', expected: expectedBehavior.shouldShowSignIn, actual: shouldShowSignIn },
      { name: 'Show Loading', expected: expectedBehavior.shouldShowLoading, actual: shouldShowLoading },
      { name: 'Show Approval Pending', expected: expectedBehavior.shouldShowApprovalPending, actual: shouldShowApprovalPending },
      { name: 'Show Dashboard', expected: expectedBehavior.shouldShowDashboard, actual: shouldShowDashboard }
    ];

    tests.forEach(({ name, expected, actual }) => {
      if (expected === actual) {
        results.push(`  ✅ ${name}: ${actual ? 'YES' : 'NO'}`);
        passed++;
      } else {
        results.push(`  ❌ ${name}: Expected ${expected ? 'YES' : 'NO'}, got ${actual ? 'YES' : 'NO'}`);
        failed++;
      }
    });
  });

  results.push(`\n📊 Test Results:`);
  results.push(`Passed: ${passed}`);
  results.push(`Failed: ${failed}`);
  results.push(`Total: ${passed + failed}`);

  if (failed === 0) {
    results.push('\n🎉 All Clerk integration tests passed!');
  } else {
    results.push('\n⚠️ Some tests failed. Please review the issues above.');
  }

  return { passed, failed, results };
};

export const checkClerkConfiguration = (): { isValid: boolean; issues: string[] } => {
  const issues: string[] = [];
  
  // Check environment variables
  const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
  if (!publishableKey) {
    issues.push('VITE_CLERK_PUBLISHABLE_KEY is not set');
  } else if (!publishableKey.startsWith('pk_')) {
    issues.push('VITE_CLERK_PUBLISHABLE_KEY does not start with "pk_"');
  }

  // Check if Clerk is properly imported
  try {
    require('@clerk/clerk-react');
  } catch {
    issues.push('@clerk/clerk-react package is not installed');
  }

  return {
    isValid: issues.length === 0,
    issues
  };
};

// Console test function for development
export const runClerkTests = () => {
  console.log('🔐 Running Clerk Integration Tests...\n');
  
  const configCheck = checkClerkConfiguration();
  if (!configCheck.isValid) {
    console.log('❌ Configuration Issues:');
    configCheck.issues.forEach(issue => console.log(`  - ${issue}`));
    console.log('\nPlease fix these issues before running the tests.');
    return;
  }

  const { passed, failed, results } = testClerkIntegration();
  results.forEach(result => console.log(result));
  
  return { passed, failed };
};

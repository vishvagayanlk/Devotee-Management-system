import React, { useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';

const HandshakeHandler: React.FC = () => {
  const { isLoaded, isSignedIn } = useAuth();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const handleHandshake = async () => {
      console.log('HandshakeHandler: Processing handshake');
      console.log('HandshakeHandler: isLoaded:', isLoaded, 'isSignedIn:', isSignedIn);
      
      // Wait for Clerk to load
      if (!isLoaded) {
        console.log('HandshakeHandler: Waiting for Clerk to load...');
        return;
      }

      // Check if user is signed in after handshake
      if (isSignedIn) {
        console.log('HandshakeHandler: User is signed in, redirecting to dashboard');
        navigate('/dashboard');
      } else {
        console.log('HandshakeHandler: User not signed in, redirecting to sign-in');
        navigate('/sign-in');
      }
      
      setIsProcessing(false);
    };

    // Add a small delay to ensure Clerk has processed the handshake
    const timeout = setTimeout(handleHandshake, 1000);
    
    return () => clearTimeout(timeout);
  }, [isLoaded, isSignedIn, navigate]);

  if (isProcessing) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 mb-2">Processing authentication...</p>
          <p className="text-sm text-gray-500">Please wait while we complete your sign-up</p>
        </div>
      </div>
    );
  }

  return null;
};

export default HandshakeHandler;
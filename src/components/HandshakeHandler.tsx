/** @jsxImportSource react */
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const HandshakeHandler: React.FC = () => {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(true);
  const [handshakeProcessed, setHandshakeProcessed] = useState(false);

  useEffect(() => {
    const handleHandshake = async () => {
      try {
        // Check if this is a handshake URL
        const urlParams = new URLSearchParams(window.location.search);
        const hasHandshake = urlParams.has('__clerk_handshake') || urlParams.has('__clerk_handshake_token');
        
        console.log('HandshakeHandler: Processing handshake URL', {
          hasHandshake,
          currentUrl: window.location.href
        });
        
        if (hasHandshake) {
          console.log('Handshake URL detected, processing...');
          
          // Clean up handshake parameters from URL immediately
          const cleanUrl = new URL(window.location.href);
          cleanUrl.searchParams.delete('__clerk_handshake');
          cleanUrl.searchParams.delete('__clerk_handshake_token');
          cleanUrl.pathname = '/dashboard'; // Ensure we go to dashboard
          window.history.replaceState({}, '', cleanUrl.toString());
          
          console.log('HandshakeHandler: URL cleaned, redirecting to dashboard');
          
          // Wait a moment for URL to update, then redirect
          setTimeout(() => {
            setHandshakeProcessed(true);
            navigate('/dashboard');
          }, 1000);
        } else {
          // Not a handshake URL, redirect to sign-in
          console.log('Not a handshake URL, redirecting to sign-in');
          navigate('/sign-in');
        }
      } catch (error) {
        console.error('Error handling handshake:', error);
        navigate('/sign-in');
      } finally {
        setIsProcessing(false);
      }
    };

    handleHandshake();
  }, [navigate]);

  if (isProcessing) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Processing Handshake...
            </h2>
            <p className="text-gray-600">
              Please wait while we process your authentication handshake.
            </p>
            <div className="mt-4 text-sm text-gray-500">
              <div>URL: {window.location.href}</div>
              <div>Handshake: {new URLSearchParams(window.location.search).has('__clerk_handshake') ? 'Yes' : 'No'}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default HandshakeHandler;

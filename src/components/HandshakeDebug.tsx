import React from 'react';

const HandshakeDebug: React.FC = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const hasHandshake = urlParams.has('__clerk_handshake');
  const hasHandshakeToken = urlParams.has('__clerk_handshake_token');
  
  return (
    <div className="fixed bottom-4 right-4 bg-black bg-opacity-80 text-white p-4 rounded-lg text-xs max-w-sm">
      <h3 className="font-bold mb-2">Handshake Debug Info</h3>
      <div className="space-y-1">
        <div>URL: {window.location.href}</div>
        <div>Has Handshake: {hasHandshake ? '✅' : '❌'}</div>
        <div>Has Token: {hasHandshakeToken ? '✅' : '❌'}</div>
        <div>Path: {window.location.pathname}</div>
        <div>Search: {window.location.search}</div>
        {hasHandshake && (
          <div className="mt-2 p-2 bg-yellow-600 rounded">
            <div className="font-bold">Handshake Detected!</div>
            <div>This should trigger HandshakeHandler</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HandshakeDebug;

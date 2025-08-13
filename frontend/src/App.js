import React, { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import io from 'socket.io-client';

const API_BASE_URL = 'http://localhost:4000'; // Change this to your backend URL
const TELEGRAM_BOT_NAME = 'birbir_authbot'; // Change this to your bot name

function App() {
  const [sessionToken, setSessionToken] = useState(null);
  const [authStatus, setAuthStatus] = useState('idle'); // idle, loading, success, error
  const [jwt, setJwt] = useState(null);
  const [socket, setSocket] = useState(null);

  // Create session token
  const createSession = async () => {
    try {
      setAuthStatus('loading');
      const response = await fetch(`${API_BASE_URL}/api/auth/telegram/session`);
      const data = await response.json();

      if (data.sessionToken) {
        setSessionToken(data.sessionToken);
        setAuthStatus('idle');

        // Connect to WebSocket
        const newSocket = io(API_BASE_URL);
        setSocket(newSocket);

        // Join session room
        newSocket.emit('join_session', data.sessionToken);

        // Listen for authentication result
        newSocket.on('auth_result', (result) => {
          if (result.status === 'success') {
            setJwt(result.jwt);
            setAuthStatus('success');
            // Store JWT in localStorage
            localStorage.setItem('jwt', result.jwt);
          } else {
            setAuthStatus('error');
          }
        });
      } else {
        setAuthStatus('error');
      }
    } catch (error) {
      console.error('Error creating session:', error);
      setAuthStatus('error');
    }
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [socket]);

  // Check if user is already logged in
  useEffect(() => {
    const storedJwt = localStorage.getItem('jwt');
    if (storedJwt) {
      setJwt(storedJwt);
      setAuthStatus('success');
    }
  }, []);

  // Logout function
  const logout = () => {
    localStorage.removeItem('jwt');
    setJwt(null);
    setAuthStatus('idle');
    setSessionToken(null);
    if (socket) {
      socket.disconnect();
      setSocket(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">
          Telegram Authentication
        </h1>

        {authStatus === 'success' ? (
          <div className="text-center">
            <div className="bg-green-100 text-green-700 p-4 rounded-lg mb-4">
              <p className="font-semibold">Authentication Successful!</p>
              <p className="text-sm mt-2">You are now logged in.</p>
            </div>
            <button
              onClick={logout}
              className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              Logout
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {authStatus === 'loading' && (
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
                <p className="mt-2 text-gray-600">Creating session...</p>
              </div>
            )}

            {authStatus === 'error' && (
              <div className="bg-red-100 text-red-700 p-4 rounded-lg">
                <p className="font-semibold">Authentication Failed</p>
                <p className="text-sm mt-2">Please try again.</p>
              </div>
            )}

            {!sessionToken && authStatus !== 'loading' && (
              <button
                onClick={createSession}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              >
                Login with Telegram
              </button>
            )}

            {sessionToken && authStatus === 'idle' && (
              <div className="text-center">
                <p className="text-gray-700 mb-4">
                  Scan the QR code or click the link to login with Telegram
                </p>

                <div className="bg-white p-4 rounded-lg inline-block border">
                  <QRCode
                    size={256}
                    style={{ height: 'auto', maxWidth: '100%', width: '100%' }}
                    value={`https://t.me/${TELEGRAM_BOT_NAME}?start=${sessionToken}`}
                    viewBox={`0 0 256 256`}
                  />
                </div>

                <div className="mt-4">
                  <a
                    href={`https://t.me/${TELEGRAM_BOT_NAME}?start=${sessionToken}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:text-blue-700 underline"
                  >
                    Open Telegram
                  </a>
                </div>

                <p className="text-sm text-gray-500 mt-4">
                  Session expires in 2 minutes
                </p>
              </div>
            )}
          </div>
        )}

        {jwt && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">
              JWT Token
            </h2>
            <p className="text-xs text-gray-600 break-words">{jwt}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;

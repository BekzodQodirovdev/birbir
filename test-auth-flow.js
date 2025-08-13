// Simple test script to verify the authentication flow
// This is a basic test and not a comprehensive test suite

const axios = require('axios');
const { io } = require('socket.io-client');

// Configuration
const API_BASE_URL = 'http://localhost:4000';
const TELEGRAM_BOT_NAME = 'YOUR_BOT_NAME';

async function testAuthFlow() {
  console.log('Starting authentication flow test...');
  
  try {
    // Step 1: Create session
    console.log('1. Creating session...');
    const sessionResponse = await axios.get(`${API_BASE_URL}/auth/telegram/session`);
    const sessionToken = sessionResponse.data.sessionToken;
    console.log('   Session token:', sessionToken);
    
    // Step 2: Connect to WebSocket
    console.log('2. Connecting to WebSocket...');
    const socket = io(API_BASE_URL);
    
    // Wait for connection
    await new Promise(resolve => {
      socket.on('connect', () => {
        console.log('   WebSocket connected');
        resolve();
      });
    });
    
    // Step 3: Join session room
    console.log('3. Joining session room...');
    socket.emit('join_session', sessionToken);
    
    // Wait for session join confirmation
    await new Promise(resolve => {
      socket.on('session_joined', (data) => {
        console.log('   Session joined:', data);
        resolve();
      });
    });
    
    // Step 4: Listen for authentication result
    console.log('4. Waiting for authentication result...');
    const authResult = await new Promise(resolve => {
      socket.on('auth_result', (data) => {
        console.log('   Authentication result:', data);
        resolve(data);
      });
      
      // Simulate timeout after 30 seconds
      setTimeout(() => {
        resolve({ status: 'timeout', error: 'Authentication timeout' });
      }, 30000);
    });
    
    // Close WebSocket connection
    socket.disconnect();
    
    if (authResult.status === 'success') {
      console.log('✅ Authentication flow test PASSED');
      console.log('   JWT Token:', authResult.jwt);
    } else if (authResult.status === 'timeout') {
      console.log('⚠️  Authentication flow test TIMED OUT');
      console.log('   This is expected if you haven\'t completed the Telegram authentication');
    } else {
      console.log('❌ Authentication flow test FAILED');
      console.log('   Error:', authResult.error);
    }
    
  } catch (error) {
    console.error('❌ Authentication flow test FAILED with exception:', error.message);
  }
}

// Run the test
testAuthFlow();
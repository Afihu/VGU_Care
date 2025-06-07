import React, { useState } from 'react';
import axios from 'axios';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');
    
    try {
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Login successful
        setMessage(`Login successful! Welcome ${data.user.email}`);
        console.log('Login successful:', data);
        
        // Store user data (optional)
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // Redirect or handle successful login
        // Example: window.location.href = '/dashboard';
        
      } else {
        // Login failed
        setMessage(data.message || 'Login failed');
        console.error('Login failed:', data);
      }
      
    } catch (error) {
      console.error('Login error:', error);
      setMessage('Network error. Please check if the server is running.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-sm mx-auto">
      <h2 className="text-xl mb-4">Login</h2>
      <form onSubmit={handleLogin} className="flex flex-col gap-3">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="p-2 border rounded"
          required
          disabled={isLoading}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="p-2 border rounded"
          required
          disabled={isLoading}
        />
        <button 
          type="submit" 
          className={`p-2 rounded text-white ${
            isLoading 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-500 hover:bg-blue-600'
          }`}
          disabled={isLoading}
        >
          {isLoading ? 'Logging in...' : 'Login'}
        </button>
        {message && (
          <p className={`text-sm mt-2 ${
            message.includes('successful') 
              ? 'text-green-600' 
              : 'text-red-600'
          }`}>
            {message}
          </p>
        )}
      </form>
    </div>
  );
}
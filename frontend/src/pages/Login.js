import React, { useState } from 'react';
import api from '../services/api';
import logo_image from '../assets/images/yes.jpg';
import eye_icon from '../assets/others/see.svg';
import blind_icon from '../assets/others/no_see.svg';


import {useNavigate} from 'react-router-dom'; 

function Login() {

  const navigateTo = useNavigate();

  // initialize essential variables
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [passwordVisible, setPasswordVisibility] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');
    try {
      const response = await api.authService(email, password);
      const data = await response.json();

      //these should be handled by the page and thus not included in api refactor
      if (response.ok) {
        setMessage(`Login successful!`);
        console.log('Login successful:', data);
        localStorage.setItem('user', JSON.stringify(data.user));
        navigateTo('/home');
      } else {
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
    <div 
      style={{
        display : 'flex', 
        paddingTop : '40px', 
        alignItems : 'center', 
        flexDirection: 'column'
      }}
    >
      <img src={logo_image} className="login_logo" style = {{maxWidth: '300px'}}/>
      <div 
        style={{ 
          padding: '30px', 
          paddingTop: '15px', 
          maxWidth: '600px', 
          width: '500px', 
          margin: '50px auto', 
          border: '1px solid #ccc', 
          borderRadius: '8px', 
          boxShadow: '2px 2px 5px 0 rgba(0, 0, 0, 0.5)'
        }}
      >
        <h2 
          style={{ 
            textAlign: 'center', 
            marginBottom: '20px', 
            fontFamily: "Consolas", 
            fontSize: "larger", 
            borderBottom: "1px solid rgba(0, 0, 0, 0.3)", 
            color: "#0077B6" 
          }}
        >Login</h2>
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '15px' }}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
              style={{ 
                width: '100%', 
                padding: '12px', 
                fontSize: '16px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                boxSizing: 'border-box'
              }}
            />
          </div>
          <div style={{ marginBottom: '15px', position: "relative" }}>
            <div className='background'>
              <input
                type={passwordVisible ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                style={{ 
                  width: '100%', 
                  padding: '12px', 
                  paddingBottom: '12px',
                  fontSize: '16px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div 
              className='visibility-icon'
              style={{
                position: 'absolute',
                WebkitMaskImage: passwordVisible ? `url(${blind_icon})` : `url(${eye_icon})`, 
                maskImage: passwordVisible ? `url(${blind_icon})` : `url(${eye_icon})`,
                WebkitMaskRepeat: 'no-repeat',
                maskRepeat: 'no-repeat',
                WebkitMaskPosition: 'right',
                maskPosition: 'right',
                WebkitMaskSize: 'contain',
                maskSize: 'contain',
                cursor: 'pointer',

                width: '21px',
                height: '21px',
                backgroundColor: '#0077B6',

                left: '93%',
                top: '35%', // Start from the vertical center of the parent
                transform: 'translateY(-50%)', // Shift up by half its own height to perfectly center
                zIndex: 10
              }}
              onClick={() => setPasswordVisibility(!passwordVisible)}
            ></div>

            <label style={{ fontSize: "14px", color: "#4fa7ff", fontFamily: "Consolas" }}>
              Forgot password?
            </label>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            style={{ 
              width: '100%', 
              padding: '12px', 
              backgroundColor: isLoading ? '#ccc' : '#26da02',
              color: 'white',
              border: 'none',
              fontSize: '16px',
              borderRadius: '4px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              boxShadow: '2px 1px 1px 1px rgba(0, 0, 0, 0.2)'
            }}
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
          {message && (
            <div 
              style={{ 
                marginTop: '15px', 
                padding: '10px',
                borderRadius: '4px',
                backgroundColor: message.includes('successful') ? '#d4edda' : '#f8d7da',
                color: message.includes('successful') ? '#155724' : '#721c24',
                border: `1px solid ${message.includes('successful') ? '#c3e6cb' : '#f5c6cb'}`
              }}
            >
              {message}
            </div>
          )}
        </form>
      </div>
    </div>
      
    
  );
}

export default Login;
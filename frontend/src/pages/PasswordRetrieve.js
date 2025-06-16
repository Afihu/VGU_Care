import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import logo_image from '../assets/images/yes.jpg'

function PasswordRetrieve() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleRetrieval = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage('');
        try {
            // Code not tested yet    
            const response = await api.passwordRetrievalService(email);
            const data = await response.json();

            //these should be handled by the page and thus not included in api refactor
            if (response.ok) {
                setMessage(`Submission successful!`);
                console.log('Email found, submission successful:', data);
                localStorage.setItem('user', email);
            } else {
                setMessage(data.message || 'Login failed');
                console.error('Submission failed:', data);
            }
    
        } catch (error) {
        console.error('Submission error:', error);
        setMessage('Network error. Please check if the server is running.');
        } finally {
        setIsLoading(false);
        }
    };

    return(
        <div>
            <div
                style={{
                    display : 'flex', 
                    paddingTop : '40px', 
                    alignItems : 'center', 
                    flexDirection: 'column',
                }}
            >
                
                <div
                    style={{ 
                        padding: '30px', 
                        paddingTop: '15px', 
                        maxWidth: '600px', 
                        width: '500px', 
                        margin: '50px auto', 
                        border: '1px solid #ccc', 
                        borderRadius: '8px', 
                        boxShadow: '10px 10px 200px 30px rgba(0, 0, 0, 0.3)',
                        backgroundColor: 'white'
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
                    >Password Retrieval</h2>

                    <p
                    style={{
                        textAlign: 'center',
                        margin: '20px',
                        fontFamily: "Arial"
                    }}
                    >Enter the email you used to sign up, we will help you retrieve your password</p>

                    <form onSubmit={{}}> 
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
                                boxSizing: 'border-box',
                                marginBottom: '30px'
                            }}
                        />

                        <button 
                            type="submit" 
                            disabled={isLoading}
                            style={{ 
                                width: '100%', 
                                padding: '12px', 
                                background: isLoading ? '#ccc' : 'linear-gradient(90deg,rgba(59, 159, 85, 1) 24%, rgba(3, 107, 46, 1) 72%)',
                                color: 'white',
                                border: 'none',
                                fontSize: '16px',
                                borderRadius: '4px',
                                cursor: isLoading ? 'not-allowed' : 'pointer',
                                boxShadow: '2px 1px 1px 1px rgba(0, 0, 0, 0.2)'
                            }}
                            >
                            {isLoading ? 'Searching...' : 'Submit'}
                            </button>
                            {message && (
                            <div 
                                style={{ 
                                marginTop: '15px', 
                                padding: '10px',
                                borderRadius: '4px',
                                backgroundColor: message.includes('A retrieval email has been sent') ? '#d4edda' : '#f8d7da',
                                color: message.includes('has been sent') ? '#155724' : '#721c24',
                                border: `1px solid ${message.includes('successful') ? '#c3e6cb' : '#f5c6cb'}`
                                }}
                            >
                                {message}
                            </div>
                            )}
                    </form>
                </div>
            </div>
        </div>
    )
}

export default PasswordRetrieve;
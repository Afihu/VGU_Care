import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo_image from '../assets/images/yes.jpg'

function PasswordRetrieve() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);

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
                {/* <img src={logo_image} className="login_logo" style = {{maxWidth: '300px'}}/> */}
                <div
                    style={{ 
                        padding: '30px', 
                        paddingTop: '15px', 
                        maxWidth: '600px', 
                        width: '500px', 
                        margin: '50px auto', 
                        border: '1px solid #ccc', 
                        borderRadius: '8px', 
                        boxShadow: '2px 2px 5px 0 rgba(0, 0, 0, 0.5)',
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

                    <form>
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
                    </form>
                </div>
            </div>
        </div>
    )
}

export default PasswordRetrieve;
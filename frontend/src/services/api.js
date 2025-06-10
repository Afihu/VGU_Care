const API_BASE_URL = 'http://localhost:5001/api/login' //defin

const api = {
    authService : async(email, password) => {
        const response = await fetch(API_BASE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });
        
        return response; 
    },    
}

export default api;

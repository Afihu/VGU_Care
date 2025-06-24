const API_BASE_URL = 'http://localhost:5001/api' //define base api url

const handleApiError = async (response) => {
    if (!response.ok) {
        let error;
        try {
            const text = await response.text();
            error = text ? JSON.parse(text) : { error: 'An error occurred' };
        } catch (e) {
            // If response body can't be parsed as JSON
            error = { error: 'An error occurred' };
        }
        
        switch (response.status) {
        case 401:
            // Token expired or invalid
            localStorage.removeItem('token');
            localStorage.removeItem('session-info');
            console.log('Authentication failed:', response.status);
            // Redirect to login page
            window.location.href = '/login';
            throw new Error('Authentication failed. Please log in again.');
        case 403:
            // Access denied
            throw new Error('You do not have permission to perform this action');
        case 400:
            // Validation error
            throw new Error(error.error || 'Invalid input');
        case 404:
            throw new Error('Resource not found');
        default:
            throw new Error(error.error || 'An unexpected error occurred');
        }
    }
    return response;
};

const api = {
    authService : async(email, password) => {
        const apiEndpoint = API_BASE_URL + '/login';
        const response = await fetch(apiEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });
        
        return response; 
    },    

    passwordRetrievalService : async(email) => {
        const apiEndpoint = API_BASE_URL + '/password-retrieve';
        const response = await fetch(apiEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
        });
        
        return response; 
    }, 

    userRoleRetrieveService : async(token) => {
        try {
            const savedUserData = JSON.parse(localStorage.getItem('session-info'));
            if(savedUserData.token === token) return savedUserData.user.role;
        } catch (error) {
            console.warn("Invalid or unavailable JSON in storage");
        }
    },
    

    
    appointmentRetrieveService: async(token) => {
        const apiEndpoint = API_BASE_URL + '/appointments';
        
        //error here, fix later
        var response = await fetch(apiEndpoint, {
            method: 'GET',
            headers: {

                'Content-Type' : 'application/json',
                'Authorization': `Bearer ${token}` 
            }
        });
        
        try {
           const result = handleApiError(response);
           return result;
        } catch (error) {
            throw error;
        }

    },

    getMoodEntries: async (token) => {
        const apiEndpoint = API_BASE_URL + '/mood-entries';
        const response = await fetch(apiEndpoint, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        return handleApiError(response);
    },    getMedicalStaffProfile: async (token) => {
        const apiEndpoint = API_BASE_URL + '/medical-staff/profile';
        const response = await fetch(apiEndpoint, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        return handleApiError(response);  // handles 401, 403, etc.
    }
      
}

// Generic API call function for admin services
const apiCall = async (endpoint, options = {}) => {
    // Get token from session-info
    let token;
    try {
        const sessionInfo = localStorage.getItem('session-info');
        if (sessionInfo) {
            const parsed = JSON.parse(sessionInfo);
            token = parsed.token;
        }
    } catch (e) {
        console.warn('Failed to parse session-info:', e);
    }
    
    if (!token) {
        throw new Error('No authentication token found. Please log in.');
    }
    
    const apiEndpoint = API_BASE_URL + endpoint;
    
    const defaultOptions = {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    };
    
    const mergedOptions = { ...defaultOptions, ...options };
    
    // Merge headers separately to avoid overwriting Authorization
    if (options.headers) {
        mergedOptions.headers = { ...defaultOptions.headers, ...options.headers };
    }
    
    try {
        const response = await fetch(apiEndpoint, mergedOptions);
        
        if (!response.ok) {
            // Handle the error response
            await handleApiError(response);
        }
        
        // Only try to parse JSON if the response is ok
        return await response.json();
    } catch (error) {
        console.error('API call failed:', error);
        throw error;
    }
};

export default apiCall;
export { api };

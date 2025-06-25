const API_BASE_URL = 'http://localhost:5001/api' //define base api url

const handleApiError = async (response) => {
    if (!response.ok) {
        const error = await response.json();
        switch (response.status) {
        case 401:
            // Token expired or invalid
            localStorage.removeItem('token');
            console.log(response.status);
            break;
        case 403:
            // Access denied
            throw new Error('You do not have permission to perform this action');
        case 400:
            // Validation error
            throw new Error(error.error || 'Invalid input');
        case 404:
            throw new Error('Resource not found');
        default:
            throw new Error('An unexpected error occurred');
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
    
    studentRetrieveService: async(token) => {
        const apiEndpoint = API_BASE_URL + '/medical-staff/students';

        var response = await fetch(apiEndpoint, {
            method: 'GET',
            headers: {
                'Content-Type' : 'application/json',
                'Authorization': `Bearer ${token}` 
            }
        });

        try {
           await handleApiError(response);
           const data = await response.json();
           return data; 
        } catch (error) {
            throw error;
        }
    },
    
    reportRetrieveService: async(token) => {
        const apiEndpoint = API_BASE_URL + '/reports';

        var response = await fetch(apiEndpoint, {
            method: 'GET',
            headers: {
                'Content-Type' : 'application/json',
                'Authorization': `Bearer ${token}` 
            }
        });

        try {
           await handleApiError(response);
           const data = await response.json();
           return data;
        } catch (error) {
            throw error;
        }
    },

    //Request Appointment API Services
    getMedicalStaffProfile: async (token) => {
        const apiEndpoint = API_BASE_URL + '/medical-staff/profile';
        const response = await fetch(apiEndpoint, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        return handleApiError(response); 
    },

    //Track Mood API Services
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
    },    createMoodEntry: async (token, moodData) => {
        const apiEndpoint = API_BASE_URL + '/mood-entries';
        const response = await fetch(apiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(moodData)
        });
        return handleApiError(response);
    },

    // Notification API Services
    getNotifications: async (token) => {
        const apiEndpoint = API_BASE_URL + '/notifications';
        const response = await fetch(apiEndpoint, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        return handleApiError(response);
    },

    getUnreadNotificationCount: async (token) => {
        const apiEndpoint = API_BASE_URL + '/notifications/count';
        const response = await fetch(apiEndpoint, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        return handleApiError(response);
    },

    markNotificationAsRead: async (token, notificationId) => {
        const apiEndpoint = API_BASE_URL + `/notifications/${notificationId}/read`;
        const response = await fetch(apiEndpoint, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        return handleApiError(response);
    },

    markAllNotificationsAsRead: async (token) => {
        const apiEndpoint = API_BASE_URL + '/notifications/read-all';
        const response = await fetch(apiEndpoint, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        return handleApiError(response);
    },

    deleteNotification: async (token, notificationId) => {
        const apiEndpoint = API_BASE_URL + `/notifications/${notificationId}`;
        const response = await fetch(apiEndpoint, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        return handleApiError(response);
    }
      
}

export default api;

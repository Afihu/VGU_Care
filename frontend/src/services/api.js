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
        const apiEndpoint = API_BASE_URL + '/abuse-reports';

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
    
    tempAdviceCourierService : async(token, appointmentId, advice) => { 
        // POST /api/advice/appointments/:appointmentId
        // Medical staff sends advice for a specific appointment
        const apiEndpoint = API_BASE_URL + `/advice/appointments/${appointmentId}`;

        const response = await fetch(apiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ message: advice }),
        });

        try {
            await handleApiError(response);
            const data = await response.json();
            return data;
        } catch (error) {
            throw error;
        }
    },
    
    studentTempAdviceRetrieveService : async(token, appointmentId) => {
        // GET /api/advice/appointments/:appointmentId
        // student retrieves the advice for specific appointment
        const apiEndpoint = API_BASE_URL + `/advice/appointments/${appointmentId}`;

        const response = await fetch(apiEndpoint, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
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
    
    appointmentUpdateService : async(token, appointmentId, newSymptoms, newStatus, newPriority, newDateScheduled, newTimeScheduled) => {
        // PATCH /api/appointments/:appointmentId
        // this function takes in new values of the appointment and the appointment id, any value 
        // not needing to be updated will be "" but at least one field must be provided

        const apiEndpoint = API_BASE_URL + `/appointments/${appointmentId}`;

        const updateData = {};
        if (newSymptoms && newSymptoms !== "") updateData.symptoms = newSymptoms;
        if (newStatus && newStatus !== "") updateData.status = newStatus;
        if (newPriority && newPriority !== "") updateData.priorityLevel = newPriority;       
        if (newDateScheduled && newDateScheduled !== "") updateData.dateScheduled = newDateScheduled;   
        if (newTimeScheduled && newTimeScheduled !== "") updateData.timeScheduled = newTimeScheduled;   
        
        const response = await fetch(apiEndpoint, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(updateData)
        });

        try {
            await handleApiError(response);
            const data = await response.json();
            return data;
        } catch (error) {
            throw error;
        }
    },    

      user_specificAppointmentRetrieveService : async(token, userId) => {
        
        // GET /api/appointments/user/:userId
        // This function takes userId of the student and returns all appointments for that student
        // Note: Only medical staff can access this endpoint
        
        const apiEndpoint = API_BASE_URL + `/appointments/user/${userId}`;

        const response = await fetch(apiEndpoint, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
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
    
    abuseReportCourierService : async(token, reportText, reportType, appointmentId) => {
        // POST /api/abuse-reports/
        // medical staff creates an abuse report and posts it, reportType can be ""
        const apiEndpoint = API_BASE_URL + '/abuse-reports';

        // Build the report object
        const reportData = {
            appointmentId: appointmentId,
            description: reportText
        };
        
        // Only include reportType if it's not empty
        if (reportType && reportType !== "") {
            reportData.reportType = reportType;
        }

        const response = await fetch(apiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(reportData)
        });

        try {
            await handleApiError(response);
            const data = await response.json();
            return data;
        } catch (error) {
            throw error;
        }
    },    
    
    userProfileRetrieveService : async(token) => {
        // GET /api/users/me
        // Retrieves the current user's profile information
        const apiEndpoint = API_BASE_URL + '/users/me';

        const response = await fetch(apiEndpoint, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            }
        });

        try {
            await handleApiError(response);
            const data = response.ok ? await response.json() : null;
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
    },    deleteNotification: async (token, notificationId) => {
        const apiEndpoint = API_BASE_URL + `/notifications/${notificationId}`;
        const response = await fetch(apiEndpoint, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        return handleApiError(response);
    },
 }

export default api;

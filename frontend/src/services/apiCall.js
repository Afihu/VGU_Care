// services/apiCall.js
const apiCall = async (endpoint, options = {}) => {
    const token = localStorage.getItem('token');
  
    const defaultHeaders = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  
    const config = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };
  
    const response = await fetch(`http://localhost:5001/api${endpoint}`, config);
  
    return response;
  };
  
  export default apiCall;
  

  //we use this cause in the API_documentation.md says so
const helpers = {
    JSONparser : (JSONobject) => {
        var parsed;
        if(typeof JSONobject !== 'string' || !JSONobject.trim()){
            console.error('Invalid JSON in local storage');
            return null;
        }
        try {
            parsed = JSON.parse(JSONobject);
            return parsed;
        } catch (error) {
            console.warn('Error parsing JSON: ', error);
            return null;
        }
    }
} 

export default helpers;
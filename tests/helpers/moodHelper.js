/**
 * Mood Entry Test Helper
 * Provides utilities for testing mood entry functionality
 */

const { makeRequest, API_BASE_URL } = require('../testFramework');

class MoodHelper {
  constructor(testHelper) {
    this.testHelper = testHelper;
    this.authHelper = testHelper.authHelper;
  }

  /**
   * Create a mood entry for a user
   */
  async createMoodEntry(userType, moodData) {
    const defaultMoodData = {
      mood: 'happy',
      notes: 'Test mood entry'
    };
    
    const response = await makeRequest(`${API_BASE_URL}/api/mood-entries`, 'POST', 
      { ...defaultMoodData, ...moodData }, 
      { 'Authorization': `Bearer ${this.authHelper.getToken(userType)}` }
    );
    
    if (response.status === 200 || response.status === 201) {
      return response.body.moodEntry;
    }
    
    throw new Error(`Failed to create mood entry: ${response.status} - ${JSON.stringify(response.body)}`);
  }

  /**
   * Get mood entries for a user
   */
  async getMoodEntries(userType) {
    const response = await makeRequest(`${API_BASE_URL}/api/mood-entries`, 'GET', null, {
      'Authorization': `Bearer ${this.authHelper.getToken(userType)}`
    });
    
    if (response.status === 200) {
      return response.body.moodEntries || [];
    }
    
    throw new Error(`Failed to get mood entries: ${response.status} - ${JSON.stringify(response.body)}`);
  }
  /**
   * Update a mood entry
   */
  async updateMoodEntry(userType, moodEntryId, updateData) {
    const response = await makeRequest(`${API_BASE_URL}/api/mood-entries/${moodEntryId}`, 'PUT', updateData, {
      'Authorization': `Bearer ${this.authHelper.getToken(userType)}`
    });
    
    if (response.status === 200) {
      return response.body.moodEntry;
    }
    
    throw new Error(`Failed to update mood entry: ${response.status} - ${JSON.stringify(response.body)}`);
  }

  /**
   * Delete a mood entry
   */
  async deleteMoodEntry(userType, moodEntryId) {
    const response = await makeRequest(`${API_BASE_URL}/api/mood-entries/${moodEntryId}`, 'DELETE', null, {
      'Authorization': `Bearer ${this.authHelper.getToken(userType)}`
    });
    
    if (response.status === 200 || response.status === 204) {
      return response;
    }
    
    throw new Error(`Failed to delete mood entry: ${response.status} - ${JSON.stringify(response.body)}`);
  }

  /**
   * Validate mood entry structure
   */
  validateMoodEntryStructure(moodEntry, test) {
    const requiredFields = ['id', 'mood'];
    
    requiredFields.forEach(field => {
      test.assertProperty(moodEntry, field, `Mood entry should have ${field}`);
    });
    
    test.assert(['happy', 'sad', 'anxious', 'angry', 'excited', 'calm', 'stressed'].includes(moodEntry.mood), 
      `Invalid mood value: ${moodEntry.mood}`);
  }

  /**
   * Test unauthorized access to mood entries
   */
  async testUnauthorizedAccess(userType, moodEntryId) {
    const response = await makeRequest(`${API_BASE_URL}/api/mood-entries/${moodEntryId}`, 'GET', null, {
      'Authorization': `Bearer ${this.authHelper.getToken(userType)}`
    });
    
    return response;
  }
}

module.exports = MoodHelper;

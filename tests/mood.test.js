/**
 * Mood Entry Management Test Suite
 */

const { SimpleTest, ApiTestUtils, API_BASE_URL } = require('./testFramework');
const AuthHelper = require('./authHelper');

async function runMoodTests() {
  const test = new SimpleTest('Mood Entry Management');
  const authHelper = new AuthHelper();
  let testMoodEntryId;

  console.log(`🌐 Using API URL: ${API_BASE_URL}`);

  // Setup: Authenticate all users
  await authHelper.authenticateAllUsers();

  test.describe('Mood Entry CRUD Operations', function() {
    test.it('should create mood entry as student', async () => {
      const studentToken = authHelper.getToken('student');
      const moodData = {
        mood: 'happy',
        notes: 'Feeling good today!'
      };
      const response = await ApiTestUtils.testAuthenticatedRequest(
        studentToken,
        '/api/mood-entries',
        'POST',
        moodData,
        201
      );
      testMoodEntryId = response.body.moodEntry.id;
      ApiTestUtils.validateResponseStructure({ body: response.body.moodEntry }, ['id', 'user_id', 'mood', 'entry_date']);
    });

    test.it('should get mood entries as student', async () => {
      const studentToken = authHelper.getToken('student');
      const response = await ApiTestUtils.testAuthenticatedRequest(
        studentToken,
        '/api/mood-entries',
        'GET',
        null,
        200
      );
      if (!response.body.moodEntries || !Array.isArray(response.body.moodEntries)) {
        throw new Error('Response should contain moodEntries array');
      }
    });

    test.it('should update mood entry as student', async () => {
      if (!testMoodEntryId) {
        throw new Error('No test mood entry available for update');
      }
      const studentToken = authHelper.getToken('student');
      const updateData = {
        mood: 'stressed',
        notes: 'Changed mood after exam.'
      };
      const response = await ApiTestUtils.testAuthenticatedRequest(
        studentToken,
        `/api/mood-entries/${testMoodEntryId}`,
        'PATCH',
        updateData,
        200
      );
      ApiTestUtils.validateResponseStructure({ body: response.body.moodEntry }, ['id', 'user_id', 'mood', 'entry_date']);
    });
  });

  test.describe('Mood Entry Access Control', function() {
    test.it('should reject mood entry creation without authentication', async () => {
      await ApiTestUtils.testUnauthorizedAccess('/api/mood-entries', 'POST');
    });
    test.it('should reject mood entry access without authentication', async () => {
      await ApiTestUtils.testUnauthorizedAccess('/api/mood-entries', 'GET');
    });
    test.it('should reject mood entry update without authentication', async () => {
      await ApiTestUtils.testUnauthorizedAccess('/api/mood-entries/some-id', 'PATCH', { mood: 'sad' });
    });
    test.it('should reject mood entry creation as admin', async () => {
      const adminToken = authHelper.getToken('admin');
      const moodData = { mood: 'happy' };
      const response = await ApiTestUtils.testAuthenticatedRequest(
        adminToken,
        '/api/mood-entries',
        'POST',
        moodData,
        [403, 400]
      );
    });
    test.it('should reject mood entry creation as medical staff', async () => {
      const medicalToken = authHelper.getToken('medicalStaff');
      const moodData = { mood: 'happy' };
      const response = await ApiTestUtils.testAuthenticatedRequest(
        medicalToken,
        '/api/mood-entries',
        'POST',
        moodData,
        [403, 400]
      );
    });
  });

  await test.run();
  await authHelper.cleanup();
}

// Run tests if this file is executed directly
if (require.main === module) {
  runMoodTests().catch(console.error);
}

module.exports = runMoodTests;

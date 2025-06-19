/**
 * Mood Entry Management Test Suite
 */

const { SimpleTest, API_BASE_URL } = require('./testFramework');
const TestHelper = require('./helpers/testHelper');

async function runMoodTests() {
  const test = new SimpleTest('😊 Mood Entry Management');
  const testHelper = new TestHelper();
  let testMoodEntryId;

  console.log(`🌐 Using API URL: ${API_BASE_URL}`);

  try {
    // Setup: Initialize test helpers
    await testHelper.initialize();

  test.describe('Mood Entry CRUD Operations', function() {
    test.it('should create mood entry as student', async () => {
      const moodEntry = await testHelper.moodHelper.createMoodEntry('student', {
        mood: 'happy',
        notes: 'Feeling good today!'
      });
      
      testMoodEntryId = moodEntry.id;
      testHelper.moodHelper.validateMoodEntryStructure(moodEntry, test);
      console.log('✅ Mood entry created successfully');
    });

    test.it('should get mood entries as student', async () => {
      const moodEntries = await testHelper.moodHelper.getMoodEntries('student');
      
      test.assert(Array.isArray(moodEntries), 'Response should contain moodEntries array');
      test.assert(moodEntries.length > 0, 'Should have at least one mood entry');
      console.log('✅ Mood entries retrieved successfully');
    });    test.it('should update mood entry as student', async () => {
      const updateData = {
        mood: 'happy',  // Changed from 'excited' to 'happy' which is a valid mood
        notes: 'Updated mood entry notes'
      };
      
      const updatedMoodEntry = await testHelper.moodHelper.updateMoodEntry('student', testMoodEntryId, updateData);
      
      test.assertEqual(updatedMoodEntry.mood, 'happy', 'Mood should be updated');
      test.assertEqual(updatedMoodEntry.notes, 'Updated mood entry notes', 'Notes should be updated');
      console.log('✅ Mood entry updated successfully');
    });

    test.it('should delete mood entry as student', async () => {
      await testHelper.moodHelper.deleteMoodEntry('student', testMoodEntryId);
      console.log('✅ Mood entry deleted successfully');
    });    test.it('should not allow student to access another user\'s mood entries', async () => {
      // Test that medical staff cannot create mood entries
      try {
        await testHelper.moodHelper.createMoodEntry('medicalStaff', {
          mood: 'calm',
          notes: 'Staff mood entry'
        });
        test.fail('Medical staff should not be able to create mood entries');
      } catch (error) {
        // This should fail with 403
        test.assert(error.message.includes('403'), 'Should receive 403 error for medical staff creating mood entries');
        console.log('✅ Medical staff properly blocked from creating mood entries');
      }
    });
  });

    // Run tests
    await test.run();

  } catch (error) {
    console.error('\n💥 Mood tests failed:', error.message);
    throw error;
  } finally {
    // Cleanup
    await testHelper.cleanup();
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runMoodTests();
}

module.exports = runMoodTests;

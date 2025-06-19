/**
 * Main Test Helper Aggregator
 * Provides easy access to all testing utilities
 */

const AuthHelper = require('../authHelper');
const ProfileHelper = require('./profileHelper');
const AppointmentHelper = require('./appointmentHelper');
const AccessControlHelper = require('./accessControlHelper');
const MoodHelper = require('./moodHelper');
const NotificationHelper = require('./notificationHelper');
const MedicalStaffHelper = require('./medicalStaffHelper');

class TestHelper {
  constructor() {
    this.authHelper = new AuthHelper();
    this.profileHelper = new ProfileHelper(this);
    this.appointmentHelper = new AppointmentHelper(this);
    this.accessControlHelper = new AccessControlHelper(this);
    this.moodHelper = new MoodHelper(this);
    this.notificationHelper = new NotificationHelper(this);
    this.medicalStaffHelper = new MedicalStaffHelper(this);
    
    // Create aliases for better test readability
    this.auth = this.authHelper;
    this.profile = this.profileHelper;
    this.appointment = this.appointmentHelper;
    this.accessControl = this.accessControlHelper;
    this.mood = this.moodHelper;
    this.notification = this.notificationHelper;
    this.medicalStaff = this.medicalStaffHelper;
  }

  /**
   * Initialize all helpers and authenticate users
   */
  async initialize() {
    await this.authHelper.authenticateAllUsers();
    console.log('✅ Test helpers initialized and users authenticated');
  }

  /**
   * Clean up all test data
   */
  async cleanup() {
    if (this.appointmentHelper.cleanup) {
      await this.appointmentHelper.cleanup();
    }
    if (this.authHelper.cleanup) {
      await this.authHelper.cleanup();
    }
    console.log('✅ Test cleanup completed');
  }

  /**
   * Get quick access to common tokens
   */
  getTokens() {
    return {
      admin: this.authHelper.getToken('admin'),
      student: this.authHelper.getToken('student'),
      medicalStaff: this.authHelper.getToken('medicalStaff')
    };
  }

  /**
   * Get quick access to common users
   */
  getUsers() {
    return {
      admin: this.authHelper.getUser('admin'),
      student: this.authHelper.getUser('student'),
      medicalStaff: this.authHelper.getUser('medicalStaff')
    };
  }

  /**
   * Utility function to run a test with proper setup and cleanup
   */
  async runTestSuite(testSuiteName, testFunction) {
    console.log(`\n🧪 Starting ${testSuiteName}`);
    
    try {
      await this.initialize();
      await testFunction(this);
      console.log(`✅ ${testSuiteName} completed successfully`);
    } catch (error) {
      console.error(`❌ ${testSuiteName} failed:`, error.message);
      throw error;
    } finally {
      await this.cleanup();
    }
  }

  /**
   * Generate a comprehensive test report
   */
  generateTestReport(testResults) {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalSuites: 0,
        passedSuites: 0,
        failedSuites: 0,
        totalTests: 0,
        passedTests: 0,
        failedTests: 0
      },
      suites: []
    };

    Object.keys(testResults).forEach(suiteName => {
      const suite = testResults[suiteName];
      report.summary.totalSuites++;
      
      let suiteTests = 0;
      let suitePassed = 0;
      let suiteFailed = 0;

      if (suite.tests) {
        Object.keys(suite.tests).forEach(testName => {
          const test = suite.tests[testName];
          suiteTests++;
          report.summary.totalTests++;
          
          if (test.passed) {
            suitePassed++;
            report.summary.passedTests++;
          } else {
            suiteFailed++;
            report.summary.failedTests++;
          }
        });
      }

      if (suiteFailed === 0) {
        report.summary.passedSuites++;
      } else {
        report.summary.failedSuites++;
      }

      report.suites.push({
        name: suiteName,
        totalTests: suiteTests,
        passedTests: suitePassed,
        failedTests: suiteFailed,
        details: suite
      });
    });

    return report;
  }

  /**
   * Common validation utilities
   */
  static validateResponse(response, expectedStatus = 200) {
    return {
      statusOk: response.status === expectedStatus,
      hasBody: response.body !== null && response.body !== undefined,
      isJson: typeof response.body === 'object'
    };
  }

  static validateRequiredFields(object, requiredFields) {
    const validations = {};
    requiredFields.forEach(field => {
      validations[field] = object[field] !== undefined && object[field] !== null;
    });
    return validations;
  }

  static validateArrayResponse(response, itemValidator = null) {
    const validations = {
      isArray: Array.isArray(response.body),
      hasItems: response.body && response.body.length > 0
    };

    if (itemValidator && validations.isArray && validations.hasItems) {
      validations.allItemsValid = response.body.every(itemValidator);
    }

    return validations;
  }
}

module.exports = TestHelper;

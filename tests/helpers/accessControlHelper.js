/**
 * Access Control Testing Helper
 * Consolidates all access control and privilege testing utilities
 */

const { makeRequest, API_BASE_URL } = require('../testFramework');

class AccessControlHelper {
  constructor(testHelper) {
    this.testHelper = testHelper;
    this.authHelper = testHelper.authHelper;
  }

  /**
   * Test that an endpoint rejects unauthorized access (no token)
   */
  async testUnauthorizedEndpointAccess(endpoint, method = 'GET', data = null) {
    const response = await makeRequest(`${API_BASE_URL}${endpoint}`, method, data);
    return {
      status: response.status,
      shouldBe401: response.status === 401,
      body: response.body
    };
  }

  /**
   * Test endpoint access with different user roles
   */
  async testEndpointAccess(endpoint, method = 'GET', data = null, expectedResults = {}) {
    const results = {};
    const userTypes = ['admin', 'student', 'medicalStaff'];

    for (const userType of userTypes) {
      try {
        const response = await makeRequest(`${API_BASE_URL}${endpoint}`, method, data, {
          'Authorization': `Bearer ${this.authHelper.getToken(userType)}`
        });

        results[userType] = {
          status: response.status,
          success: response.status >= 200 && response.status < 300,
          body: response.body
        };
      } catch (error) {
        results[userType] = {
          status: null,
          success: false,
          error: error.message
        };
      }
    }

    // Validate against expected results
    const validations = {};
    Object.keys(expectedResults).forEach(userType => {
      const expected = expectedResults[userType];
      const actual = results[userType];
      
      validations[userType] = {
        statusMatch: actual.status === expected.status,
        accessMatch: actual.success === expected.shouldHaveAccess
      };
    });

    return { results, validations };
  }

  /**
   * Test unauthorized access (no token)
   */
  async testUnauthorizedAccess(endpoint, method = 'GET', data = null) {
    const response = await makeRequest(`${API_BASE_URL}${endpoint}`, method, data);
    
    return {
      response,
      validations: {
        properlyRejected: response.status === 401,
        hasErrorMessage: response.body && response.body.message
      }
    };
  }

  /**
   * Test invalid token access
   */
  async testInvalidTokenAccess(endpoint, method = 'GET', data = null) {
    const response = await makeRequest(`${API_BASE_URL}${endpoint}`, method, data, {
      'Authorization': 'Bearer invalid-token-12345'
    });
    
    return {
      response,
      validations: {
        properlyRejected: response.status === 401,
        hasErrorMessage: response.body && response.body.message
      }
    };
  }

  /**
   * Test admin-only endpoints
   */
  async testAdminOnlyAccess(endpoint, method = 'GET', data = null) {
    return await this.testEndpointAccess(endpoint, method, data, {
      admin: { status: 200, shouldHaveAccess: true },
      student: { status: 403, shouldHaveAccess: false },
      medicalStaff: { status: 403, shouldHaveAccess: false }
    });
  }

  /**
   * Test medical staff only endpoints
   */
  async testMedicalStaffOnlyAccess(endpoint, method = 'GET', data = null) {
    return await this.testEndpointAccess(endpoint, method, data, {
      admin: { status: 200, shouldHaveAccess: true }, // Admin usually has access to everything
      student: { status: 403, shouldHaveAccess: false },
      medicalStaff: { status: 200, shouldHaveAccess: true }
    });
  }

  /**
   * Test student-accessible endpoints
   */
  async testStudentAccess(endpoint, method = 'GET', data = null) {
    return await this.testEndpointAccess(endpoint, method, data, {
      admin: { status: 200, shouldHaveAccess: true },
      student: { status: 200, shouldHaveAccess: true },
      medicalStaff: { status: 200, shouldHaveAccess: true }
    });
  }

  /**
   * Test resource ownership access (user can only access their own resources)
   */
  async testResourceOwnershipAccess(resourceEndpoint, resourceId, ownerUserType) {
    const results = {};
    const userTypes = ['admin', 'student', 'medicalStaff'];

    for (const userType of userTypes) {
      try {
        const response = await makeRequest(`${API_BASE_URL}${resourceEndpoint}/${resourceId}`, 'GET', null, {
          'Authorization': `Bearer ${this.authHelper.getToken(userType)}`
        });

        results[userType] = {
          status: response.status,
          canAccess: response.status >= 200 && response.status < 300,
          body: response.body
        };
      } catch (error) {
        results[userType] = {
          status: null,
          canAccess: false,
          error: error.message
        };
      }
    }

    return {
      results,
      validations: {
        ownerCanAccess: results[ownerUserType]?.canAccess || false,
        adminCanAccess: results.admin?.canAccess || false,
        othersBlocked: userTypes
          .filter(type => type !== ownerUserType && type !== 'admin')
          .every(type => !results[type]?.canAccess)
      }
    };
  }

  /**
   * Test CORS and security headers
   */
  async testSecurityHeaders(endpoint) {
    const response = await makeRequest(`${API_BASE_URL}${endpoint}`, 'OPTIONS');
    
    return {
      response,
      validations: {
        hasSecurityHeaders: response.headers && (
          response.headers['access-control-allow-origin'] ||
          response.headers['x-frame-options'] ||
          response.headers['x-content-type-options']
        ),
        allowsOptions: response.status === 200 || response.status === 204
      }
    };
  }

  /**
   * Generate access control test report
   */
  generateAccessReport(testResults) {
    const report = {
      summary: {
        totalTests: 0,
        passedTests: 0,
        failedTests: 0
      },
      details: []
    };

    Object.keys(testResults).forEach(testName => {
      const result = testResults[testName];
      report.summary.totalTests++;
      
      if (result.validations && Object.values(result.validations).every(v => v === true)) {
        report.summary.passedTests++;
      } else {
        report.summary.failedTests++;
        report.details.push({
          test: testName,
          issues: result.validations
        });
      }
    });

    return report;
  }
}

module.exports = AccessControlHelper;

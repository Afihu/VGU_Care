/**
 * Simple Node.js Test Framework
 * Provides basic testing utilities for Node.js without external dependencies
 */

class SimpleTest {
  constructor(suiteName) {
    this.suiteName = suiteName;
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
    this.errors = [];
  }

  describe(name, callback) {
    console.log(`\n🧪 ${name}`);
    callback.call(this);
  }

  it(description, testFunction) {
    this.tests.push({ description, testFunction });
  }

  async run() {
    console.log(`\n🏁 Running ${this.suiteName}`);
    console.log('=' .repeat(50));

    for (const test of this.tests) {
      try {
        console.log(`\n⏳ ${test.description}`);
        await test.testFunction();
        this.passed++;
        console.log(`✅ PASSED: ${test.description}`);
      } catch (error) {
        this.failed++;
        this.errors.push({ description: test.description, error });
        console.log(`❌ FAILED: ${test.description}`);
        console.log(`   Error: ${error.message}`);
      }
    }

    this.printSummary();
  }

  printSummary() {
    console.log('\n' + '=' .repeat(50));
    console.log(`📊 Test Summary for ${this.suiteName}`);
    console.log(`✅ Passed: ${this.passed}`);
    console.log(`❌ Failed: ${this.failed}`);
    console.log(`📈 Total: ${this.tests.length}`);
    
    if (this.failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.errors.forEach(({ description, error }) => {
        console.log(`   - ${description}: ${error.message}`);
      });
      process.exit(1);
    } else {
      console.log('\n🎉 All tests passed!');
    }
  }

  // Assertion helpers
  assert(condition, message = 'Assertion failed') {
    if (!condition) {
      throw new Error(message);
    }
  }

  assertEqual(actual, expected, message) {
    if (actual !== expected) {
      throw new Error(message || `Expected ${expected}, but got ${actual}`);
    }
  }

  assertNotEqual(actual, expected, message) {
    if (actual === expected) {
      throw new Error(message || `Expected values to be different, but both were ${actual}`);
    }
  }

  assertTrue(value, message) {
    this.assertEqual(value, true, message || `Expected true, but got ${value}`);
  }

  assertFalse(value, message) {
    this.assertEqual(value, false, message || `Expected false, but got ${value}`);
  }

  assertExists(value, message) {
    if (value === null || value === undefined) {
      throw new Error(message || `Expected value to exist, but got ${value}`);
    }
  }

  assertType(value, expectedType, message) {
    const actualType = typeof value;
    if (actualType !== expectedType) {
      throw new Error(message || `Expected type ${expectedType}, but got ${actualType}`);
    }
  }

  assertProperty(object, property, message) {
    if (!object.hasOwnProperty(property)) {
      throw new Error(message || `Expected object to have property '${property}'`);
    }
  }

  assertArrayLength(array, expectedLength, message) {
    if (!Array.isArray(array)) {
      throw new Error(message || `Expected an array, but got ${typeof array}`);
    }
    if (array.length !== expectedLength) {
      throw new Error(message || `Expected array length ${expectedLength}, but got ${array.length}`);
    }
  }

  assertIncludes(array, value, message) {
    if (!Array.isArray(array)) {
      throw new Error(message || `Expected an array, but got ${typeof array}`);
    }
    if (!array.includes(value)) {
      throw new Error(message || `Expected array to include ${value}`);
    }
  }
}

module.exports = SimpleTest;

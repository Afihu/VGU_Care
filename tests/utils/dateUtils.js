/**
 * Date Utility for Tests
 * Provides dynamic date generation to prevent time slot conflicts
 */

class DateUtils {
  /**
   * Get the next available weekday (Monday-Friday)
   * @param {number} daysAhead - How many days ahead to start searching (default: 1)
   * @returns {string} Date in YYYY-MM-DD format
   */
  static getNextWeekday(daysAhead = 1) {
    const date = new Date();
    date.setDate(date.getDate() + daysAhead);
    
    // Skip weekends - find next Monday-Friday
    while (date.getDay() === 0 || date.getDay() === 6) {
      date.setDate(date.getDate() + 1);
    }
    
    return date.toISOString().split('T')[0]; // YYYY-MM-DD format
  }

  /**
   * Get multiple different weekdays for testing
   * @param {number} count - Number of different dates needed
   * @param {number} startDaysAhead - Starting point (default: 1)
   * @returns {string[]} Array of dates in YYYY-MM-DD format
   */
  static getMultipleWeekdays(count = 3, startDaysAhead = 1) {
    const dates = [];
    let currentDaysAhead = startDaysAhead;
    
    while (dates.length < count) {
      const date = this.getNextWeekday(currentDaysAhead);
      if (!dates.includes(date)) {
        dates.push(date);
      }
      currentDaysAhead++;
    }
    
    return dates;
  }

  /**
   * Get a weekend date (for testing invalid appointment dates)
   * @param {number} daysAhead - How many days ahead to start searching (default: 1)
   * @returns {string} Date in YYYY-MM-DD format
   */
  static getNextWeekend(daysAhead = 1) {
    const date = new Date();
    date.setDate(date.getDate() + daysAhead);
    
    // Find next Saturday or Sunday
    while (date.getDay() !== 0 && date.getDay() !== 6) {
      date.setDate(date.getDate() + 1);
    }
    
    return date.toISOString().split('T')[0]; // YYYY-MM-DD format
  }

  /**
   * Format date for display
   * @param {string} dateString - Date in YYYY-MM-DD format
   * @returns {string} Formatted date string
   */
  static formatDate(dateString) {
    const date = new Date(dateString);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}`;
  }

  /**
   * Check if a date is a weekday
   * @param {string} dateString - Date in YYYY-MM-DD format
   * @returns {boolean} True if weekday, false if weekend
   */
  static isWeekday(dateString) {
    const date = new Date(dateString);
    const day = date.getDay();
    return day >= 1 && day <= 5; // Monday = 1, Friday = 5
  }

  /**
   * Get date N days from now
   * @param {number} days - Number of days to add
   * @returns {string} Date in YYYY-MM-DD format
   */
  static getDaysFromNow(days) {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  }
}

module.exports = DateUtils;

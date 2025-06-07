/**
 * Utility functions for handling MySQL timestamps consistently
 */

/**
 * Format a MySQL timestamp for display while preserving the original format
 * @param {string} mysqlTimestamp - MySQL timestamp string
 * @returns {string} - Formatted timestamp string
 */
const formatTimestamp = (mysqlTimestamp) => {
  if (!mysqlTimestamp) return null

  // Return the original MySQL timestamp format
  return mysqlTimestamp
}

/**
 * Get current timestamp in MySQL format
 * @returns {string} - Current timestamp in MySQL format
 */
const getCurrentMySQLTimestamp = () => {
  // This will be replaced by MySQL's NOW() function in queries
  return new Date().toISOString().slice(0, 19).replace("T", " ")
}

/**
 * Convert JavaScript Date to MySQL timestamp format
 * @param {Date} date - JavaScript Date object
 * @returns {string} - MySQL timestamp string
 */
const dateToMySQLTimestamp = (date) => {
  if (!date) return null
  return date.toISOString().slice(0, 19).replace("T", " ")
}

module.exports = {
  formatTimestamp,
  getCurrentMySQLTimestamp,
  dateToMySQLTimestamp,
}

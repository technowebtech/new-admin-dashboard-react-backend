const { getDatabaseList } = require('../config/database');

/**
 * Get current user profile
 */
const getHeath = async (req, res) => {
  res.status(200).json({
    status: true,
    message: 'Server is running successfully',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    availableDatabases: getDatabaseList()
  });
};
const getMatrix = async (req, res) => {
  const metrics = global.apiMetrics || [];
  const summary = {
    totalCalls: metrics.length,
    averageResponseTime:
      metrics.length > 0
        ? metrics.reduce((sum, call) => sum + call.responseTime, 0) / metrics.length
        : 0,
    statusCodes: metrics.reduce((acc, call) => {
      acc[call.statusCode] = (acc[call.statusCode] || 0) + 1;
      return acc;
    }, {}),
    topEndpoints: Object.entries(
      metrics.reduce((acc, call) => {
        const key = `${call.method} ${call.path}`;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {})
    )
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
  };

  res.json({
    status: true,
    data: {
      summary,
      recentCalls: metrics.slice(-50)
    }
  });
};
module.exports = {
  getHeath,
  getMatrix
};

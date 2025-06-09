const { executeQuery } = require('../../../config/database');

/**
 * Get all roles (Admin only)
 */
const getAllRoles = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;

    // Ensure they're valid numbers
    if (isNaN(limit) || isNaN(offset)) {
      return res.status(400).json({ status: false, message: 'Invalid pagination parameters' });
    }

    // Total count
    const countResult = await executeQuery('SELECT COUNT(*) as total FROM user_type', []);
    const total = countResult[0].total;

    // Paginated roles
    const roles = await executeQuery(
      `SELECT * FROM user_type ORDER BY user_type ASC LIMIT ? OFFSET ?`,
      [`${limit}`, `${offset}`]
    );

    res.status(200).json({
      status: true,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      data: roles
    });
  } catch (error) {
    console.error('Get all roles error:', error);
    res.status(500).json({
      status: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get role by ID
 */
const getById = async (req, res) => {
  try {
    const { id } = req.params;

    const roles = await executeQuery('select * from user_type where id = ?', [id.toString()]);

    if (roles.length === 0) {
      return res.status(404).json({
        status: false,
        message: 'Role not found'
      });
    }

    res.status(200).json({
      status: true,
      data: roles[0]
    });
  } catch (error) {
    console.error('Get role by ID error:', error);
    res.status(500).json({
      status: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  getAllRoles,
  getById
};

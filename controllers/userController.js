const { executeQuery } = require('../config/database');
const encryptionsDecryption = require('../utils/encriptionDEcription');

/**
 * Get current user profile
 */
const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const users = await executeQuery(
      'select *, u.id as userId,p.id as profileId,user_type as role from tbl_user u inner join tbl_profile p on u.id=p.user_id WHERE u.id = ? AND u.status = 1',
      [userId]
    );
    const { password_new, temp_password, id, ...safeUser } = users[0];

    if (users.length === 0) {
      return res.status(404).json({
        status: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      status: true,
      data: encryptionsDecryption.EncryptDataApi(JSON.stringify(safeUser))
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      status: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Update current user profile
 */
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, phone, bio } = req.body;

    // Build dynamic update query
    const updateFields = [];
    const updateValues = [];

    if (name !== undefined) {
      updateFields.push('name = ?');
      updateValues.push(name);
    }
    if (phone !== undefined) {
      updateFields.push('phone = ?');
      updateValues.push(phone);
    }
    if (bio !== undefined) {
      updateFields.push('bio = ?');
      updateValues.push(bio);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        status: false,
        message: 'No fields to update'
      });
    }

    updateFields.push('updated_at = NOW()');
    updateValues.push(userId);

    const query = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`;

    const result = await executeQuery(query, updateValues);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        status: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      status: true,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      status: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get all users (Admin only)
 */
const getAllUsers = async (req, res) => {
  try {
    const page = Number.parseInt(req.query.page) || 1;
    const limit = Number.parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Get total count
    const countResult = await executeQuery('SELECT COUNT(*) as total FROM users', []);
    const total = countResult[0].total;

    // Get users with pagination
    const users = await executeQuery(
      'SELECT id, name, email, phone, role, status, created_at, last_login FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [limit, offset]
    );

    res.status(200).json({
      status: true,
      data: {
        users,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      status: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get user by ID
 */
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const users = await executeQuery('SELECT * FROM tbl_user WHERE id = ?', [id.toString()]);

    if (users.length === 0) {
      return res.status(404).json({
        status: false,
        message: 'User not found'
      });
    }
    const { password_new, password, temp_password, ...safeUser } = users[0];

    res.status(200).json({
      status: true,
      data: safeUser
    });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({
      status: false,
      message: 'Internal server error'
    });
  }
};
const searchByKey = async (req, res) => {
  try {
    const allowedKeys = [
      'u.id',
      'p.first_name',
      'p.mid_name',
      'p.last_name',
      'u.user_type',
      'p.designation_id',
      'p.department_id'
    ]; // whitelist
    const { key, value } = req.query;

    if (!allowedKeys.includes(key)) {
      return res.status(400).json({ error: 'Invalid search key' });
    }
    const searchTerm = `%${value}%`;

    const sql = `SELECT *, u.id AS userId, p.id AS profileId, user_type AS role ,TRIM(CONCAT(COALESCE(p.first_name, ''), ' ', COALESCE(p.mid_name, ''), ' ', COALESCE(p.last_name, ''))) AS fullName  FROM tbl_user u  INNER JOIN tbl_profile p ON u.id = p.user_id  WHERE ${key} = ? AND u.status = 1`;

    console.log('🚀 ~ searchUserByName ~ sql:', sql);
    const users = await executeQuery(sql, [searchTerm]);

    if (users.length === 0) {
      return res.status(404).json({
        status: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      status: true,
      data: users
    });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({
      status: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  getAllUsers,
  getUserById,
  searchByKey
};

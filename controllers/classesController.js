const { executeQuery } = require('../config/database');

/**
 * Get current classes profile
 */
const getProfile = async (req, res) => {
  try {
    const clasesId = req.user.id;

    const classes = await executeQuery(
      'SELECT id, name, email, phone, subject, experience, qualification, status, created_at, updated_at FROM classes WHERE id = ?',
      [clasesId]
    );

    if (classes.length === 0) {
      return res.status(404).json({
        status: false,
        message: 'classes not found'
      });
    }

    res.status(200).json({
      status: true,
      data: classes[0]
    });
  } catch (error) {
    console.error('Get classes profile error:', error);
    res.status(500).json({
      status: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Update current classes profile
 */
const updateProfile = async (req, res) => {
  try {
    const clasesId = req.user.id;
    const { name, phone, subject, experience, qualification } = req.body;

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
    if (subject !== undefined) {
      updateFields.push('subject = ?');
      updateValues.push(subject);
    }
    if (experience !== undefined) {
      updateFields.push('experience = ?');
      updateValues.push(experience);
    }
    if (qualification !== undefined) {
      updateFields.push('qualification = ?');
      updateValues.push(qualification);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        status: false,
        message: 'No fields to update'
      });
    }

    updateFields.push('updated_at = NOW()');
    updateValues.push(clasesId);

    const query = `UPDATE classes SET ${updateFields.join(', ')} WHERE id = ?`;

    const result = await executeQuery(query, updateValues);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        status: false,
        message: 'classes not found'
      });
    }

    res.status(200).json({
      status: true,
      message: 'classes profile updated successfully'
    });
  } catch (error) {
    console.error('Update classes profile error:', error);
    res.status(500).json({
      status: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get all classes (Admin only)
 */
const getAllClasses = async (req, res) => {
  try {
    const page = Number.parseInt(req.query.page) || 1;
    const limit = Number.parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const countResult = await executeQuery('SELECT COUNT(*) as total FROM class', []);
    const total = countResult[0].total;

    const classes = await executeQuery(
      'select * from class ORDER BY class_name asc LIMIT ? OFFSET ?',
      [limit, offset]
    );

    res.status(200).json({
      status: true,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      data: classes
    });
  } catch (error) {
    console.error('Get all classes error:', error);
    res.status(500).json({
      status: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get classes by ID
 */
const getById = async (req, res) => {
  try {
    const { id } = req.params;

    const classes = await executeQuery('SELECT * FROM class WHERE id = ?', [id]);

    if (classes.length === 0) {
      return res.status(404).json({
        status: false,
        message: 'classes not found'
      });
    }

    res.status(200).json({
      status: true,
      data: classes[0]
    });
  } catch (error) {
    console.error('Get classes by ID error:', error);
    res.status(500).json({
      status: false,
      message: 'Internal server error'
    });
  }
};
/**
 * Search class by key-value pair
 * Method-level enums (apply only to this method)
 * @paramEnum key: ['id','school_id','class_name','sort_name','other_name','cps_class_name'] - Search class by key field
 */
const searchClassByKey = async (req, res) => {
  try {
    const allowedKeys = [
      'id',
      'school_id',
      'class_name',
      'sort_name',
      'other_name',
      'cps_class_name'
    ]; // whitelist
    const { key, value } = req.params;

    if (!allowedKeys.includes(key)) {
      return res.status(400).json({
        status: false,
        message: `Invalid search key. Allowed keys: ${allowedKeys.join(', ')}`
      });
    }
    const searchTerm = `%${value}%`;

    const sql = `SELECT * FROM class WHERE ${key} = ? `;

    const classes = await executeQuery(sql, [searchTerm]);

    if (classes.length === 0) {
      return res.status(404).json({
        status: false,
        message: 'Data not found'
      });
    }

    res.status(200).json({
      status: true,
      data: classes
    });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({
      status: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Create new classes
 */
const createclases = async (req, res) => {
  try {
    const { name, email, phone, subject, experience, qualification } = req.body;

    const existingclases = await executeQuery('SELECT id FROM classes WHERE email = ?', [email]);

    if (existingclases.length > 0) {
      return res.status(409).json({
        status: false,
        message: 'classes with this email already exists'
      });
    }

    const result = await executeQuery(
      'INSERT INTO classes (name, email, phone, subject, experience, qualification, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())',
      [name, email, phone, subject, experience, qualification, 'active']
    );

    res.status(201).json({
      status: true,
      message: 'classes created successfully',
      data: {
        clasesId: result.insertId,
        name,
        email
      }
    });
  } catch (error) {
    console.error('Create classes error:', error);
    res.status(500).json({
      status: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Update classes
 */
const updateclases = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, subject, experience, qualification } = req.body;

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
    if (subject !== undefined) {
      updateFields.push('subject = ?');
      updateValues.push(subject);
    }
    if (experience !== undefined) {
      updateFields.push('experience = ?');
      updateValues.push(experience);
    }
    if (qualification !== undefined) {
      updateFields.push('qualification = ?');
      updateValues.push(qualification);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        status: false,
        message: 'No fields to update'
      });
    }

    updateFields.push('updated_at = NOW()');
    updateValues.push(id);

    const query = `UPDATE classes SET ${updateFields.join(', ')} WHERE id = ?`;

    const result = await executeQuery(query, updateValues);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        status: false,
        message: 'classes not found'
      });
    }

    res.status(200).json({
      status: true,
      message: 'classes updated successfully'
    });
  } catch (error) {
    console.error('Update classes error:', error);
    res.status(500).json({
      status: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Delete classes
 */
const deleteclases = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await executeQuery('DELETE FROM classes WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        status: false,
        message: 'classes not found'
      });
    }

    res.status(200).json({
      status: true,
      message: 'classes deleted successfully'
    });
  } catch (error) {
    console.error('Delete classes error:', error);
    res.status(500).json({
      status: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  getAllClasses,
  getById,
  searchClassByKey
  // updateProfile,
  // getclasesById,
  // createclases,
  // updateclases,
  // deleteclases
};

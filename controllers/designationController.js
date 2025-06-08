const { executeQuery } = require('../config/database');
/**
 * Search class by key-value pair
 * Method-level enums (apply only to this method)
 * @paramEnum key: ['id','designation'] - Search class by key field
 */

/**
 * Get current Designation profile
 */
const getProfile = async (req, res) => {
  try {
    const schoolId = req.user.id;

    const Designation = await executeQuery(
      'SELECT id, name, email, phone, subject, experience, qualification, status, created_at, updated_at FROM Designation WHERE id = ?',
      [schoolId]
    );

    if (Designation.length === 0) {
      return res.status(404).json({
        status: false,
        message: 'Designation not found'
      });
    }

    res.status(200).json({
      status: true,
      data: Designation[0]
    });
  } catch (error) {
    console.error('Get Designation profile error:', error);
    res.status(500).json({
      status: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Update current Designation profile
 */
const updateProfile = async (req, res) => {
  try {
    const schoolId = req.user.id;
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
    updateValues.push(schoolId);

    const query = `UPDATE Designation SET ${updateFields.join(', ')} WHERE id = ?`;

    const result = await executeQuery(query, updateValues);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        status: false,
        message: 'Designation not found'
      });
    }

    res.status(200).json({
      status: true,
      message: 'Designation profile updated successfully'
    });
  } catch (error) {
    console.error('Update Designation profile error:', error);
    res.status(500).json({
      status: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get all Designation (Admin only)
 */
const getAllDesignations = async (req, res) => {
  try {
    const page = Number.parseInt(req.query.page) || 1;
    const limit = Number.parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const countResult = await executeQuery('SELECT COUNT(*) as total FROM designation', []);
    const total = countResult[0].total;

    const Designation = await executeQuery(
      'select * from designation ORDER BY designation asc LIMIT ? OFFSET ?',
      [limit.toString(), offset.toString()]
    );

    res.status(200).json({
      status: true,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      data: Designation
    });
  } catch (error) {
    console.error('Get all Designation error:', error);
    res.status(500).json({
      status: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get Designation by ID
 */
const getDesignationById = async (req, res) => {
  try {
    const { id } = req.params;

    const Designation = await executeQuery('SELECT * FROM designation WHERE id = ?', [id]);

    if (Designation.length === 0) {
      return res.status(404).json({
        status: false,
        message: 'Designation not found'
      });
    }

    res.status(200).json({
      status: true,
      data: Designation[0]
    });
  } catch (error) {
    console.error('Get Designation by ID error:', error);
    res.status(500).json({
      status: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get classes by key
 */

const searchDesignationByKey = async (req, res) => {
  try {
    const allowedKeys = ['id', 'designation']; // whitelist
    const { key, value } = req.query;

    if (!allowedKeys.includes(key)) {
      return res.status(400).json({ error: 'Invalid search key' });
    }
    const searchTerm = `%${value}%`;

    const sql = `SELECT * FROM designation WHERE ${key} = ? `;

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
}; /**
 * Get classes by key
 */
/**
 * Create new Designation
 */
const createschool = async (req, res) => {
  try {
    const { name, email, phone, subject, experience, qualification } = req.body;

    const existingschool = await executeQuery('SELECT id FROM Designation WHERE email = ?', [
      email
    ]);

    if (existingschool.length > 0) {
      return res.status(409).json({
        status: false,
        message: 'Designation with this email already exists'
      });
    }

    const result = await executeQuery(
      'INSERT INTO Designation (name, email, phone, subject, experience, qualification, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())',
      [name, email, phone, subject, experience, qualification, 'active']
    );

    res.status(201).json({
      status: true,
      message: 'Designation created successfully',
      data: {
        schoolId: result.insertId,
        name,
        email
      }
    });
  } catch (error) {
    console.error('Create Designation error:', error);
    res.status(500).json({
      status: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Update Designation
 */
const updateschool = async (req, res) => {
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

    const query = `UPDATE Designation SET ${updateFields.join(', ')} WHERE id = ?`;

    const result = await executeQuery(query, updateValues);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        status: false,
        message: 'Designation not found'
      });
    }

    res.status(200).json({
      status: true,
      message: 'Designation updated successfully'
    });
  } catch (error) {
    console.error('Update Designation error:', error);
    res.status(500).json({
      status: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Delete Designation
 */
const deleteschool = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await executeQuery('DELETE FROM Designation WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        status: false,
        message: 'Designation not found'
      });
    }

    res.status(200).json({
      status: true,
      message: 'Designation deleted successfully'
    });
  } catch (error) {
    console.error('Delete Designation error:', error);
    res.status(500).json({
      status: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  getAllDesignations,
  getDesignationById,
  searchDesignationByKey

  // updateProfile,
  // getschoolById,
  // createschool,
  // updateschool,
  // deleteschool
};

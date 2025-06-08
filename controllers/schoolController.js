const { executeQuery } = require('../config/database');
/**
 * Search class by key-value pair
 * Method-level enums (apply only to this method)
 * @paramEnum key: ['id','school_name','sort_name','abbr','gr_name','sub_name','state','ci','full_name'] - Search class by key field
 */

/**
 * Get current school profile
 */
const getProfile = async (req, res) => {
  try {
    const schoolId = req.user.id;

    const school = await executeQuery(
      'SELECT id, name, email, phone, subject, experience, qualification, status, created_at, updated_at FROM school WHERE id = ?',
      [schoolId]
    );

    if (school.length === 0) {
      return res.status(404).json({
        status: false,
        message: 'school not found'
      });
    }

    res.status(200).json({
      status: true,
      data: school[0]
    });
  } catch (error) {
    console.error('Get school profile error:', error);
    res.status(500).json({
      status: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Update current school profile
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

    const query = `UPDATE school SET ${updateFields.join(', ')} WHERE id = ?`;

    const result = await executeQuery(query, updateValues);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        status: false,
        message: 'school not found'
      });
    }

    res.status(200).json({
      status: true,
      message: 'school profile updated successfully'
    });
  } catch (error) {
    console.error('Update school profile error:', error);
    res.status(500).json({
      status: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get all school (Admin only)
 */
const getAllSchool = async (req, res) => {
  try {
    const page = Number.parseInt(req.query.page) || 1;
    const limit = Number.parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const countResult = await executeQuery('SELECT COUNT(*) as total FROM tbl_school', []);
    const total = countResult[0].total;

    const school = await executeQuery(
      'select * from tbl_school ORDER BY school_name asc LIMIT ? OFFSET ?',
      [limit.toString(), offset.toString()]
    );

    res.status(200).json({
      status: true,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      data: school
    });
  } catch (error) {
    console.error('Get all school error:', error);
    res.status(500).json({
      status: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get school by ID
 */
const getById = async (req, res) => {
  try {
    const { id } = req.params;

    const school = await executeQuery('SELECT * FROM tbl_school WHERE id = ?', [id]);

    if (school.length === 0) {
      return res.status(404).json({
        status: false,
        message: 'school not found'
      });
    }

    res.status(200).json({
      status: true,
      data: school[0]
    });
  } catch (error) {
    console.error('Get school by ID error:', error);
    res.status(500).json({
      status: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get classes by key
 */

const searchSchoolByKey = async (req, res) => {
  try {
    const allowedKeys = [
      'id',
      'school_name',
      'sort_name',
      'abbr',
      'gr_name',
      'sub_name',
      'state',
      'ci',
      'full_name'
    ]; // whitelist
    const { key, value } = req.query;

    if (!allowedKeys.includes(key)) {
      return res.status(400).json({ error: 'Invalid search key' });
    }
    const searchTerm = `%${value}%`;

    const sql = `SELECT * FROM tbl_school WHERE ${key} = ? `;

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
 * Create new school
 */
const createschool = async (req, res) => {
  try {
    const { name, email, phone, subject, experience, qualification } = req.body;

    const existingschool = await executeQuery('SELECT id FROM school WHERE email = ?', [email]);

    if (existingschool.length > 0) {
      return res.status(409).json({
        status: false,
        message: 'school with this email already exists'
      });
    }

    const result = await executeQuery(
      'INSERT INTO school (name, email, phone, subject, experience, qualification, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())',
      [name, email, phone, subject, experience, qualification, 'active']
    );

    res.status(201).json({
      status: true,
      message: 'school created successfully',
      data: {
        schoolId: result.insertId,
        name,
        email
      }
    });
  } catch (error) {
    console.error('Create school error:', error);
    res.status(500).json({
      status: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Update school
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

    const query = `UPDATE school SET ${updateFields.join(', ')} WHERE id = ?`;

    const result = await executeQuery(query, updateValues);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        status: false,
        message: 'school not found'
      });
    }

    res.status(200).json({
      status: true,
      message: 'school updated successfully'
    });
  } catch (error) {
    console.error('Update school error:', error);
    res.status(500).json({
      status: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Delete school
 */
const deleteschool = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await executeQuery('DELETE FROM school WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        status: false,
        message: 'school not found'
      });
    }

    res.status(200).json({
      status: true,
      message: 'school deleted successfully'
    });
  } catch (error) {
    console.error('Delete school error:', error);
    res.status(500).json({
      status: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  getAllSchool,
  getById,
  searchSchoolByKey
  // updateProfile,
  // getschoolById,
  // createschool,
  // updateschool,
  // deleteschool
};

const { executeQuery } = require('../../../config/database');


/**
 * Get current Department profile
 */
const getProfile = async (req, res) => {
  try {
    const schoolId = req.user.id;

    const Department = await executeQuery(
      'SELECT id, name, email, phone, subject, experience, qualification, status, created_at, updated_at FROM Department WHERE id = ?',
      [schoolId]
    );

    if (Department.length === 0) {
      return res.status(404).json({
        status: false,
        message: 'Department not found'
      });
    }

    res.status(200).json({
      status: true,
      data: Department[0]
    });
  } catch (error) {
    console.error('Get Department profile error:', error);
    res.status(500).json({
      status: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Update current Department profile
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

    const query = `UPDATE Department SET ${updateFields.join(', ')} WHERE id = ?`;

    const result = await executeQuery(query, updateValues);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        status: false,
        message: 'Department not found'
      });
    }

    res.status(200).json({
      status: true,
      message: 'Department profile updated successfully'
    });
  } catch (error) {
    console.error('Update Department profile error:', error);
    res.status(500).json({
      status: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get all Department (Admin only)
 */
const getAllDepartments = async (req, res) => {
  try {
    const page = Number.parseInt(req.query.page) || 1;
    const limit = Number.parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const countResult = await executeQuery('SELECT COUNT(*) as total FROM department', []);
    const total = countResult[0].total;

    const Department = await executeQuery(
      'select * from department ORDER BY department_name asc LIMIT ? OFFSET ?',
      [limit, offset]
    );

    res.status(200).json({
      status: true,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      data: Department
    });
  } catch (error) {
    console.error('Get all Department error:', error);
    res.status(500).json({
      status: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get all Department Type (Admin only)
 */
const getAllDepartmentsType = async (req, res) => {
  try {
    const page = Number.parseInt(req.query.page) || 1;
    const limit = Number.parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const countResult = await executeQuery('SELECT COUNT(*) as total FROM department_type', []);
    const total = countResult[0].total;

    const Department = await executeQuery(
      'select * from department ORDER BY department_type asc LIMIT ? OFFSET ?',
      [limit.toString(), offset.toString()]
    );

    res.status(200).json({
      status: true,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      data: Department
    });
  } catch (error) {
    console.error('Get all Department error:', error);
    res.status(500).json({
      status: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get Department by ID
 */
const getDepartmentById = async (req, res) => {
  try {
    const { id } = req.params;

    const Department = await executeQuery('SELECT * FROM department WHERE id = ?', [id]);

    if (Department.length === 0) {
      return res.status(404).json({
        status: false,
        message: 'Department not found'
      });
    }

    res.status(200).json({
      status: true,
      data: Department[0]
    });
  } catch (error) {
    console.error('Get Department by ID error:', error);
    res.status(500).json({
      status: false,
      message: 'Internal server error'
    });
  }
};
/**
 * Get Department by ID
 */
const getDepartmentTypeById = async (req, res) => {
  try {
    const { id } = req.params;

    const Department = await executeQuery('SELECT * FROM department_type WHERE id = ?', [id]);

    if (Department.length === 0) {
      return res.status(404).json({
        status: false,
        message: 'Department not found'
      });
    }

    res.status(200).json({
      status: true,
      data: Department[0]
    });
  } catch (error) {
    console.error('Get Department by ID error:', error);
    res.status(500).json({
      status: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get classes by key
 */

const searchDepartmentByKey = async (req, res) => {
  try {
    const allowedKeys = ['id', 'department_name']; // whitelist
    const { key, value } = req.query;

    if (!allowedKeys.includes(key)) {
      return res.status(400).json({ error: 'Invalid search key' });
    }
    const searchTerm = `%${value}%`;

    const sql = `SELECT * FROM department WHERE ${key} = ? `;

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
 * Create new Department
 */
const createschool = async (req, res) => {
  try {
    const { name, email, phone, subject, experience, qualification } = req.body;

    const existingschool = await executeQuery('SELECT id FROM Department WHERE email = ?', [email]);

    if (existingschool.length > 0) {
      return res.status(409).json({
        status: false,
        message: 'Department with this email already exists'
      });
    }

    const result = await executeQuery(
      'INSERT INTO Department (name, email, phone, subject, experience, qualification, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())',
      [name, email, phone, subject, experience, qualification, 'active']
    );

    res.status(201).json({
      status: true,
      message: 'Department created successfully',
      data: {
        schoolId: result.insertId,
        name,
        email
      }
    });
  } catch (error) {
    console.error('Create Department error:', error);
    res.status(500).json({
      status: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Update Department
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

    const query = `UPDATE Department SET ${updateFields.join(', ')} WHERE id = ?`;

    const result = await executeQuery(query, updateValues);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        status: false,
        message: 'Department not found'
      });
    }

    res.status(200).json({
      status: true,
      message: 'Department updated successfully'
    });
  } catch (error) {
    console.error('Update Department error:', error);
    res.status(500).json({
      status: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Delete Department
 */
const deleteschool = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await executeQuery('DELETE FROM Department WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        status: false,
        message: 'Department not found'
      });
    }

    res.status(200).json({
      status: true,
      message: 'Department deleted successfully'
    });
  } catch (error) {
    console.error('Delete Department error:', error);
    res.status(500).json({
      status: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  getAllDepartments,
  getDepartmentById,
  searchDepartmentByKey,
  getAllDepartmentsType,
  getDepartmentTypeById

  // updateProfile,
  // getschoolById,
  // createschool,
  // updateschool,
  // deleteschool
};

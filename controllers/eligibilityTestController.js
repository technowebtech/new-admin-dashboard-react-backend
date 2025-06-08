const { executeQuery } = require('../config/database');
/**
 * Search class by key-value pair
 * Method-level enums (apply only to this method)
 * @paramEnum key: ['id','EligibilityTest'] - Search class by key field
 */

/**
 * Get current EligibilityTest profile
 */
const getProfile = async (req, res) => {
  try {
    const EligibilityTestId = req.user.id;

    const EligibilityTest = await executeQuery(
      'SELECT id, name, email, phone, subject, experience, qualification, status, created_at, updated_at FROM EligibilityTest WHERE id = ?',
      [EligibilityTestId]
    );

    if (EligibilityTest.length === 0) {
      return res.status(404).json({
        status: false,
        message: 'EligibilityTest not found'
      });
    }

    res.status(200).json({
      status: true,
      data: EligibilityTest[0]
    });
  } catch (error) {
    console.error('Get EligibilityTest profile error:', error);
    res.status(500).json({
      status: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Update current EligibilityTest profile
 */
const updateProfile = async (req, res) => {
  try {
    const EligibilityTestId = req.user.id;
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
    updateValues.push(EligibilityTestId);

    const query = `UPDATE EligibilityTest SET ${updateFields.join(', ')} WHERE id = ?`;

    const result = await executeQuery(query, updateValues);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        status: false,
        message: 'EligibilityTest not found'
      });
    }

    res.status(200).json({
      status: true,
      message: 'EligibilityTest profile updated successfully'
    });
  } catch (error) {
    console.error('Update EligibilityTest profile error:', error);
    res.status(500).json({
      status: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get all EligibilityTest (Admin only)
 */
const getAllEligibilityTest = async (req, res) => {
  try {
    const page = Number.parseInt(req.query.page) || 1;
    const limit = Number.parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const countResult = await executeQuery('SELECT COUNT(*) as total FROM eligibility_test', []);
    const total = countResult[0].total;

    const EligibilityTest = await executeQuery(
      'select * from eligibility_test ORDER BY id desc LIMIT ? OFFSET ?',
      [limit.toString(), offset.toString()]
    );

    res.status(200).json({
      status: true,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      data: EligibilityTest
    });
  } catch (error) {
    console.error('Get all EligibilityTest error:', error);
    res.status(500).json({
      status: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get EligibilityTest by ID
 */
const getEligibilityTestById = async (req, res) => {
  try {
    const { id } = req.params;

    const EligibilityTest = await executeQuery('SELECT * FROM eligibility_test WHERE id = ?', [id]);

    if (EligibilityTest.length === 0) {
      return res.status(404).json({
        status: false,
        message: 'EligibilityTest not found'
      });
    }

    res.status(200).json({
      status: true,
      data: EligibilityTest[0]
    });
  } catch (error) {
    console.error('Get EligibilityTest by ID error:', error);
    res.status(500).json({
      status: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get classes by key
 */

const searchEligibilityTestByKey = async (req, res) => {
  try {
    const allowedKeys = ['id', 'EligibilityTest']; // whitelist
    const { key, value } = req.query;

    if (!allowedKeys.includes(key)) {
      return res.status(400).json({ error: 'Invalid search key' });
    }
    const searchTerm = `%${value}%`;

    const sql = `SELECT * FROM EligibilityTest WHERE ${key} = ? `;

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
 * Create new EligibilityTest
 */
const createEligibilityTest = async (req, res) => {
  try {
    const { name, email, phone, subject, experience, qualification } = req.body;

    const existingEligibilityTest = await executeQuery('SELECT id FROM EligibilityTest WHERE email = ?', [
      email
    ]);

    if (existingEligibilityTest.length > 0) {
      return res.status(409).json({
        status: false,
        message: 'EligibilityTest with this email already exists'
      });
    }

    const result = await executeQuery(
      'INSERT INTO EligibilityTest (name, email, phone, subject, experience, qualification, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())',
      [name, email, phone, subject, experience, qualification, 'active']
    );

    res.status(201).json({
      status: true,
      message: 'EligibilityTest created successfully',
      data: {
        EligibilityTestId: result.insertId,
        name,
        email
      }
    });
  } catch (error) {
    console.error('Create EligibilityTest error:', error);
    res.status(500).json({
      status: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Update EligibilityTest
 */
const updateEligibilityTest = async (req, res) => {
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

    const query = `UPDATE EligibilityTest SET ${updateFields.join(', ')} WHERE id = ?`;

    const result = await executeQuery(query, updateValues);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        status: false,
        message: 'EligibilityTest not found'
      });
    }

    res.status(200).json({
      status: true,
      message: 'EligibilityTest updated successfully'
    });
  } catch (error) {
    console.error('Update EligibilityTest error:', error);
    res.status(500).json({
      status: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Delete EligibilityTest
 */
const deleteEligibilityTest = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await executeQuery('DELETE FROM EligibilityTest WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        status: false,
        message: 'EligibilityTest not found'
      });
    }

    res.status(200).json({
      status: true,
      message: 'EligibilityTest deleted successfully'
    });
  } catch (error) {
    console.error('Delete EligibilityTest error:', error);
    res.status(500).json({
      status: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  getAllEligibilityTest,
  getEligibilityTestById

  // updateProfile,
  // getEligibilityTestById,
  // createEligibilityTest,
  // updateEligibilityTest,
  // deleteEligibilityTest
};

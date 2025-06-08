const { executeQuery } = require('../config/database');

/**
 * Get current section profile
 */
const getProfile = async (req, res) => {
  try {
    const clasesId = req.user.id;

    const section = await executeQuery(
      'SELECT id, name, email, phone, subject, experience, qualification, status, created_at, updated_at FROM section WHERE id = ?',
      [clasesId]
    );

    if (section.length === 0) {
      return res.status(404).json({
        status: false,
        message: 'section not found'
      });
    }

    res.status(200).json({
      status: true,
      data: section[0]
    });
  } catch (error) {
    console.error('Get section profile error:', error);
    res.status(500).json({
      status: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Update current section profile
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

    const query = `UPDATE section SET ${updateFields.join(', ')} WHERE id = ?`;

    const result = await executeQuery(query, updateValues);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        status: false,
        message: 'section not found'
      });
    }

    res.status(200).json({
      status: true,
      message: 'section profile updated successfully'
    });
  } catch (error) {
    console.error('Update section profile error:', error);
    res.status(500).json({
      status: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get all section (Admin only)
 */
const getAllSection = async (req, res) => {
  try {
    const page = Number.parseInt(req.query.page) || 1;
    const limit = Number.parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const countResult = await executeQuery('SELECT COUNT(*) as total FROM class_section', []);
    const total = countResult[0].total;

    const section = await executeQuery(
      'select * from class_section ORDER BY class_name asc LIMIT ? OFFSET ?',
      [limit, offset]
    );

    res.status(200).json({
      status: true,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      data: section
    });
  } catch (error) {
    console.error('Get all section error:', error);
    res.status(500).json({
      status: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get section by ID
 */
const getById = async (req, res) => {
  try {
    const { id } = req.params;

    const section = await executeQuery('SELECT * FROM class_section WHERE id = ?', [id]);

    if (section.length === 0) {
      return res.status(404).json({
        status: false,
        message: 'section not found'
      });
    }

    res.status(200).json({
      status: true,
      data: section[0]
    });
  } catch (error) {
    console.error('Get section by ID error:', error);
    res.status(500).json({
      status: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Create new section
 */
const createclases = async (req, res) => {
  try {
    const { name, email, phone, subject, experience, qualification } = req.body;

    const existingclases = await executeQuery('SELECT id FROM section WHERE email = ?', [email]);

    if (existingclases.length > 0) {
      return res.status(409).json({
        status: false,
        message: 'section with this email already exists'
      });
    }

    const result = await executeQuery(
      'INSERT INTO section (name, email, phone, subject, experience, qualification, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())',
      [name, email, phone, subject, experience, qualification, 'active']
    );

    res.status(201).json({
      status: true,
      message: 'section created successfully',
      data: {
        clasesId: result.insertId,
        name,
        email
      }
    });
  } catch (error) {
    console.error('Create section error:', error);
    res.status(500).json({
      status: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Update section
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

    const query = `UPDATE section SET ${updateFields.join(', ')} WHERE id = ?`;

    const result = await executeQuery(query, updateValues);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        status: false,
        message: 'section not found'
      });
    }

    res.status(200).json({
      status: true,
      message: 'section updated successfully'
    });
  } catch (error) {
    console.error('Update section error:', error);
    res.status(500).json({
      status: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Delete section
 */
const deleteclases = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await executeQuery('DELETE FROM section WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        status: false,
        message: 'section not found'
      });
    }

    res.status(200).json({
      status: true,
      message: 'section deleted successfully'
    });
  } catch (error) {
    console.error('Delete section error:', error);
    res.status(500).json({
      status: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  getAllSection,
  getById
  // updateProfile,
  // getclasesById,
  // createclases,
  // updateclases,
  // deleteclases
};

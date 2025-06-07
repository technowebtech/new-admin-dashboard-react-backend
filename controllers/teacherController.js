const { executeQuery, getDatabaseFromContext } = require("../config/database")

/**
 * Get current teacher profile
 */
const getProfile = async (req, res) => {
  try {
    const teacherId = req.user.id
   

    const teachers = await executeQuery(
      "SELECT id, name, email, phone, subject, experience, qualification, status, created_at, updated_at FROM teachers WHERE id = ?",
      [teacherId],
      
    )

    if (teachers.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "Teacher not found",
      })
    }

    res.status(200).json({
      status: "success",
      data: teachers[0],
    })
  } catch (error) {
    console.error("Get teacher profile error:", error)
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    })
  }
}

/**
 * Update current teacher profile
 */
const updateProfile = async (req, res) => {
  try {
    const teacherId = req.user.id
    const { name, phone, subject, experience, qualification } = req.body
   

    const updateFields = []
    const updateValues = []

    if (name !== undefined) {
      updateFields.push("name = ?")
      updateValues.push(name)
    }
    if (phone !== undefined) {
      updateFields.push("phone = ?")
      updateValues.push(phone)
    }
    if (subject !== undefined) {
      updateFields.push("subject = ?")
      updateValues.push(subject)
    }
    if (experience !== undefined) {
      updateFields.push("experience = ?")
      updateValues.push(experience)
    }
    if (qualification !== undefined) {
      updateFields.push("qualification = ?")
      updateValues.push(qualification)
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        status: "error",
        message: "No fields to update",
      })
    }

    updateFields.push("updated_at = NOW()")
    updateValues.push(teacherId)

    const query = `UPDATE teachers SET ${updateFields.join(", ")} WHERE id = ?`

    const result = await executeQuery(query, updateValues, )

    if (result.affectedRows === 0) {
      return res.status(404).json({
        status: "error",
        message: "Teacher not found",
      })
    }

    res.status(200).json({
      status: "success",
      message: "Teacher profile updated successfully",
    })
  } catch (error) {
    console.error("Update teacher profile error:", error)
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    })
  }
}

/**
 * Get all teachers (Admin only)
 */
const getAllTeachers = async (req, res) => {
  try {
    const page = Number.parseInt(req.query.page) || 1
    const limit = Number.parseInt(req.query.limit) || 10
    const offset = (page - 1) * limit
   

    const countResult = await executeQuery("SELECT COUNT(*) as total FROM teachers", [], )
    const total = countResult[0].total

    const teachers = await executeQuery(
      "SELECT id, name, email, phone, subject, experience, qualification, status, created_at, updated_at FROM teachers ORDER BY created_at DESC LIMIT ? OFFSET ?",
      [limit, offset],
      
    )

    res.status(200).json({
      status: "success",
      data: {
        teachers,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    })
  } catch (error) {
    console.error("Get all teachers error:", error)
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    })
  }
}

/**
 * Get teacher by ID
 */
const getTeacherById = async (req, res) => {
  try {
    const { id } = req.params
   

    const teachers = await executeQuery(
      "SELECT id, name, email, phone, subject, experience, qualification, status, created_at, updated_at FROM teachers WHERE id = ?",
      [id],
      
    )

    if (teachers.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "Teacher not found",
      })
    }

    res.status(200).json({
      status: "success",
      data: teachers[0],
    })
  } catch (error) {
    console.error("Get teacher by ID error:", error)
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    })
  }
}

/**
 * Create new teacher
 */
const createTeacher = async (req, res) => {
  try {
    const { name, email, phone, subject, experience, qualification } = req.body
   

    const existingTeachers = await executeQuery("SELECT id FROM teachers WHERE email = ?", [email], )

    if (existingTeachers.length > 0) {
      return res.status(409).json({
        status: "error",
        message: "Teacher with this email already exists",
      })
    }

    const result = await executeQuery(
      "INSERT INTO teachers (name, email, phone, subject, experience, qualification, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())",
      [name, email, phone, subject, experience, qualification, "active"],
      
    )

    res.status(201).json({
      status: "success",
      message: "Teacher created successfully",
      data: {
        teacherId: result.insertId,
        name,
        email,
      },
    })
  } catch (error) {
    console.error("Create teacher error:", error)
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    })
  }
}

/**
 * Update teacher
 */
const updateTeacher = async (req, res) => {
  try {
    const { id } = req.params
    const { name, phone, subject, experience, qualification } = req.body
   

    const updateFields = []
    const updateValues = []

    if (name !== undefined) {
      updateFields.push("name = ?")
      updateValues.push(name)
    }
    if (phone !== undefined) {
      updateFields.push("phone = ?")
      updateValues.push(phone)
    }
    if (subject !== undefined) {
      updateFields.push("subject = ?")
      updateValues.push(subject)
    }
    if (experience !== undefined) {
      updateFields.push("experience = ?")
      updateValues.push(experience)
    }
    if (qualification !== undefined) {
      updateFields.push("qualification = ?")
      updateValues.push(qualification)
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        status: "error",
        message: "No fields to update",
      })
    }

    updateFields.push("updated_at = NOW()")
    updateValues.push(id)

    const query = `UPDATE teachers SET ${updateFields.join(", ")} WHERE id = ?`

    const result = await executeQuery(query, updateValues, )

    if (result.affectedRows === 0) {
      return res.status(404).json({
        status: "error",
        message: "Teacher not found",
      })
    }

    res.status(200).json({
      status: "success",
      message: "Teacher updated successfully",
    })
  } catch (error) {
    console.error("Update teacher error:", error)
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    })
  }
}

/**
 * Delete teacher
 */
const deleteTeacher = async (req, res) => {
  try {
    const { id } = req.params
   

    const result = await executeQuery("DELETE FROM teachers WHERE id = ?", [id], )

    if (result.affectedRows === 0) {
      return res.status(404).json({
        status: "error",
        message: "Teacher not found",
      })
    }

    res.status(200).json({
      status: "success",
      message: "Teacher deleted successfully",
    })
  } catch (error) {
    console.error("Delete teacher error:", error)
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    })
  }
}

module.exports = {
  getProfile,
  updateProfile,
  getAllTeachers,
  getTeacherById,
  createTeacher,
  updateTeacher,
  deleteTeacher,
}

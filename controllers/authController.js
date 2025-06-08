const CryptoJS = require('crypto-js');
const jwt = require('jsonwebtoken');
const { executeQuery } = require('../config/database');

/**
 * Register a new user
 */
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUsers = await executeQuery('SELECT id FROM users WHERE email = ?', [email]);

    if (existingUsers.length > 0) {
      return res.status(409).json({
        status: false,
        message: 'User with this email already exists'
      });
    }

    // Hash password
    const hashedPassword = CryptoJS.MD5(password).toString();

    // Insert new user
    const result = await executeQuery(
      'INSERT INTO users (name, email, password, role, status, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
      [name, email, hashedPassword, 'user', 'active']
    );

    res.status(201).json({
      status: true,
      message: 'User registered successfully',
      data: {
        userId: result.insertId,
        name,
        email
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      status: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Login user
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const inputPasswordHash = CryptoJS.MD5(password).toString();

    // Find user by email
    const users = await executeQuery(
      'select * from tbl_user where password=? and (user_name =? or email_id=?)',
      [inputPasswordHash, email, email]
    );

    if (users.length === 0) {
      return res.status(401).json({
        status: false,
        message: 'Invalid email or password'
      });
    }

    const user = users[0];

    // Check if user is active
    if (!user?.status) {
      return res.status(401).json({
        status: false,
        message: 'Account is not active'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // // Update last login
    // await executeQuery('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]);

    res.status(200).json({
      status: true,
      message: 'Login successful',
      data: {
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      status: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  register,
  login
};

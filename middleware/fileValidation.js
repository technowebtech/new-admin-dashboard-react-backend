/**
 * File validation middleware
 */

/**
 * Validate file upload parameters
 */
const validateFileUpload = (req, res, next) => {
  const { folderName } = req.params

  // Validate folder name
  if (!folderName || folderName.trim() === "") {
    return res.status(400).json({
      status: "error",
      message: "Folder name is required",
    })
  }

  // Sanitize folder name
  const sanitizedFolderName = folderName.replace(/[^a-zA-Z0-9_-]/g, "_").toLowerCase()

  // Check for dangerous folder names
  const dangerousFolders = ["system", "config", "node_modules", "..", ".", "root", "admin"]
  if (dangerousFolders.includes(sanitizedFolderName)) {
    return res.status(400).json({
      status: "error",
      message: "Invalid folder name",
    })
  }

  // Add sanitized folder name to request
  req.sanitizedFolderName = sanitizedFolderName

  next()
}

/**
 * Validate file types (optional middleware)
 */
const validateFileTypes = (allowedTypes = []) => {
  return (req, res, next) => {
    if (!req.files || req.files.length === 0) {
      return next()
    }

    const invalidFiles = []

    req.files.forEach((file) => {
      const fileExtension = file.originalname.split(".").pop().toLowerCase()
      if (allowedTypes.length > 0 && !allowedTypes.includes(fileExtension)) {
        invalidFiles.push({
          fileName: file.originalname,
          extension: fileExtension,
        })
      }
    })

    if (invalidFiles.length > 0) {
      return res.status(400).json({
        status: "error",
        message: "Invalid file types detected",
        invalidFiles,
        allowedTypes,
      })
    }

    next()
  }
}

/**
 * Validate file size (optional middleware)
 */
const validateFileSize = (maxSizeInMB = 50) => {
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024

  return (req, res, next) => {
    if (!req.files || req.files.length === 0) {
      return next()
    }

    const oversizedFiles = []

    req.files.forEach((file) => {
      if (file.size > maxSizeInBytes) {
        oversizedFiles.push({
          fileName: file.originalname,
          size: file.size,
          sizeFormatted: formatFileSize(file.size),
          maxAllowed: formatFileSize(maxSizeInBytes),
        })
      }
    })

    if (oversizedFiles.length > 0) {
      return res.status(400).json({
        status: "error",
        message: `File size exceeds limit of ${maxSizeInMB}MB`,
        oversizedFiles,
      })
    }

    next()
  }
}

// Helper function to format file size
function formatFileSize(bytes) {
  if (bytes === 0) return "0 Bytes"

  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

module.exports = {
  validateFileUpload,
  validateFileTypes,
  validateFileSize,
}

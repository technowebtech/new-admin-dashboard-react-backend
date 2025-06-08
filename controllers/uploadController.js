const multer = require("multer")
const path = require("path")
const fs = require("fs-extra")
const { v4: uuidv4 } = require("uuid")

/**
 * Controller-level enums for file operations
 * @enum file_type: ['image', 'document', 'video', 'audio', 'archive', 'other'] - File type categories
 * @enum status: ['uploaded', 'processing', 'completed', 'failed'] - Upload status
 * @queryEnum format: ['json', 'xml'] - Response format options
 */

// Configure multer for memory storage (we'll handle file saving manually)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
    files: 10, // Maximum 10 files at once
  },
  fileFilter: (req, file, cb) => {
    // Allow all file types by default
    // You can add specific filtering logic here if needed
    cb(null, true)
  },
})

/**
 * Upload single or multiple files
 * Method-level enums (apply only to this method)
 * @paramEnum folderName: ['users', 'teachers', 'students', 'courses', 'documents', 'images', 'videos', 'temp'] - Folder name options
 * @queryEnum overwrite: ['true', 'false'] - Whether to overwrite existing files
 * @queryEnum generateThumbnail: ['true', 'false'] - Generate thumbnail for images
 */
const uploadFiles = async (req, res) => {
  try {
    const { folderName } = req.params
    const { overwrite = "false", generateThumbnail = "false" } = req.query

    // Validate folder name
    if (!folderName || folderName.trim() === "") {
      return res.status(400).json({
        status: "error",
        message: "Folder name is required",
      })
    }

    // Sanitize folder name (remove special characters, spaces, etc.)
    const sanitizedFolderName = folderName
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .toLowerCase()
      .substring(0, 50)

    // Create upload directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), "public", sanitizedFolderName)
    await fs.ensureDir(uploadDir)

    // Check if files were uploaded
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        status: "error",
        message: "No files uploaded",
      })
    }

    const uploadedFiles = []
    const errors = []

    // Process each uploaded file
    for (const file of req.files) {
      try {
        // Generate unique filename to avoid conflicts
        const fileExtension = path.extname(file.originalname)
        const baseName = path.basename(file.originalname, fileExtension)
        const sanitizedBaseName = baseName.replace(/[^a-zA-Z0-9_-]/g, "_")
        const uniqueId = uuidv4().substring(0, 8)
        const fileName = `${sanitizedBaseName}_${uniqueId}${fileExtension}`
        const filePath = path.join(uploadDir, fileName)

        // Check if file exists and overwrite is false
        if (!overwrite || overwrite === "false") {
          if (await fs.pathExists(filePath)) {
            errors.push({
              originalName: file.originalname,
              error: "File already exists and overwrite is disabled",
            })
            continue
          }
        }

        // Write file to disk
        await fs.writeFile(filePath, file.buffer)

        // Get file stats
        const stats = await fs.stat(filePath)

        // Determine file type
        const fileType = getFileType(fileExtension)

        // Create file info object
        const fileInfo = {
          originalName: file.originalname,
          fileName: fileName,
          filePath: `/public/${sanitizedFolderName}/${fileName}`,
          fullPath: filePath,
          size: stats.size,
          sizeFormatted: formatFileSize(stats.size),
          mimeType: file.mimetype,
          fileType: fileType,
          extension: fileExtension,
          uploadedAt: new Date().toISOString(),
          folder: sanitizedFolderName,
        }

        // Generate thumbnail for images if requested
        if (generateThumbnail === "true" && fileType === "image") {
          try {
            const thumbnailInfo = await generateImageThumbnail(filePath, uploadDir, fileName)
            fileInfo.thumbnail = thumbnailInfo
          } catch (thumbError) {
            console.warn("Failed to generate thumbnail:", thumbError.message)
            fileInfo.thumbnail = null
          }
        }

        uploadedFiles.push(fileInfo)
      } catch (fileError) {
        console.error("Error processing file:", fileError)
        errors.push({
          originalName: file.originalname,
          error: fileError.message,
        })
      }
    }

    // Prepare response
    const response = {
      status: "success",
      message: `Successfully uploaded ${uploadedFiles.length} file(s)`,
      data: {
        uploadedFiles,
        totalFiles: uploadedFiles.length,
        folder: sanitizedFolderName,
        uploadPath: `/public/${sanitizedFolderName}`,
      },
    }

    // Include errors if any
    if (errors.length > 0) {
      response.errors = errors
      response.message += ` with ${errors.length} error(s)`
    }

    res.status(200).json(response)
  } catch (error) {
    console.error("Upload files error:", error)
    res.status(500).json({
      status: "error",
      message: "Internal server error during file upload",
      details: error.message,
    })
  }
}

/**
 * Get uploaded files list from a folder
 * Method-level enums (apply only to this method)
 * @paramEnum folderName: ['users', 'teachers', 'students', 'courses', 'documents', 'images', 'videos', 'temp'] - Folder name options
 * @queryEnum fileType: ['image', 'document', 'video', 'audio', 'archive', 'all'] - Filter by file type
 * @queryEnum sortBy: ['name', 'size', 'date', 'type'] - Sort files by field
 * @queryEnum sortOrder: ['asc', 'desc'] - Sort order
 */
const getFiles = async (req, res) => {
  try {
    const { folderName } = req.params
    const { fileType = "all", sortBy = "date", sortOrder = "desc", page = 1, limit = 50 } = req.query

    // Validate folder name
    if (!folderName || folderName.trim() === "") {
      return res.status(400).json({
        status: "error",
        message: "Folder name is required",
      })
    }

    const sanitizedFolderName = folderName.replace(/[^a-zA-Z0-9_-]/g, "_").toLowerCase()
    const folderPath = path.join(process.cwd(), "public", sanitizedFolderName)

    // Check if folder exists
    if (!(await fs.pathExists(folderPath))) {
      return res.status(404).json({
        status: "error",
        message: "Folder not found",
      })
    }

    // Read files from directory
    const files = await fs.readdir(folderPath)
    const fileInfos = []

    for (const file of files) {
      try {
        const filePath = path.join(folderPath, file)
        const stats = await fs.stat(filePath)

        if (stats.isFile()) {
          const fileExtension = path.extname(file)
          const detectedFileType = getFileType(fileExtension)

          // Filter by file type if specified
          if (fileType !== "all" && detectedFileType !== fileType) {
            continue
          }

          const fileInfo = {
            fileName: file,
            filePath: `/public/${sanitizedFolderName}/${file}`,
            size: stats.size,
            sizeFormatted: formatFileSize(stats.size),
            fileType: detectedFileType,
            extension: fileExtension,
            createdAt: stats.birthtime.toISOString(),
            modifiedAt: stats.mtime.toISOString(),
            folder: sanitizedFolderName,
          }

          fileInfos.push(fileInfo)
        }
      } catch (fileError) {
        console.warn(`Error reading file ${file}:`, fileError.message)
      }
    }

    // Sort files
    fileInfos.sort((a, b) => {
      let aValue, bValue

      switch (sortBy) {
        case "name":
          aValue = a.fileName.toLowerCase()
          bValue = b.fileName.toLowerCase()
          break
        case "size":
          aValue = a.size
          bValue = b.size
          break
        case "type":
          aValue = a.fileType
          bValue = b.fileType
          break
        case "date":
        default:
          aValue = new Date(a.createdAt)
          bValue = new Date(b.createdAt)
          break
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    // Pagination
    const pageNum = Number.parseInt(page)
    const limitNum = Number.parseInt(limit)
    const startIndex = (pageNum - 1) * limitNum
    const endIndex = startIndex + limitNum
    const paginatedFiles = fileInfos.slice(startIndex, endIndex)

    res.status(200).json({
      status: "success",
      data: {
        files: paginatedFiles,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: fileInfos.length,
          totalPages: Math.ceil(fileInfos.length / limitNum),
        },
        folder: sanitizedFolderName,
        folderPath: `/public/${sanitizedFolderName}`,
      },
    })
  } catch (error) {
    console.error("Get files error:", error)
    res.status(500).json({
      status: "error",
      message: "Internal server error",
      details: error.message,
    })
  }
}

/**
 * Delete a file from folder
 * Method-level enums (apply only to this method)
 * @paramEnum folderName: ['users', 'teachers', 'students', 'courses', 'documents', 'images', 'videos', 'temp'] - Folder name options
 * @paramEnum fileName: [] - File name to delete (dynamic)
 * @queryEnum deleteThumbnail: ['true', 'false'] - Also delete thumbnail if exists
 */
const deleteFile = async (req, res) => {
  try {
    const { folderName, fileName } = req.params
    const { deleteThumbnail = "true" } = req.query

    // Validate parameters
    if (!folderName || !fileName) {
      return res.status(400).json({
        status: "error",
        message: "Folder name and file name are required",
      })
    }

    const sanitizedFolderName = folderName.replace(/[^a-zA-Z0-9_-]/g, "_").toLowerCase()
    const filePath = path.join(process.cwd(), "public", sanitizedFolderName, fileName)

    // Check if file exists
    if (!(await fs.pathExists(filePath))) {
      return res.status(404).json({
        status: "error",
        message: "File not found",
      })
    }

    // Delete the file
    await fs.remove(filePath)

    // Delete thumbnail if requested and exists
    if (deleteThumbnail === "true") {
      const thumbnailPath = path.join(process.cwd(), "public", sanitizedFolderName, "thumbnails", `thumb_${fileName}`)
      if (await fs.pathExists(thumbnailPath)) {
        await fs.remove(thumbnailPath)
      }
    }

    res.status(200).json({
      status: "success",
      message: "File deleted successfully",
      data: {
        fileName,
        folder: sanitizedFolderName,
        deletedAt: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error("Delete file error:", error)
    res.status(500).json({
      status: "error",
      message: "Internal server error",
      details: error.message,
    })
  }
}

/**
 * Get file information
 * Method-level enums (apply only to this method)
 * @paramEnum folderName: ['users', 'teachers', 'students', 'courses', 'documents', 'images', 'videos', 'temp'] - Folder name options
 * @paramEnum fileName: [] - File name to get info (dynamic)
 * @queryEnum includeMetadata: ['true', 'false'] - Include detailed metadata
 */
const getFileInfo = async (req, res) => {
  try {
    const { folderName, fileName } = req.params
    const { includeMetadata = "false" } = req.query

    // Validate parameters
    if (!folderName || !fileName) {
      return res.status(400).json({
        status: "error",
        message: "Folder name and file name are required",
      })
    }

    const sanitizedFolderName = folderName.replace(/[^a-zA-Z0-9_-]/g, "_").toLowerCase()
    const filePath = path.join(process.cwd(), "public", sanitizedFolderName, fileName)

    // Check if file exists
    if (!(await fs.pathExists(filePath))) {
      return res.status(404).json({
        status: "error",
        message: "File not found",
      })
    }

    // Get file stats
    const stats = await fs.stat(filePath)
    const fileExtension = path.extname(fileName)
    const fileType = getFileType(fileExtension)

    const fileInfo = {
      fileName,
      filePath: `/public/${sanitizedFolderName}/${fileName}`,
      fullPath: filePath,
      size: stats.size,
      sizeFormatted: formatFileSize(stats.size),
      fileType,
      extension: fileExtension,
      createdAt: stats.birthtime.toISOString(),
      modifiedAt: stats.mtime.toISOString(),
      folder: sanitizedFolderName,
    }

    // Include detailed metadata if requested
    if (includeMetadata === "true") {
      fileInfo.metadata = {
        isFile: stats.isFile(),
        isDirectory: stats.isDirectory(),
        mode: stats.mode,
        uid: stats.uid,
        gid: stats.gid,
        blocks: stats.blocks,
        blksize: stats.blksize,
      }

      // Check for thumbnail
      const thumbnailPath = path.join(process.cwd(), "public", sanitizedFolderName, "thumbnails", `thumb_${fileName}`)
      if (await fs.pathExists(thumbnailPath)) {
        fileInfo.thumbnail = `/public/${sanitizedFolderName}/thumbnails/thumb_${fileName}`
      }
    }

    res.status(200).json({
      status: "success",
      data: fileInfo,
    })
  } catch (error) {
    console.error("Get file info error:", error)
    res.status(500).json({
      status: "error",
      message: "Internal server error",
      details: error.message,
    })
  }
}

// Helper function to determine file type based on extension
function getFileType(extension) {
  const ext = extension.toLowerCase()

  const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp", ".svg", ".ico"]
  const documentExtensions = [".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".txt", ".rtf", ".odt"]
  const videoExtensions = [".mp4", ".avi", ".mov", ".wmv", ".flv", ".webm", ".mkv", ".m4v"]
  const audioExtensions = [".mp3", ".wav", ".flac", ".aac", ".ogg", ".wma", ".m4a"]
  const archiveExtensions = [".zip", ".rar", ".7z", ".tar", ".gz", ".bz2"]

  if (imageExtensions.includes(ext)) return "image"
  if (documentExtensions.includes(ext)) return "document"
  if (videoExtensions.includes(ext)) return "video"
  if (audioExtensions.includes(ext)) return "audio"
  if (archiveExtensions.includes(ext)) return "archive"

  return "other"
}

// Helper function to format file size
function formatFileSize(bytes) {
  if (bytes === 0) return "0 Bytes"

  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

// Helper function to generate image thumbnail (basic implementation)
async function generateImageThumbnail(originalPath, uploadDir, fileName) {
  try {
    // Create thumbnails directory
    const thumbnailDir = path.join(uploadDir, "thumbnails")
    await fs.ensureDir(thumbnailDir)

    const thumbnailFileName = `thumb_${fileName}`
    const thumbnailPath = path.join(thumbnailDir, thumbnailFileName)

    // For now, just copy the original file as thumbnail
    // In a real implementation, you would use a library like Sharp to resize the image
    await fs.copy(originalPath, thumbnailPath)

    return {
      fileName: thumbnailFileName,
      filePath: `/public/${path.basename(uploadDir)}/thumbnails/${thumbnailFileName}`,
      size: (await fs.stat(thumbnailPath)).size,
    }
  } catch (error) {
    throw new Error(`Failed to generate thumbnail: ${error.message}`)
  }
}

// Export multer upload middleware and controller functions
module.exports = {
  upload,
  uploadFiles,
  getFiles,
  deleteFile,
  getFileInfo,
}

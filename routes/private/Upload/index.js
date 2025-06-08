const express = require("express")
const { upload, uploadFiles, getFiles, deleteFile, getFileInfo } = require("../../../controllers/fileController")

const router = express.Router()

/**
 * Route-level enums (apply to all file endpoints)
 * @routeEnum responseFormat: ['json', 'xml'] - Response format options
 * @routeEnum includeMetadata: ['true', 'false'] - Include file metadata in responses
 */

// Upload files endpoint - supports both single and multiple files
/**
 * Upload single or multiple files to specified folder
 * @endpointEnum folderName: ['users', 'teachers', 'students', 'courses', 'documents', 'images', 'videos', 'temp', 'uploads'] - Target folder name
 * @endpointEnum overwrite: ['true', 'false'] - Overwrite existing files
 * @endpointEnum generateThumbnail: ['true', 'false'] - Generate thumbnails for images
 */
router.post("/upload/:folderName", upload.array("files", 10), uploadFiles)

// Get files from folder
/**
 * Get list of files from specified folder
 * @endpointEnum fileType: ['image', 'document', 'video', 'audio', 'archive', 'all'] - Filter by file type
 * @endpointEnum sortBy: ['name', 'size', 'date', 'type'] - Sort files by field
 * @endpointEnum sortOrder: ['asc', 'desc'] - Sort order
 */
router.get("/list/:folderName", getFiles)

// Get specific file information
/**
 * Get detailed information about a specific file
 * @endpointEnum includeMetadata: ['true', 'false'] - Include detailed file metadata
 */
router.get("/info/:folderName/:fileName", getFileInfo)

// Delete specific file
/**
 * Delete a specific file from folder
 * @endpointEnum deleteThumbnail: ['true', 'false'] - Also delete thumbnail if exists
 */
router.delete("/delete/:folderName/:fileName", deleteFile)

module.exports = router

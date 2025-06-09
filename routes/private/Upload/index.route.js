const express = require("express")
const { upload, uploadFiles, deleteFile } = require("./uploadController")
const router = express.Router()
/**
 * @swagger
 * tags:
 *   name: Files
 *   description: File management and operations
 */
/**
 * @swagger
 * /api/v1/upload/{folderName}:
 *   post:
 *     tags: [Files]
 *     summary: Upload multiple files to a specified folder
 *     description: Upload files to the server under the specified folder. Supports overwrite and optional thumbnail generation.
 *     parameters:
 *       - in: path
 *         name: folderName
 *         required: true
 *         schema:
 *           type: string
 *         description: Target folder name
 *       - in: query
 *         name: overwrite
 *         schema:
 *           type: string
 *           enum: [true, false]
 *         description: Overwrite existing files
 *       - in: query
 *         name: generateThumbnail
 *         schema:
 *           type: string
 *           enum: [true, false]
 *         description: Generate thumbnail for images
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Upload success
 */


/**
 * @swagger
 * /api/v1/upload/delete/{fileName}:
 *   delete:
 *     tags: [Files]
 *     summary: Delete a file and optionally its thumbnail
 *     description: Deletes the specified file from the server. Optionally deletes the thumbnail if `deleteThumbnail=true`.
 *     parameters:
 *       - in: path
 *         name: fileName
 *         required: true
 *         schema:
 *           type: string
 *         description: Name of the file to delete (e.g., sample.jpg)
 *       - in: query
 *         name: deleteThumbnail
 *         schema:
 *           type: string
 *           enum: [true, false]
 *           default: true
 *         description: Whether to also delete the thumbnail image
 *     responses:
 *       200:
 *         description: File deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: File deleted successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     fileName:
 *                       type: string
 *                       example: sample.jpg
 *                     folder:
 *                       type: string
 *                       example: uploads
 *                     deletedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Missing file name
 *       404:
 *         description: File not found
 *       500:
 *         description: Internal server error
 */
router.post("/:folderName", upload.array("files", 10), uploadFiles)
router.delete("/delete/:fileName", deleteFile)

module.exports = router

const multer = require("multer");
const path = require("path");
const fs = require("fs-extra");
const { v4: uuidv4 } = require("uuid");

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
    files: 10,
  },
});

const uploadFiles = async (req, res) => {
  try {
    const { folderName } = req.params;
    const { overwrite = "false", generateThumbnail = "false" } = req.query;

    if (!folderName) {
      return res
        .status(400)
        .json({ status: false, message: "Folder name is required" });
    }
    if (!req.files || req.files.length === 0) {
      return res
        .status(400)
        .json({ status: false, message: "files not available for upload" });
    }
    const sanitizedFolderName = folderName
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .toLowerCase();
    const uploadDir = path.join(
      process.cwd(),
      "public/assets",
      sanitizedFolderName
    );
    await fs.ensureDir(uploadDir);

    const uploadedFiles = [];
    const errors = [];

    for (const file of req.files) {
      try {
        const ext = path.extname(file.originalname);
        const uniqueId = uuidv4();
        const fileName = `${uniqueId}${ext}`;
        const filePath = path.join(uploadDir, fileName);

        if (overwrite === "false" && (await fs.pathExists(filePath))) {
          errors.push({
            originalName: file.originalname,
            error: "File already exists",
          });
          continue;
        }

        await fs.writeFile(filePath, file.buffer);
        const stats = await fs.stat(filePath);
        const fileType = getFileType(ext);

        const fileInfo = {
          originalName: file.originalname,
          fileName,
          filePath: `/assets/${sanitizedFolderName}/${fileName}`,
          fullPath: filePath,
          size: stats.size,
          sizeFormatted: formatFileSize(stats.size),
          mimeType: file.mimetype,
          fileType,
          extension: ext,
          uploadedAt: new Date().toISOString(),
          folder: sanitizedFolderName,
        };

        if (generateThumbnail === "true" && fileType === "image") {
          try {
            const thumb = await generateImageThumbnail(
              filePath,
              uploadDir,
              fileName
            );
            fileInfo.thumbnail = thumb;
          } catch (err) {
            fileInfo.thumbnail = null;
            console.warn("Thumbnail error:", err.message);
          }
        }
        const { fullPath, ...allData } = fileInfo;
        uploadedFiles.push(allData);
      } catch (err) {
        errors.push({ originalName: file.originalname, error: err.message });
      }
    }

    const response = {
      status: true,
      message:
        `Uploaded ${uploadedFiles.length} file(s)` +
        (errors.length ? ` with ${errors.length} error(s)` : ""),
      data: uploadedFiles,
    };

    // Include errors if any
    if (errors.length > 0) {
      response.errors = errors;
      response.message += ` with ${errors.length} error(s)`;
    }

    res.status(200).json(response);
  } catch (error) {
    console.error("Upload files error:", error);
    res.status(500).json({
      status: false,
      message: "Internal server error during file upload",
      details: error.message,
    });
  }
};

const deleteFile = async (req, res) => {
  try {
    const { fileName } = req.params;
    const { deleteThumbnail = "true" } = req.query;

    if (!fileName) {
      return res
        .status(400)
        .json({ status: false, message: "Missing folder or file name" });
    }

    const filePath = path.join(process.cwd(), "public", fileName);

    if (!(await fs.pathExists(filePath))) {
      return res.status(404).json({ status: false, message: "File not found" });
    }

    await fs.remove(filePath);

    if (deleteThumbnail === "true") {
      const thumbPath = path.join(
        process.cwd(),
        "public",
        folder,
        "thumbnails",
        `thumb_${fileName}`
      );
      if (await fs.pathExists(thumbPath)) {
        await fs.remove(thumbPath);
      }
    }

    res.status(200).json({
      status: true,
      message: "File deleted successfully",
      data: {
        fileName,
        folder: sanitizedFolderName,
        deletedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Delete file error:", error);
    res.status(500).json({
      status: false,
      message: "Internal server error",
      details: error.message,
    });
  }
};

// Helper function to determine file type based on extension
function getFileType(extension) {
  const ext = extension.toLowerCase();

  const imageExtensions = [
    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
    ".bmp",
    ".webp",
    ".svg",
    ".ico",
  ];
  const documentExtensions = [
    ".pdf",
    ".doc",
    ".docx",
    ".xls",
    ".xlsx",
    ".ppt",
    ".pptx",
    ".txt",
    ".rtf",
    ".odt",
  ];
  const videoExtensions = [
    ".mp4",
    ".avi",
    ".mov",
    ".wmv",
    ".flv",
    ".webm",
    ".mkv",
    ".m4v",
  ];
  const audioExtensions = [
    ".mp3",
    ".wav",
    ".flac",
    ".aac",
    ".ogg",
    ".wma",
    ".m4a",
  ];
  const archiveExtensions = [".zip", ".rar", ".7z", ".tar", ".gz", ".bz2"];

  if (imageExtensions.includes(ext)) return "image";
  if (documentExtensions.includes(ext)) return "document";
  if (videoExtensions.includes(ext)) return "video";
  if (audioExtensions.includes(ext)) return "audio";
  if (archiveExtensions.includes(ext)) return "archive";

  return "other";
}

// Helper function to format file size
function formatFileSize(bytes) {
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

async function generateImageThumbnail(originalPath, uploadDir, fileName) {
  const thumbDir = path.join(uploadDir, "thumbnails");
  await fs.ensureDir(thumbDir);
  const thumbName = `thumb_${fileName}`;
  const thumbPath = path.join(thumbDir, thumbName);
  await fs.copy(originalPath, thumbPath); // Simplified. Use Sharp for real resizing.
  const size = (await fs.stat(thumbPath)).size;
  return {
    fileName: thumbName,
    filePath: `/assets/${path.basename(uploadDir)}/thumbnails/${thumbName}`,
    size,
  };
}

module.exports = {
  upload,
  uploadFiles,
  deleteFile,
  getFileType,
  formatFileSize,
};

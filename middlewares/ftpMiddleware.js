const uploadToSFTP = require("../helpers/ftpUpload");

async function sftpMiddleware(req, res, next) {
    try {
        console.log("Request files received:", req.files); // Debugging incoming files

        // Ensure that files are present in the request
        if (!req.files || Object.keys(req.files).length === 0) {
            return res.status(400).json({ message: "No files were uploaded." });
        }

        const file = req.files.file; // Match the key "file" from the frontend

        // Debugging file information
        console.log("File Info:");
        console.log("Name:", file.name);
        console.log("Size:", file.size);
        console.log("Data (Buffer Length):", file.data ? file.data.length : "No Data");

        // Validate file data
        if (!file || !file.data || file.data.length === 0) {
            return res.status(400).json({ message: "Invalid or empty file data." });
        }

        // Define remote directory and path
        const remoteDirectory = "/cloudapi.arinci.nl/uploads";
        const remoteFilePath = `${remoteDirectory}/${Date.now()}-${file.name}`;

        console.log(`Uploading to SFTP: ${remoteFilePath}`);

        // Upload to SFTP
        await uploadToSFTP(file.data, remoteFilePath);

        // Attach file metadata to the request for use in the next middleware/controller
        req.file = {
            originalname: file.name,
            size: file.size,
            sftpPath: remoteFilePath,
        };

        console.log(`File uploaded successfully to: ${remoteFilePath}`);
        next(); // Proceed to the next middleware/controller
    } catch (error) {
        console.error("SFTP Middleware Error:", error);
        res.status(500).json({ message: "SFTP upload failed", error: error.message });
    }
}

module.exports = sftpMiddleware;

const db = require('../db');
const path = require('path');
const uploadToFTP = require('../helpers/ftpUpload');
const fs = require('fs').promises;



const listFiles = async (req, res) => {
    const userId = req.user.id;
    try {
        const [files] = await db.execute('SELECT * FROM Files WHERE user_id = ?', [userId]);
        res.json(files);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// const uploadFile = async (req, res) => {
//     const userId = req.user.id;
//     const { filename, path, size } = req.file;

//     try {
//         // Fetch user's current storage usage and max storage limit
//         const [user] = await db.execute('SELECT used_storage, max_storage FROM Users WHERE id = ?', [userId]);

//         if (!user[0]) {
//             return res.status(404).json({ message: 'User not found' });
//         }

//         const { used_storage, max_storage } = user[0];

//         // Check if the new file exceeds the user's storage limit
//         if (used_storage + size > max_storage) {
//             return res.status(400).json({ message: 'Storage limit exceeded' });
//         }

//         // Insert the file record into the database
//         const query = 'INSERT INTO Files (user_id, filename, path, size) VALUES (?, ?, ?, ?)';
//         await db.execute(query, [userId, filename, path, size]);

//         // Update the user's storage usage
//         const updateStorage = 'UPDATE Users SET used_storage = used_storage + ? WHERE id = ?';
//         await db.execute(updateStorage, [size, userId]);

//         res.status(201).json({ message: 'File uploaded successfully' });
//     } catch (err) {
//         res.status(400).json({ error: err });
//     }
// };

const uploadFile = async (req, res) => {
    const userId = req.user.id;
    const { originalname, size, sftpPath } = req.file; // Use values from sftpMiddleware

    try {
        // Fetch user's current storage usage and max storage limit
        const [user] = await db.execute("SELECT used_storage, max_storage FROM Users WHERE id = ?", [userId]);

        if (!user[0]) {
            return res.status(404).json({ message: "User not found" });
        }

        const { used_storage, max_storage } = user[0];

        // Check if the new file exceeds the user's storage limit
        if (used_storage + size > max_storage) {
            return res.status(400).json({ message: "Storage limit exceeded" });
        }

        // Save file information to the database
        const query = "INSERT INTO Files (user_id, filename, path, size) VALUES (?, ?, ?, ?)";
        await db.execute(query, [userId, originalname, sftpPath, size]);

        // Update the user's storage usage
        const updateStorage = "UPDATE Users SET used_storage = used_storage + ? WHERE id = ?";
        await db.execute(updateStorage, [size, userId]);

        res.status(201).json({ message: "File uploaded successfully", path: sftpPath });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};


const uploadChunk = async (req, res) => {
    try {
        const { chunkIndex, totalChunks, fileName } = req.body;
        const chunk = req.files?.chunk;

        if (!chunk || chunk.size === 0) {
            return res.status(400).json({ message: "Invalid or empty chunk" });
        }

        console.log("Received chunk details:", {
            fileName,
            chunkIndex,
            totalChunks,
            chunkSize: chunk.size,
        });

        // Create a temporary directory for storing chunks
        const tempDir = path.join(__dirname, "../uploads/temp");
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        // Temporary file path (one file per upload)
        const tempFilePath = path.join(tempDir, `${fileName}.tmp`);

        // Append the chunk to the temporary file
        fs.appendFileSync(tempFilePath, chunk.data);

        // If it's the last chunk, finalize the file
        if (parseInt(chunkIndex) === parseInt(totalChunks) - 1) {
            console.log("All chunks received. Finalizing file...");

            // Move the temporary file to the final directory
            const finalDir = path.join(__dirname, "../uploads");
            if (!fs.existsSync(finalDir)) {
                fs.mkdirSync(finalDir, { recursive: true });
            }

            const finalFilePath = path.join(finalDir, fileName);

            fs.renameSync(tempFilePath, finalFilePath);

            console.log(`File upload complete: ${finalFilePath}`);
        }

        res.status(200).json({ message: "Chunk uploaded successfully." });
    } catch (error) {
        console.error("Error handling chunk upload:", error);
        res.status(500).json({ message: "Failed to upload chunk", error: error.message });
    }
};

const downloadFile = async (req, res) => {
    const fileId = req.params.id;
    const userId = req.user.id;

    try {
        const [rows] = await db.execute('SELECT * FROM Files WHERE id = ? AND user_id = ?', [fileId, userId]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'File not found or unauthorized' });
        }

        const file = rows[0];
        const filePath = path.resolve(file.path);
        res.download(filePath, file.filename);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}
const deleteFile = async (req, res) => {
    const fileId = req.params.id;
    const userId = req.user.id;

    try {
        // Fetch the file to delete
        const [rows] = await db.execute(
            'SELECT * FROM Files WHERE id = ? AND user_id = ?',
            [fileId, userId]
        );
        if (rows.length === 0) {
            return res.status(404).json({ message: 'File not found or unauthorized' });
        }

        const file = rows[0];

        // Delete the file from the filesystem
        await fs.promises.unlink(file.path);

        // Update the user's used storage
        await db.execute(
            'UPDATE Users SET used_storage = used_storage - ? WHERE id = ?',
            [file.size, userId]
        );

        // Delete the file record from the database
        await db.execute('DELETE FROM Files WHERE id = ?', [fileId]);

        res.status(200).json({ message: 'File deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};



module.exports = { listFiles, uploadFile, downloadFile, deleteFile, uploadChunk };
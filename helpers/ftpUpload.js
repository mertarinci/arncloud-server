const Client = require("ssh2-sftp-client");
require("dotenv").config();

async function uploadToSFTP(fileBuffer, remoteFilePath) {
    const sftp = new Client();

    try {
        await sftp.connect({
            host: process.env.FTP_HOST, // SFTP sunucunuzun adresi
            port: 22,                  // SFTP portu (genellikle 22)
            username: process.env.FTP_USER, // SFTP kullanıcı adı
            password: process.env.FTP_PASS, // SFTP şifresi
        });

        console.log(`Uploading to ${remoteFilePath}...`);
        await sftp.put(fileBuffer, remoteFilePath);
        console.log("Upload successful!");
    } catch (error) {
        console.error("SFTP Upload Error:", error);
        throw error;
    } finally {
        await sftp.end();
    }
}

module.exports = uploadToSFTP;

import fs from 'fs';
import SFTPUpload from 'sftp-upload';

const rawSFTPConfig = fs.readFileSync('./sftp.config.json');
const sftpConfig = JSON.parse(rawSFTPConfig);

const options = {
    host: sftpConfig.host,
    username: sftpConfig.username,
    path: './deploy',
    remoteDir: sftpConfig.remoteDir,
    password:  sftpConfig.password,
    dryRun: false,
}

const sftp = new SFTPUpload(options);

sftp.on('error', function(err) {
    throw err;
}).on('uploading', function(progress) {
    console.log('Uploading', progress.file);
    console.log(progress.percent+'% completed');
}).on('completed', function() {
    console.log('Upload Completed');
}).upload();

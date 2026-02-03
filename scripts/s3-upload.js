import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import fs from 'fs';
import path from 'path';

const LOCAL_DIRECTORY = './deploy';
const S3_DIRECTORY = 'stormlibrary';

const s3Config = JSON.parse(fs.readFileSync('./s3.config.json'));

const bucketName = s3Config.bucket;

const s3 = new S3Client({
    region: s3Config.region,
    credentials: {
        accessKeyId: s3Config.key,
        secretAccessKey: s3Config.secret
    }
});

async function uploadDirectory(directory, s3Directory) {
    const files = fs.readdirSync(directory);

    for (const file of files) {
        const filePath = path.join(directory, file);
        const fileStat = fs.statSync(filePath);

        if (fileStat.isFile()) {
            await uploadFile(filePath, path.join(s3Directory, file));
        } else if (fileStat.isDirectory()) {
            await uploadDirectory(filePath, path.join(s3Directory, file));
        }
    }
}

async function uploadFile(filePath, s3Key) {
    const fileContent = fs.readFileSync(filePath);

    const params = {
        Bucket: bucketName,
        Key: s3Key,
        Body: fileContent
    };

    try {
        const data = await s3.send(new PutObjectCommand(params));
        console.log(`File uploaded successfully: ${s3Key}`);
    } catch (err) {
        console.log(`Error uploading ${s3Key}:`, err);
    }
}

uploadDirectory(LOCAL_DIRECTORY, S3_DIRECTORY);
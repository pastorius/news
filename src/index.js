
import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { Readable } from "stream";

const fetchMetadataForPrefix = async (bucketName, prefix) => {
    const s3Client = new S3Client({ region: "us-east-2" }); // Replace with your AWS Region
    const command = new ListObjectsV2Command({
        Bucket: bucketName,
        Prefix: prefix,
    });

    try {
        const response = await s3Client.send(command);
        if (response.Contents) {
            // Map through objects to retrieve metadata
            return response.Contents.map((object) => ({
                Key: object.Key,
                LastModified: object.LastModified,
                Size: object.Size,
                ETag: object.ETag,
                StorageClass: object.StorageClass,
            }));
        } else {
            console.log("No objects found with the given prefix.");
            return [];
        }
    } catch (error) {
        console.error("Error fetching objects:", error);
        throw error;
    }
};


// Utility function to read a stream into a string
const streamToString = async (stream) => {
    return new Promise((resolve, reject) => {
        const chunks = [];
        stream.on("data", (chunk) => chunks.push(chunk));
        stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
        stream.on("error", reject);
    });
};

// Fetch the data for an object
const fetchObjectData = async (bucketName, key) => {
    const s3Client = new S3Client({ region: "us-east-2" }); // Replace with your AWS Region
    const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: key,
    });

    try {
        const response = await s3Client.send(command);
        // Convert the response.Body stream to a string (or handle as needed)
        const body = await streamToString(response.Body);
        return { key, data: body };
    } catch (error) {
        console.error(`Error fetching object ${key}:`, error);
        throw error;
    }
};

// Example: Process metadata and fetch object data
const fetchAllObjectsData = async (bucketName, metadataArray) => {
    const results = [];

    for (const { Key } of metadataArray) {
        try {
            console.log(`Fetching data for object: ${Key}`);
            const objectData = await fetchObjectData(bucketName, Key);
            results.push(objectData);
        } catch (error) {
            console.error(`Failed to fetch data for ${Key}:`, error);
        }
    }

    return results;
};

// Example usage
const bucketName = "smitchee-news";
const prefix = "inbound/";

try {
    const metadataArray = await fetchMetadataForPrefix(bucketName, prefix)
    const data = await fetchAllObjectsData(bucketName, metadataArray)
    
} catch(e) {
    console.log(e)
}
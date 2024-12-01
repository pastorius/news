const {
  S3Client,
  GetObjectCommand,
  PutObjectTaggingCommand,
} = require("@aws-sdk/client-s3");

class InvalidEmailError extends Error {
  constructor(content) {
    super(`Invalid email: ${content.Bucket}/${content.Key}`)
    this.content = content
  }
}

const streamToString = async (stream) => {
  return new Promise((resolve, reject) => {
      const chunks = [];
      stream.on("data", (chunk) => chunks.push(chunk));
      stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
      stream.on("error", reject);
  });
};
  
module.exports.handler = async (event) => {
  const bucketName = event.Records[0].s3.bucket.name;
  const objectKey = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, " "));

  const getObjectParams = { Bucket: bucketName, Key: objectKey };
  const s3Client = new S3Client({ region: "us-east-2" });

  let Body, objectContent
  try {
      Body = (await s3Client.send(new GetObjectCommand(getObjectParams))).Body;
      objectContent = await streamToString(Body);
    } catch (error) {
      console.error("Error fetching object:", error);
      throw error;
  }

  if(!objectContent.match(/hello@join1440\.com/)) {
    const content = {
      Bucket: bucketName,
      Key: objectKey,
      Tagging: {
        TagSet: [
          {
            Key: "invalid",
            Value: true,
          },
        ],
      },
    }
    await s3Client.send(new PutObjectTaggingCommand(content))
    throw new InvalidEmailError(content)
  }
};
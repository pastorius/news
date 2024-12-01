const { SESClient, SendEmailCommand } = require("@aws-sdk/client-ses");

const {
  S3Client,
  GetObjectCommand,
  ListObjectsV2Command,
} = require("@aws-sdk/client-s3");

const streamToString = async (stream) => {
  return new Promise((resolve, reject) => {
      const chunks = [];
      stream.on("data", (chunk) => chunks.push(chunk));
      stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
      stream.on("error", reject);
  });
};

module.exports.handler = async (event) => {
  try {
      console.log("Received event:", JSON.stringify(event, null, 2));

      const bucketName = event.Records[0].s3.bucket.name;
      const objectKey = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, " "));

      const getObjectParams = { Bucket: bucketName, Key: objectKey };
      const s3Client = new S3Client({ region: "us-east-2" }); // Replace with your AWS Region
      const { Body } = await s3Client.send(new GetObjectCommand(getObjectParams));
      const objectContent = await streamToString(Body);

      const emailParams = {
        Destination: {
          ToAddresses: ["no-reply@news.smitchee.com"],
          BccAddresses: [
            'smitch@smitchee.com'
          ]
        },
        Message: {
          Body: {
            Text: { Data: objectContent },
          },
          Subject: { Data: objectKey },
        },
        Source: "no-reply@news.smitchee.com",
      };

      const sesClient = new SESClient({ region: 'us-east-2' })
      const emailResponse = await sesClient.send(new SendEmailCommand(emailParams));
      console.log("Email sent successfully:", emailResponse);
  } catch (error) {
      console.error("Error processing S3 event:", error);
      throw error;
  }
};
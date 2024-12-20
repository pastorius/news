const { SESClient, SendEmailCommand } = require("@aws-sdk/client-ses")
const { Converter } = require('showdown')
const {
  S3Client,
  GetObjectCommand,
  ListObjectsV2Command,
} = require("@aws-sdk/client-s3");

const {
  SecretsManagerClient,
  GetSecretValueCommand,
} = require("@aws-sdk/client-secrets-manager")

const fetchEmailSecrets = async () {
  const secret_name = "smitchee-news/email";

  const client = new SecretsManagerClient({
    region: "us-east-2",
  });
  
  const response = await client.send(
    new GetSecretValueCommand({
      SecretId: secret_name,
      VersionStage: "AWSCURRENT", // VersionStage defaults to AWSCURRENT if unspecified
    })
  );
  return JSON.parse(response.SecretString);
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
  try {
      console.log("Received event:", JSON.stringify(event, null, 2));

      const bucketName = event.Records[0].s3.bucket.name;
      const objectKey = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, " "));

      const getObjectParams = { Bucket: bucketName, Key: objectKey };
      const s3Client = new S3Client({ region: "us-east-2" }); // Replace with your AWS Region
      const { Body } = await s3Client.send(new GetObjectCommand(getObjectParams));
      const objectContent = await streamToString(Body);
      const secrets = await fetchEmailSecrets()
      const emailParams = {
        Destination: {
          ToAddresses: secrets['addresses-to'].split(','),
          BccAddresses: secrets['addresses-bcc'].split(',')
        },
        Message: {
          Body: {
            Text: { Data: objectContent },
            Html: { Data: new Converter().makeHtml(objectContent) }
          },
          Subject: { Data: objectKey },
        },
        Source: secrets['addresses-from'].split(',')[0],
      };

      const sesClient = new SESClient({ region: 'us-east-2' })
      const emailResponse = await sesClient.send(new SendEmailCommand(emailParams));
      console.log("Email sent successfully:", emailResponse);
  } catch (error) {
      console.error("Error processing S3 event:", error);
      throw error;
  }
};
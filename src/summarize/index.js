const {
  S3Client,
  GetObjectCommand,
  GetObjectTaggingCommand,
  ListObjectsV2Command,
} = require("@aws-sdk/client-s3");
const { Upload } = require("@aws-sdk/lib-storage");
const { buildPrompt } = require('./parse')

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
  const s3Client = new S3Client({ region: "us-east-2" }); // Replace with your AWS Region
  const tagResults = await Promise.all(
    metadataArray.map(async (i) => {
      const result = await s3Client.send(new GetObjectTaggingCommand({
        Bucket: bucketName,
        Key: i.Key,
      }))
      return {
        Bucket: bucketName,
        Key: i.Key,
        TagSet: result.TagSet
      }
    })
  )  
  const filtered = tagResults.filter(tagResponse => !tagResponse.TagSet.some(t => t.Key === 'invalid'))
  console.log(filtered)
  return Promise.all(filtered.map(i => fetchObjectData(bucketName, i.Key)))
};

const {
	BedrockRuntimeClient,
	InvokeModelCommand
} = require("@aws-sdk/client-bedrock-runtime");

const invokeModel = async (content) => {
	const client = new BedrockRuntimeClient({ apiVersion: 'latest', region: 'us-east-2' });
	const modelId = "us.anthropic.claude-3-5-sonnet-20240620-v1:0"
  // const modelId = "arn:aws:bedrock:us-east-1:651706771017:inference-profile/us.anthropic.claude-3-5-sonnet-20240620-v1:0"
  const response = await client.send(new InvokeModelCommand({
		modelId,
		contentType: "application/json",
    
		body: JSON.stringify({
			temperature: 0,
			anthropic_version: "bedrock-2023-05-31",
			max_tokens: 200000,
			system: 'Respond as the editor of an independent, unbiased news magazine.',
			messages: [{ role: 'user', content }],
		})
	}));
	return JSON.parse(new TextDecoder().decode(response.body));
};

const s3SaveOpts = (file, readable) => {
  const s3Opts = {
    Bucket: 'smitchee-news',
    Key: `outbound/${file.name}`,
    // ServerSideEncryption: 'AES256',
    ContentDisposition: `attachment; filename=${file.name}`,
    ContentType: 'text/plain',
    // ContentType: mime.getType(file.filename || file.key.path),
    // StorageClass: 'INTELLIGENT_TIERING',
  }
  if (readable) s3Opts.Body = readable
  return s3Opts
}

const saveToS3 = async (context) => {
  const opts = s3SaveOpts(context.file, context.body)
  const s3Client = new S3Client({ region: "us-east-2" }); // Replace with your AWS Region
  const upload = new Upload({
    client: s3Client,
    leavePartsOnError: false, // optional manually handle dropped parts
    params: opts,
  })
  await upload.done()
}

module.exports.handler = async () => {
  const bucketName = "smitchee-news";
  
  try {
      const metadataArray = await fetchMetadataForPrefix(bucketName, "inbound/")
      const results = await fetchAllObjectsData(bucketName, metadataArray)
      console.log(`Fetched metadata for ${results.length} news items.`)
      const content = await buildPrompt(...results.map(r => r.data))
      console.log('Invoking inference...')
      const news = (await invokeModel(content)).content[0].text
      const firstLine = news.split('\n')[0]
      console.log(`Saving results for ${firstLine}...`)
      const endDate = firstLine.split(' to ')[1].replaceAll(' ', '-')
      await saveToS3({
        file: { name: `${endDate}.md` },
        body: news
      })
      console.log(`Completed processing ${firstLine}.`)
  } catch(e) {
      console.log(e)
  }
};
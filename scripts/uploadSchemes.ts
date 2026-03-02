import * as fs from 'fs';
import * as path from 'path';
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, BatchWriteCommand } from "@aws-sdk/lib-dynamodb";
import { ALL_SCHEMES } from "../data/schemesDb";

// Helper to load .env.local variables
function loadEnv() {
    try {
        const envPath = path.join(process.cwd(), '.env.local');
        if (fs.existsSync(envPath)) {
            const envContent = fs.readFileSync(envPath, 'utf8');
            envContent.split('\n').forEach(line => {
                const [key, value] = line.split('=');
                if (key && value) {
                    const cleanKey = key.trim();
                    const cleanValue = value.trim().replace(/^["']|["']$/g, '');
                    // Map VITE_ keys to standard AWS keys
                    if (cleanKey === 'VITE_AWS_ACCESS_KEY_ID') process.env.AWS_ACCESS_KEY_ID = cleanValue;
                    if (cleanKey === 'VITE_AWS_SECRET_ACCESS_KEY') process.env.AWS_SECRET_ACCESS_KEY = cleanValue;
                    if (cleanKey === 'VITE_AWS_REGION') process.env.AWS_REGION = cleanValue;
                }
            });
        }
    } catch (e) {
        console.log("No .env.local found or error reading it.");
    }
}

loadEnv();

const clientConfig: any = {
    region: process.env.AWS_REGION || "ap-south-1",
};

if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    clientConfig.credentials = {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    };
}

const client = new DynamoDBClient(clientConfig);

const docClient = DynamoDBDocumentClient.from(client);

async function uploadSchemes() {
    console.log(`Starting upload of ${ALL_SCHEMES.length} schemes...`);

    const TABLE_NAME = "JanSaarthiSchemes";
    const BATCH_SIZE = 25; // DynamoDB batchWrite limit

    for (let i = 0; i < ALL_SCHEMES.length; i += BATCH_SIZE) {
        const batch = ALL_SCHEMES.slice(i, i + BATCH_SIZE);

        const putRequests = batch.map(scheme => ({
            PutRequest: {
                Item: scheme
            }
        }));

        const command = new BatchWriteCommand({
            RequestItems: {
                [TABLE_NAME]: putRequests
            }
        });

        try {
            await docClient.send(command);
            console.log(`Uploaded batch ${Math.floor(i / BATCH_SIZE) + 1} (${i + batch.length}/${ALL_SCHEMES.length})`);
        } catch (error) {
            console.error(`Error uploading batch starting at index ${i}:`, error);
        }
    }

    console.log("Upload complete!");
}

uploadSchemes().catch(console.error);

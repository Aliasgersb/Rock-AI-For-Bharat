import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const loadEnv = () => {
    try {
        const envPath = path.resolve(__dirname, '../.env.local');
        const envContent = fs.readFileSync(envPath, 'utf8');
        envContent.split('\n').forEach(line => {
            const match = line.match(/^([^=]+)=(.*)$/);
            if (match) {
                const key = match[1].trim();
                let value = match[2].trim();
                if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
                if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
                if (key.startsWith('VITE_AWS_')) {
                    process.env[key.replace('VITE_', '')] = value;
                } else {
                    process.env[key] = value;
                }
            }
        });
    } catch (e) {
        console.log("No .env.local found:", e.message);
    }
};

loadEnv();

const config: any = { region: process.env.AWS_REGION || 'ap-south-1' };
if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    config.credentials = {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    };
}
const client = new DynamoDBClient(config);
const docClient = DynamoDBDocumentClient.from(client);

async function analyzeDatabase() {
    console.log("Starting deep analysis of the entire JanSaarthiSchemes table...");
    const allItems: any[] = [];
    let lastEvaluatedKey = undefined;

    do {
        const command = new ScanCommand({
            TableName: "JanSaarthiSchemes",
            ExclusiveStartKey: lastEvaluatedKey
        });

        try {
            const response = await docClient.send(command);
            if (response.Items) {
                allItems.push(...response.Items);
            }
            lastEvaluatedKey = response.LastEvaluatedKey;
            process.stdout.write(`\rScanned ${allItems.length} items so far...`);
        } catch (error) {
            console.error("\nError scanning table:", error);
            break;
        }
    } while (lastEvaluatedKey);

    console.log(`\n\nTotal Schemes Found in DB: ${allItems.length}`);

    // Analysis for duplicates
    const idMap = new Map<string, number>();
    const titleMap = new Map<string, number>();
    const duplicateIds: string[] = [];
    const duplicateTitles: string[] = [];

    for (const item of allItems) {
        // Check ID
        const idCount = idMap.get(item.id) || 0;
        idMap.set(item.id, idCount + 1);
        if (idCount === 1) duplicateIds.push(item.id); // Log once when it becomes a duplicate

        // Check Title
        const titleCount = titleMap.get(item.title) || 0;
        titleMap.set(item.title, titleCount + 1);
        if (titleCount === 1) duplicateTitles.push(item.title);
    }

    console.log("\n=== DEEP ANALYSIS REPORT ===");
    console.log(`Unique IDs: ${idMap.size}`);
    console.log(`Unique Titles: ${titleMap.size}`);

    if (duplicateIds.length === 0 && duplicateTitles.length === 0) {
        console.log("\n✅ 100% CONFIRMED: No duplicates found! Every single scheme is unique.");
    } else {
        if (duplicateIds.length > 0) {
            console.log(`\n⚠️ Found ${duplicateIds.length} duplicate IDs:`);
            console.log(duplicateIds.slice(0, 10).join(', ') + (duplicateIds.length > 10 ? '...' : ''));
        }
        if (duplicateTitles.length > 0) {
            console.log(`\n⚠️ Found ${duplicateTitles.length} duplicate Titles:`);
            console.log(duplicateTitles.slice(0, 10).join(', ') + (duplicateTitles.length > 10 ? '...' : ''));

            // Show exactly which items share a title
            console.log("\nExamples of title collisions in the DB:");
            const collisionTitle = duplicateTitles[0];
            const overlapping = allItems.filter(i => i.title === collisionTitle);
            overlapping.forEach(o => {
                console.log(`- ID: ${o.id}, Title: "${o.title}"`);
            });
        }
    }
}

analyzeDatabase();

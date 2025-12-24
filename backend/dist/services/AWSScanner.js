"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AWSScanner = void 0;
const client_ec2_1 = require("@aws-sdk/client-ec2");
const client_lambda_1 = require("@aws-sdk/client-lambda");
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const client_s3_1 = require("@aws-sdk/client-s3");
const client_rds_1 = require("@aws-sdk/client-rds");
class AWSScanner {
    constructor(credentials) {
        this.region = credentials.region;
        const config = {
            region: credentials.region,
            credentials: {
                accessKeyId: credentials.accessKeyId,
                secretAccessKey: credentials.secretAccessKey
            }
        };
        this.ec2Client = new client_ec2_1.EC2Client(config);
        this.lambdaClient = new client_lambda_1.LambdaClient(config);
        this.dynamoClient = new client_dynamodb_1.DynamoDBClient(config);
        this.s3Client = new client_s3_1.S3Client(config);
        this.rdsClient = new client_rds_1.RDSClient(config);
    }
    scanEC2Instances() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            try {
                console.log('📡 Scanning EC2 instances...');
                const command = new client_ec2_1.DescribeInstancesCommand({});
                const response = yield this.ec2Client.send(command);
                const instances = [];
                for (const reservation of response.Reservations || []) {
                    for (const instance of reservation.Instances || []) {
                        const tags = {};
                        for (const tag of instance.Tags || []) {
                            if (tag.Key && tag.Value) {
                                tags[tag.Key] = tag.Value;
                            }
                        }
                        const instanceName = tags['Name'] || instance.InstanceId || 'Unnamed Instance';
                        instances.push({
                            id: instance.InstanceId || '',
                            name: instanceName,
                            type: instance.InstanceType || '',
                            state: ((_a = instance.State) === null || _a === void 0 ? void 0 : _a.Name) || '',
                            launchTime: ((_b = instance.LaunchTime) === null || _b === void 0 ? void 0 : _b.toISOString()) || '',
                            lastModified: (_c = instance.LaunchTime) === null || _c === void 0 ? void 0 : _c.toISOString(), // Use launch time as last modified
                            vpcId: instance.VpcId,
                            privateIp: instance.PrivateIpAddress,
                            publicIp: instance.PublicIpAddress,
                            tags
                        });
                    }
                }
                console.log(`✅ Found ${instances.length} EC2 instances`);
                return instances;
            }
            catch (error) {
                console.error('❌ EC2 scan failed:', error);
                return [];
            }
        });
    }
    scanElasticIPs() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log('📡 Scanning Elastic IPs...');
                const command = new client_ec2_1.DescribeAddressesCommand({});
                const response = yield this.ec2Client.send(command);
                const elasticIPs = (response.Addresses || []).map(addr => ({
                    publicIp: addr.PublicIp || '',
                    name: addr.PublicIp || addr.AllocationId || 'Unknown IP',
                    allocationId: addr.AllocationId || '',
                    isAttached: !!addr.AssociationId,
                    instanceId: addr.InstanceId,
                    lastModified: new Date().toISOString() // Set current date as fallback
                }));
                console.log(`✅ Found ${elasticIPs.length} Elastic IPs (${elasticIPs.filter(ip => !ip.isAttached).length} unattached)`);
                return elasticIPs;
            }
            catch (error) {
                console.error('❌ Elastic IP scan failed:', error);
                return [];
            }
        });
    }
    scanEBSVolumes() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log('📡 Scanning EBS volumes...');
                const command = new client_ec2_1.DescribeVolumesCommand({});
                const response = yield this.ec2Client.send(command);
                const volumes = (response.Volumes || []).map(vol => {
                    var _a, _b, _c, _d, _e;
                    return ({
                        volumeId: vol.VolumeId || '',
                        name: vol.VolumeId || 'Unnamed Volume',
                        size: vol.Size || 0,
                        volumeType: vol.VolumeType || '',
                        state: vol.State || '',
                        isAttached: (((_a = vol.Attachments) === null || _a === void 0 ? void 0 : _a.length) || 0) > 0,
                        instanceId: (_c = (_b = vol.Attachments) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.InstanceId,
                        createdAt: (_d = vol.CreateTime) === null || _d === void 0 ? void 0 : _d.toISOString(),
                        lastModified: (_e = vol.CreateTime) === null || _e === void 0 ? void 0 : _e.toISOString() // Use creation time as fallback
                    });
                });
                console.log(`✅ Found ${volumes.length} EBS volumes (${volumes.filter(v => !v.isAttached).length} unattached)`);
                return volumes;
            }
            catch (error) {
                console.error('❌ EBS scan failed:', error);
                return [];
            }
        });
    }
    scanLambdaFunctions() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log('📡 Scanning Lambda functions...');
                const command = new client_lambda_1.ListFunctionsCommand({});
                const response = yield this.lambdaClient.send(command);
                const functions = (response.Functions || []).map(func => ({
                    name: func.FunctionName || '',
                    runtime: func.Runtime || '',
                    memorySize: func.MemorySize || 128,
                    lastModified: func.LastModified || '',
                    codeSize: func.CodeSize || 0
                }));
                console.log(`✅ Found ${functions.length} Lambda functions`);
                return functions;
            }
            catch (error) {
                console.error('❌ Lambda scan failed:', error);
                return [];
            }
        });
    }
    scanDynamoDBTables() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e;
            try {
                console.log('📡 Scanning DynamoDB tables...');
                const listCommand = new client_dynamodb_1.ListTablesCommand({});
                const listResponse = yield this.dynamoClient.send(listCommand);
                const tables = [];
                for (const tableName of listResponse.TableNames || []) {
                    try {
                        const describeCommand = new client_dynamodb_1.DescribeTableCommand({ TableName: tableName });
                        const tableDesc = yield this.dynamoClient.send(describeCommand);
                        const table = tableDesc.Table;
                        if (table) {
                            tables.push({
                                name: table.TableName || '',
                                billingMode: ((_a = table.BillingModeSummary) === null || _a === void 0 ? void 0 : _a.BillingMode) || 'PROVISIONED',
                                itemCount: table.ItemCount || 0,
                                tableSizeBytes: table.TableSizeBytes || 0,
                                provisionedReadCapacity: (_b = table.ProvisionedThroughput) === null || _b === void 0 ? void 0 : _b.ReadCapacityUnits,
                                provisionedWriteCapacity: (_c = table.ProvisionedThroughput) === null || _c === void 0 ? void 0 : _c.WriteCapacityUnits,
                                createdAt: (_d = table.CreationDateTime) === null || _d === void 0 ? void 0 : _d.toISOString(),
                                lastModified: (_e = table.CreationDateTime) === null || _e === void 0 ? void 0 : _e.toISOString() // Use creation time as fallback
                            });
                        }
                    }
                    catch (err) {
                        console.warn(`⚠️ Could not describe table ${tableName}:`, err);
                    }
                }
                console.log(`✅ Found ${tables.length} DynamoDB tables`);
                return tables;
            }
            catch (error) {
                console.error('❌ DynamoDB scan failed:', error);
                return [];
            }
        });
    }
    scanS3Buckets() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                console.log('📡 Scanning S3 buckets...');
                const command = new client_s3_1.ListBucketsCommand({});
                const response = yield this.s3Client.send(command);
                const buckets = [];
                for (const bucket of response.Buckets || []) {
                    if (bucket.Name) {
                        let region = this.region;
                        let lastModified;
                        // 1. Get Region
                        try {
                            const locationCmd = new client_s3_1.GetBucketLocationCommand({ Bucket: bucket.Name });
                            const locationResp = yield this.s3Client.send(locationCmd);
                            region = locationResp.LocationConstraint || 'us-east-1';
                        }
                        catch (err) {
                            // Region fallback
                        }
                        // 2. Get Last Activity (Check for objects)
                        try {
                            // Create a client for the specific bucket region if needed, 
                            // but usually the global client works if region is configured correctly.
                            // However, for S3, it's safer to just try listing.
                            const listCmd = new client_s3_1.ListObjectsV2Command({
                                Bucket: bucket.Name,
                                MaxKeys: 1
                            });
                            const objectsResp = yield this.s3Client.send(listCmd);
                            if (objectsResp.Contents && objectsResp.Contents.length > 0) {
                                lastModified = (_a = objectsResp.Contents[0].LastModified) === null || _a === void 0 ? void 0 : _a.toISOString();
                            }
                        }
                        catch (err) {
                            // Access denied or other error
                            // console.warn(`Could not list objects in ${bucket.Name}`);
                        }
                        buckets.push({
                            name: bucket.Name,
                            creationDate: ((_b = bucket.CreationDate) === null || _b === void 0 ? void 0 : _b.toISOString()) || '',
                            region: region,
                            lastModified: lastModified
                        });
                    }
                }
                console.log(`✅ Found ${buckets.length} S3 buckets`);
                return buckets;
            }
            catch (error) {
                console.error('❌ S3 scan failed:', error);
                return [];
            }
        });
    }
    scanRDSInstances() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log('📡 Scanning RDS instances...');
                const command = new client_rds_1.DescribeDBInstancesCommand({});
                const response = yield this.rdsClient.send(command);
                const instances = (response.DBInstances || []).map(db => {
                    var _a, _b;
                    return ({
                        identifier: db.DBInstanceIdentifier || '',
                        name: db.DBInstanceIdentifier || 'Unnamed DB',
                        instanceClass: db.DBInstanceClass || '',
                        engine: db.Engine || '',
                        status: db.DBInstanceStatus || '',
                        allocatedStorage: db.AllocatedStorage || 0,
                        multiAZ: db.MultiAZ || false,
                        createdAt: (_a = db.InstanceCreateTime) === null || _a === void 0 ? void 0 : _a.toISOString(),
                        lastModified: (_b = db.InstanceCreateTime) === null || _b === void 0 ? void 0 : _b.toISOString() // Use creation time as fallback
                    });
                });
                console.log(`✅ Found ${instances.length} RDS instances`);
                return instances;
            }
            catch (error) {
                console.error('❌ RDS scan failed:', error);
                return [];
            }
        });
    }
    scanAll() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('🚀 Starting comprehensive AWS scan...');
            const startTime = Date.now();
            const [ec2Instances, elasticIPs, ebsVolumes, lambdaFunctions, dynamoDBTables, s3Buckets, rdsInstances] = yield Promise.all([
                this.scanEC2Instances(),
                this.scanElasticIPs(),
                this.scanEBSVolumes(),
                this.scanLambdaFunctions(),
                this.scanDynamoDBTables(),
                this.scanS3Buckets(),
                this.scanRDSInstances()
            ]);
            const duration = ((Date.now() - startTime) / 1000).toFixed(2);
            console.log(`✅ AWS scan complete in ${duration}s`);
            return {
                ec2Instances,
                elasticIPs,
                ebsVolumes,
                lambdaFunctions,
                dynamoDBTables,
                s3Buckets,
                rdsInstances,
                region: this.region
            };
        });
    }
}
exports.AWSScanner = AWSScanner;

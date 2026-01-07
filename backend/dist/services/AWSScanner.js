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
const client_cost_explorer_1 = require("@aws-sdk/client-cost-explorer");
class AWSScanner {
    constructor(credentials) {
        this.region = credentials.region;
        this.config = {
            region: credentials.region,
            credentials: {
                accessKeyId: credentials.accessKeyId,
                secretAccessKey: credentials.secretAccessKey
            }
        };
        this.ec2Client = new client_ec2_1.EC2Client(this.config);
        this.lambdaClient = new client_lambda_1.LambdaClient(this.config);
        this.dynamoClient = new client_dynamodb_1.DynamoDBClient(this.config);
        this.s3Client = new client_s3_1.S3Client(this.config);
        this.rdsClient = new client_rds_1.RDSClient(this.config);
        // Cost Explorer is a global billing API, endpoint usually fixed to us-east-1
        this.costClient = new client_cost_explorer_1.CostExplorerClient(Object.assign(Object.assign({}, this.config), { region: 'us-east-1' }));
    }
    updateRegion(region) {
        const newConfig = Object.assign(Object.assign({}, this.config), { region });
        this.ec2Client = new client_ec2_1.EC2Client(newConfig);
        this.lambdaClient = new client_lambda_1.LambdaClient(newConfig);
        this.dynamoClient = new client_dynamodb_1.DynamoDBClient(newConfig);
        this.s3Client = new client_s3_1.S3Client(newConfig);
        this.rdsClient = new client_rds_1.RDSClient(newConfig);
    }
    getMonthlyCosts() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log('💰 Fetching Cost Explorer data...');
                const now = new Date();
                const start = new Date(now.getFullYear(), now.getMonth() - 6, 1); // Last 6 months
                const command = new client_cost_explorer_1.GetCostAndUsageCommand({
                    TimePeriod: {
                        Start: start.toISOString().split('T')[0],
                        End: now.toISOString().split('T')[0]
                    },
                    Granularity: 'MONTHLY',
                    Metrics: ['UnblendedCost'],
                    GroupBy: [{ Type: 'DIMENSION', Key: 'SERVICE' }]
                });
                const response = yield this.costClient.send(command);
                return response.ResultsByTime || [];
            }
            catch (error) {
                console.warn('⚠️ Cost Explorer access denied or failed. Check CE:GetCostAndUsage permissions.');
                return [];
            }
        });
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
            return this.scanGlobal();
        });
    }
    scanGlobal() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('🌍 Starting GLOBAL multi-region AWS scan...');
            const commonRegions = [
                'ap-south-1', // Mumbai (likely main for user)
                'us-east-1', // N. Virginia
                'us-east-2', // Ohio
                'us-west-2', // Oregon
                'eu-central-1', // Frankfurt
                'eu-west-1', // Ireland
                'ap-southeast-1' // Singapore
            ];
            // Ensure current region is at the start and unique
            const regionsToScan = [...new Set([this.region, ...commonRegions])];
            const allResources = {
                ec2Instances: [],
                elasticIPs: [],
                ebsVolumes: [],
                lambdaFunctions: [],
                dynamoDBTables: [],
                s3Buckets: [],
                rdsInstances: [],
                costHistory: [],
                region: this.region,
                scannedRegions: regionsToScan
            };
            // 1. Fetch Global Costs (Independent of region loop)
            allResources.costHistory = yield this.getMonthlyCosts();
            // 2. Scan each region
            for (const region of regionsToScan) {
                console.log(`📡 Scanning region: ${region}...`);
                try {
                    this.updateRegion(region);
                    const [ec2, ips, vols, lambdas, dynamos, rds] = yield Promise.all([
                        this.scanEC2Instances(),
                        this.scanElasticIPs(),
                        this.scanEBSVolumes(),
                        this.scanLambdaFunctions(),
                        this.scanDynamoDBTables(),
                        this.scanRDSInstances()
                    ]);
                    // Append regional findings (S3 is handled separately/globally usually)
                    allResources.ec2Instances.push(...ec2.map(i => (Object.assign(Object.assign({}, i), { region }))));
                    allResources.elasticIPs.push(...ips.map(i => (Object.assign(Object.assign({}, i), { region }))));
                    allResources.ebsVolumes.push(...vols.map(i => (Object.assign(Object.assign({}, i), { region }))));
                    allResources.lambdaFunctions.push(...lambdas.map(l => (Object.assign(Object.assign({}, l), { region }))));
                    allResources.dynamoDBTables.push(...dynamos.map(d => (Object.assign(Object.assign({}, d), { region }))));
                    allResources.rdsInstances.push(...rds.map(r => (Object.assign(Object.assign({}, r), { region }))));
                }
                catch (error) {
                    console.error(`❌ Shielded error in region ${region} scan:`, error);
                }
            }
            // 3. Scan S3 Buckets (Global service, but we'll run it once)
            this.updateRegion(this.region);
            allResources.s3Buckets = yield this.scanS3Buckets();
            console.log(`✅ Global Scan Complete! Total Ec2: ${allResources.ec2Instances.length}, Volumes: ${allResources.ebsVolumes.length}`);
            return allResources;
        });
    }
}
exports.AWSScanner = AWSScanner;

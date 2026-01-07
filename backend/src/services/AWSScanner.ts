import {
    EC2Client,
    DescribeInstancesCommand,
    DescribeAddressesCommand,
    DescribeVolumesCommand
} from "@aws-sdk/client-ec2";
import {
    LambdaClient,
    ListFunctionsCommand,
    GetFunctionCommand
} from "@aws-sdk/client-lambda";
import {
    DynamoDBClient,
    ListTablesCommand,
    DescribeTableCommand
} from "@aws-sdk/client-dynamodb";
import {
    S3Client,
    ListBucketsCommand,
    GetBucketLocationCommand,
    ListObjectsV2Command
} from "@aws-sdk/client-s3";
import {
    RDSClient,
    DescribeDBInstancesCommand
} from "@aws-sdk/client-rds";
import {
    CostExplorerClient,
    GetCostAndUsageCommand
} from "@aws-sdk/client-cost-explorer";

interface AWSCredentials {
    accessKeyId: string;
    secretAccessKey: string;
    region: string;
}

interface EC2Instance {
    id: string;
    name: string; // Add name field for consistent display
    type: string;
    state: string;
    launchTime: string;
    lastModified?: string; // Add for consistency
    vpcId?: string;
    privateIp?: string;
    publicIp?: string;
    tags: { [key: string]: string };
}

interface ElasticIP {
    publicIp: string;
    name: string; // Add name field for consistent display
    allocationId: string;
    isAttached: boolean;
    instanceId?: string;
    lastModified?: string; // Add for timestamp display
}

interface EBSVolume {
    volumeId: string;
    name: string; // Add name field for consistent display
    size: number; // in GB
    volumeType: string;
    state: string;
    isAttached: boolean;
    instanceId?: string;
    createdAt?: string; // Add for timestamp display
    lastModified?: string; // Add for timestamp display
}

interface LambdaFunction {
    name: string;
    runtime: string;
    memorySize: number;
    lastModified: string;
    codeSize: number;
}

interface DynamoDBTable {
    name: string;
    billingMode: string;
    itemCount: number;
    tableSizeBytes: number;
    provisionedReadCapacity?: number;
    provisionedWriteCapacity?: number;
    createdAt?: string; // Add for timestamp display
    lastModified?: string; // Add for timestamp display
}

interface S3Bucket {
    name: string;
    creationDate: string;
    region: string;
    lastModified?: string;
}

interface RDSInstance {
    identifier: string;
    name: string; // Add name field for consistent display
    instanceClass: string;
    engine: string;
    status: string;
    allocatedStorage: number;
    multiAZ: boolean;
    createdAt?: string; // Add for timestamp display
    lastModified?: string; // Add for timestamp display
}

export interface AWSResources {
    ec2Instances: EC2Instance[];
    elasticIPs: ElasticIP[];
    ebsVolumes: EBSVolume[];
    lambdaFunctions: LambdaFunction[];
    dynamoDBTables: DynamoDBTable[];
    s3Buckets: S3Bucket[];
    rdsInstances: RDSInstance[];
    costHistory?: any[];
    region: string;
    scannedRegions?: string[];
}

export class AWSScanner {
    private ec2Client: EC2Client;
    private lambdaClient: LambdaClient;
    private dynamoClient: DynamoDBClient;
    private s3Client: S3Client;
    private rdsClient: RDSClient;
    private costClient: CostExplorerClient;
    private region: string;
    private config: any;

    constructor(credentials: AWSCredentials) {
        this.region = credentials.region;

        this.config = {
            region: credentials.region,
            credentials: {
                accessKeyId: credentials.accessKeyId,
                secretAccessKey: credentials.secretAccessKey
            }
        };

        this.ec2Client = new EC2Client(this.config);
        this.lambdaClient = new LambdaClient(this.config);
        this.dynamoClient = new DynamoDBClient(this.config);
        this.s3Client = new S3Client(this.config);
        this.rdsClient = new RDSClient(this.config);
        // Cost Explorer is a global billing API, endpoint usually fixed to us-east-1
        this.costClient = new CostExplorerClient({
            ...this.config,
            region: 'us-east-1'
        });
    }

    private updateRegion(region: string) {
        const newConfig = { ...this.config, region };
        this.ec2Client = new EC2Client(newConfig);
        this.lambdaClient = new LambdaClient(newConfig);
        this.dynamoClient = new DynamoDBClient(newConfig);
        this.s3Client = new S3Client(newConfig);
        this.rdsClient = new RDSClient(newConfig);
    }

    async getMonthlyCosts(): Promise<any[]> {
        try {
            console.log('💰 Fetching Cost Explorer data...');
            const now = new Date();
            const start = new Date(now.getFullYear(), now.getMonth() - 6, 1); // Last 6 months

            const command = new GetCostAndUsageCommand({
                TimePeriod: {
                    Start: start.toISOString().split('T')[0],
                    End: now.toISOString().split('T')[0]
                },
                Granularity: 'MONTHLY',
                Metrics: ['UnblendedCost'],
                GroupBy: [{ Type: 'DIMENSION', Key: 'SERVICE' }]
            });

            const response = await this.costClient.send(command);
            return response.ResultsByTime || [];
        } catch (error) {
            console.warn('⚠️ Cost Explorer access denied or failed. Check CE:GetCostAndUsage permissions.');
            return [];
        }
    }

    async scanEC2Instances(): Promise<EC2Instance[]> {
        try {
            console.log('📡 Scanning EC2 instances...');
            const command = new DescribeInstancesCommand({});
            const response = await this.ec2Client.send(command);

            const instances: EC2Instance[] = [];

            for (const reservation of response.Reservations || []) {
                for (const instance of reservation.Instances || []) {
                    const tags: { [key: string]: string } = {};
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
                        state: instance.State?.Name || '',
                        launchTime: instance.LaunchTime?.toISOString() || '',
                        lastModified: instance.LaunchTime?.toISOString(), // Use launch time as last modified
                        vpcId: instance.VpcId,
                        privateIp: instance.PrivateIpAddress,
                        publicIp: instance.PublicIpAddress,
                        tags
                    });
                }
            }

            console.log(`✅ Found ${instances.length} EC2 instances`);
            return instances;
        } catch (error) {
            console.error('❌ EC2 scan failed:', error);
            return [];
        }
    }

    async scanElasticIPs(): Promise<ElasticIP[]> {
        try {
            console.log('📡 Scanning Elastic IPs...');
            const command = new DescribeAddressesCommand({});
            const response = await this.ec2Client.send(command);

            const elasticIPs: ElasticIP[] = (response.Addresses || []).map(addr => ({
                publicIp: addr.PublicIp || '',
                name: addr.PublicIp || addr.AllocationId || 'Unknown IP',
                allocationId: addr.AllocationId || '',
                isAttached: !!addr.AssociationId,
                instanceId: addr.InstanceId,
                lastModified: new Date().toISOString() // Set current date as fallback
            }));

            console.log(`✅ Found ${elasticIPs.length} Elastic IPs (${elasticIPs.filter(ip => !ip.isAttached).length} unattached)`);
            return elasticIPs;
        } catch (error) {
            console.error('❌ Elastic IP scan failed:', error);
            return [];
        }
    }

    async scanEBSVolumes(): Promise<EBSVolume[]> {
        try {
            console.log('📡 Scanning EBS volumes...');
            const command = new DescribeVolumesCommand({});
            const response = await this.ec2Client.send(command);

            const volumes: EBSVolume[] = (response.Volumes || []).map(vol => ({
                volumeId: vol.VolumeId || '',
                name: vol.VolumeId || 'Unnamed Volume',
                size: vol.Size || 0,
                volumeType: vol.VolumeType || '',
                state: vol.State || '',
                isAttached: (vol.Attachments?.length || 0) > 0,
                instanceId: vol.Attachments?.[0]?.InstanceId,
                createdAt: vol.CreateTime?.toISOString(),
                lastModified: vol.CreateTime?.toISOString() // Use creation time as fallback
            }));

            console.log(`✅ Found ${volumes.length} EBS volumes (${volumes.filter(v => !v.isAttached).length} unattached)`);
            return volumes;
        } catch (error) {
            console.error('❌ EBS scan failed:', error);
            return [];
        }
    }

    async scanLambdaFunctions(): Promise<LambdaFunction[]> {
        try {
            console.log('📡 Scanning Lambda functions...');
            const command = new ListFunctionsCommand({});
            const response = await this.lambdaClient.send(command);

            const functions: LambdaFunction[] = (response.Functions || []).map(func => ({
                name: func.FunctionName || '',
                runtime: func.Runtime || '',
                memorySize: func.MemorySize || 128,
                lastModified: func.LastModified || '',
                codeSize: func.CodeSize || 0
            }));

            console.log(`✅ Found ${functions.length} Lambda functions`);
            return functions;
        } catch (error) {
            console.error('❌ Lambda scan failed:', error);
            return [];
        }
    }

    async scanDynamoDBTables(): Promise<DynamoDBTable[]> {
        try {
            console.log('📡 Scanning DynamoDB tables...');
            const listCommand = new ListTablesCommand({});
            const listResponse = await this.dynamoClient.send(listCommand);

            const tables: DynamoDBTable[] = [];

            for (const tableName of listResponse.TableNames || []) {
                try {
                    const describeCommand = new DescribeTableCommand({ TableName: tableName });
                    const tableDesc = await this.dynamoClient.send(describeCommand);
                    const table = tableDesc.Table;

                    if (table) {
                        tables.push({
                            name: table.TableName || '',
                            billingMode: table.BillingModeSummary?.BillingMode || 'PROVISIONED',
                            itemCount: table.ItemCount || 0,
                            tableSizeBytes: table.TableSizeBytes || 0,
                            provisionedReadCapacity: table.ProvisionedThroughput?.ReadCapacityUnits,
                            provisionedWriteCapacity: table.ProvisionedThroughput?.WriteCapacityUnits,
                            createdAt: table.CreationDateTime?.toISOString(),
                            lastModified: table.CreationDateTime?.toISOString() // Use creation time as fallback
                        });
                    }
                } catch (err) {
                    console.warn(`⚠️ Could not describe table ${tableName}:`, err);
                }
            }

            console.log(`✅ Found ${tables.length} DynamoDB tables`);
            return tables;
        } catch (error) {
            console.error('❌ DynamoDB scan failed:', error);
            return [];
        }
    }

    async scanS3Buckets(): Promise<S3Bucket[]> {
        try {
            console.log('📡 Scanning S3 buckets...');
            const command = new ListBucketsCommand({});
            const response = await this.s3Client.send(command);

            const buckets: S3Bucket[] = [];

            for (const bucket of response.Buckets || []) {
                if (bucket.Name) {
                    let region = this.region;
                    let lastModified: string | undefined;

                    // 1. Get Region
                    try {
                        const locationCmd = new GetBucketLocationCommand({ Bucket: bucket.Name });
                        const locationResp = await this.s3Client.send(locationCmd);
                        region = locationResp.LocationConstraint || 'us-east-1';
                    } catch (err) {
                        // Region fallback
                    }

                    // 2. Get Last Activity (Check for objects)
                    try {
                        // Create a client for the specific bucket region if needed, 
                        // but usually the global client works if region is configured correctly.
                        // However, for S3, it's safer to just try listing.
                        const listCmd = new ListObjectsV2Command({
                            Bucket: bucket.Name,
                            MaxKeys: 1
                        });
                        const objectsResp = await this.s3Client.send(listCmd);
                        if (objectsResp.Contents && objectsResp.Contents.length > 0) {
                            lastModified = objectsResp.Contents[0].LastModified?.toISOString();
                        }
                    } catch (err) {
                        // Access denied or other error
                        // console.warn(`Could not list objects in ${bucket.Name}`);
                    }

                    buckets.push({
                        name: bucket.Name,
                        creationDate: bucket.CreationDate?.toISOString() || '',
                        region: region,
                        lastModified: lastModified
                    });
                }
            }

            console.log(`✅ Found ${buckets.length} S3 buckets`);
            return buckets;
        } catch (error) {
            console.error('❌ S3 scan failed:', error);
            return [];
        }
    }

    async scanRDSInstances(): Promise<RDSInstance[]> {
        try {
            console.log('📡 Scanning RDS instances...');
            const command = new DescribeDBInstancesCommand({});
            const response = await this.rdsClient.send(command);

            const instances: RDSInstance[] = (response.DBInstances || []).map(db => ({
                identifier: db.DBInstanceIdentifier || '',
                name: db.DBInstanceIdentifier || 'Unnamed DB',
                instanceClass: db.DBInstanceClass || '',
                engine: db.Engine || '',
                status: db.DBInstanceStatus || '',
                allocatedStorage: db.AllocatedStorage || 0,
                multiAZ: db.MultiAZ || false,
                createdAt: db.InstanceCreateTime?.toISOString(),
                lastModified: db.InstanceCreateTime?.toISOString() // Use creation time as fallback
            }));

            console.log(`✅ Found ${instances.length} RDS instances`);
            return instances;
        } catch (error) {
            console.error('❌ RDS scan failed:', error);
            return [];
        }
    }

    async scanAll(): Promise<AWSResources> {
        return this.scanGlobal();
    }

    async scanGlobal(): Promise<AWSResources> {
        console.log('🌍 Starting GLOBAL multi-region AWS scan...');
        const commonRegions = [
            'ap-south-1', // Mumbai (likely main for user)
            'us-east-1',  // N. Virginia
            'us-east-2',  // Ohio
            'us-west-2',  // Oregon
            'eu-central-1', // Frankfurt
            'eu-west-1',   // Ireland
            'ap-southeast-1' // Singapore
        ];

        // Ensure current region is at the start and unique
        const regionsToScan = [...new Set([this.region, ...commonRegions])];

        const allResources: AWSResources = {
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
        allResources.costHistory = await this.getMonthlyCosts();

        // 2. Scan each region
        for (const region of regionsToScan) {
            console.log(`📡 Scanning region: ${region}...`);
            try {
                this.updateRegion(region);

                const [
                    ec2,
                    ips,
                    vols,
                    lambdas,
                    dynamos,
                    rds
                ] = await Promise.all([
                    this.scanEC2Instances(),
                    this.scanElasticIPs(),
                    this.scanEBSVolumes(),
                    this.scanLambdaFunctions(),
                    this.scanDynamoDBTables(),
                    this.scanRDSInstances()
                ]);

                // Append regional findings (S3 is handled separately/globally usually)
                allResources.ec2Instances.push(...ec2.map(i => ({ ...i, region })));
                allResources.elasticIPs.push(...ips.map(i => ({ ...i, region })));
                allResources.ebsVolumes.push(...vols.map(i => ({ ...i, region })));
                allResources.lambdaFunctions.push(...lambdas.map(l => ({ ...l, region })));
                allResources.dynamoDBTables.push(...dynamos.map(d => ({ ...d, region })));
                allResources.rdsInstances.push(...rds.map(r => ({ ...r, region })));

            } catch (error) {
                console.error(`❌ Shielded error in region ${region} scan:`, error);
            }
        }

        // 3. Scan S3 Buckets (Global service, but we'll run it once)
        this.updateRegion(this.region);
        allResources.s3Buckets = await this.scanS3Buckets();

        console.log(`✅ Global Scan Complete! Total Ec2: ${allResources.ec2Instances.length}, Volumes: ${allResources.ebsVolumes.length}`);
        return allResources;
    }
}

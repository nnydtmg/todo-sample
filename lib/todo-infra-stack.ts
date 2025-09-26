import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';

export class TodoInfraStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // VPC
    const vpc = new ec2.Vpc(this, 'TodoAppVpc', {
      maxAzs: 2,
      natGateways: 1,
      subnetConfiguration: [
        {
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        },
        {
          name: 'Isolated',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 24,
        },
      ],
    });

    // セキュリティグループ
    const albSg = new ec2.SecurityGroup(this, 'AlbSecurityGroup', {
      vpc,
      description: 'Security group for ALB',
      allowAllOutbound: true,
    });
    albSg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(8080), 'Allow HTTP from anywhere');

    const fargateServiceSg = new ec2.SecurityGroup(this, 'FargateServiceSecurityGroup', {
      vpc,
      description: 'Security group for Fargate service',
      allowAllOutbound: true,
    });
    fargateServiceSg.addIngressRule(albSg, ec2.Port.tcp(8080), 'Allow traffic from ALB');

    const databaseSg = new ec2.SecurityGroup(this, 'DatabaseSecurityGroup', {
      vpc,
      description: 'Security group for RDS Aurora',
      allowAllOutbound: false,
    });
    databaseSg.addIngressRule(fargateServiceSg, ec2.Port.tcp(3306), 'Allow MySQL from Fargate service');

    // Aurora Serverless MySQL
    const dbClusterParameterGroup = new rds.ParameterGroup(this, 'DBClusterParameterGroup', {
      engine: rds.DatabaseClusterEngine.auroraMysql({
        version: rds.AuroraMysqlEngineVersion.VER_3_03_0,
      }),
      parameters: {
        character_set_client: 'utf8mb4',
        character_set_connection: 'utf8mb4',
        character_set_database: 'utf8mb4',
        character_set_results: 'utf8mb4',
        character_set_server: 'utf8mb4',
        collation_server: 'utf8mb4_unicode_ci',
      },
    });

    const dbSubnetGroup = new rds.SubnetGroup(this, 'DatabaseSubnetGroup', {
      vpc,
      description: 'Subnet group for Aurora Serverless',
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
    });

    const database = new rds.ServerlessCluster(this, 'TodoDatabase', {
      engine: rds.DatabaseClusterEngine.auroraMysql({
        version: rds.AuroraMysqlEngineVersion.VER_3_03_0,
      }),
      vpc,
      securityGroups: [databaseSg],
      scaling: {
        autoPause: cdk.Duration.minutes(10), // 10分アイドル状態が続くと自動停止
        minCapacity: rds.AuroraCapacityUnit.ACU_1, // ACUの最小値
        maxCapacity: rds.AuroraCapacityUnit.ACU_2, // ACUの最大値
      },
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
      subnetGroup: dbSubnetGroup,
      parameterGroup: dbClusterParameterGroup,
      defaultDatabaseName: 'todo_db',
      enableDataApi: true,
      deletionProtection: false, // 開発環境のため保護を無効化
      credentials: rds.Credentials.fromGeneratedSecret('admin', {
        secretName: 'todo-app/db-credentials',
      }),
      removalPolicy: cdk.RemovalPolicy.DESTROY, // 開発環境なのでスタック削除時にDBも削除
    });

    // ECS Cluster
    const cluster = new ecs.Cluster(this, 'TodoAppCluster', {
      vpc,
    });

    // S3 静的ウェブサイトホスティング
    const webBucket = new s3.Bucket(this, 'TodoWebBucket', {
      versioned: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // 開発環境のため
      autoDeleteObjects: true, // 開発環境のため
    });

    // ALB
    const alb = new elbv2.ApplicationLoadBalancer(this, 'TodoAppLoadBalancer', {
      vpc,
      internetFacing: true,
      securityGroup: albSg,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
    });

    const httpListener = alb.addListener('HttpListener', {
      port: 8080,
      protocol: elbv2.ApplicationProtocol.HTTP,
      open: true,
    });

    // ECS Task Definition
    const taskExecutionRole = new iam.Role(this, 'TaskExecutionRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonECSTaskExecutionRolePolicy'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('SecretsManagerReadWrite'),
      ],
    });

    const taskRole = new iam.Role(this, 'TaskRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
    });

    database.secret?.grantRead(taskExecutionRole);

    // ECS Task Definition for Backend
    const backendTaskDefinition = new ecs.FargateTaskDefinition(this, 'BackendTaskDefinition', {
      memoryLimitMiB: 1024,
      cpu: 512,
      taskRole: taskRole,
      executionRole: taskExecutionRole,
    });

    // ログの設定はデフォルトで CloudWatch Logs に出力
    backendTaskDefinition.addContainer('TodoBackendContainer', {
      image: ecs.ContainerImage.fromAsset('../todo-sample/backend'), // Dockerfileからビルド
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: 'todo-backend',
        logRetention: 7, // 7日間のログ保持
      }),
      portMappings: [{ containerPort: 8080 }],
      environment: {
        SPRING_PROFILES_ACTIVE: 'prod',
        CORS_ALLOWED_ORIGINS: 'https://' + alb.loadBalancerDnsName, // CloudFront ドメインに変更
      },
      secrets: {
        DB_URL: ecs.Secret.fromSecretsManager(database.secret!, 'host'),
        DB_USERNAME: ecs.Secret.fromSecretsManager(database.secret!, 'username'),
        DB_PASSWORD: ecs.Secret.fromSecretsManager(database.secret!, 'password'),
      },
    });

    // ECS Fargate Service
    const backendService = new ecs.FargateService(this, 'BackendService', {
      cluster,
      taskDefinition: backendTaskDefinition,
      desiredCount: 1,
      assignPublicIp: false,
      securityGroups: [fargateServiceSg],
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
    });

    // ALBターゲットグループ
    const targetGroup = new elbv2.ApplicationTargetGroup(this, 'BackendTargetGroup', {
      vpc,
      port: 8080,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targetType: elbv2.TargetType.IP,
      healthCheck: {
        path: '/actuator/health',
        interval: cdk.Duration.seconds(60),
        timeout: cdk.Duration.seconds(5),
        healthyHttpCodes: '200',
      },
    });

    httpListener.addTargetGroups('BackendTargetGroup', {
      targetGroups: [targetGroup],
      priority: 10,
      conditions: [
        elbv2.ListenerCondition.pathPatterns(['/api/*']),
      ],
    });

    backendService.attachToApplicationTargetGroup(targetGroup);

    // CloudFront Distribution
    const distribution = new cloudfront.Distribution(this, 'TodoAppDistribution', {
      defaultBehavior: {
        origin: new origins.S3Origin(webBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      },
      additionalBehaviors: {
        '/api/*': {
          origin: new origins.LoadBalancerV2Origin(alb, {
            protocolPolicy: cloudfront.OriginProtocolPolicy.HTTP_ONLY,
          }),
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
          cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
          originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER,
        },
      },
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
      defaultRootObject: 'index.html',
      errorResponses: [
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
        },
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
        },
      ],
    });

    // デフォルトルートをS3に向ける
    httpListener.addAction('DefaultAction', {
      action: elbv2.ListenerAction.fixedResponse(404, {
        contentType: 'text/plain',
        messageBody: 'Not Found',
      }),
    });

    // Outputs
    new cdk.CfnOutput(this, 'CloudFrontDomainName', {
      value: distribution.distributionDomainName,
      description: 'CloudFront Distribution Domain Name',
    });

    new cdk.CfnOutput(this, 'LoadBalancerDnsName', {
      value: alb.loadBalancerDnsName,
      description: 'Application Load Balancer DNS Name',
    });

    new cdk.CfnOutput(this, 'DatabaseSecret', {
      value: database.secret!.secretName,
      description: 'Database Secret Name',
    });
  }
}

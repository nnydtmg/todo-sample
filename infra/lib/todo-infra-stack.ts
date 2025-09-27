import { App, Duration, Stack, StackProps, CfnOutput, RemovalPolicy, Tags } from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as sm from 'aws-cdk-lib/aws-secretsmanager';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';
import { NagSuppressions } from 'cdk-nag';

interface TodoInfraStackProps extends StackProps {
  appName: string;
  config: any;
}

export class TodoInfraStack extends Stack {
  constructor(scope: Construct, id: string, props: TodoInfraStackProps) {
    super(scope, id, props);

    const { appName, config } = props;
    
    // タグを設定
    const tags = config.tags || {};
    Object.entries(tags).forEach(([key, value]) => {
      Tags.of(this).add(key, value as string);
    });

    // VPCの作成
    const vpc = new ec2.Vpc(this, 'TodoVPC', {
      maxAzs: 2,
      natGateways: 1,
      vpcName: `${appName}-vpc`,
      subnetConfiguration: [
        {
          name: 'public',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: 'private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        },
        {
          name: 'isolated',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 24,
        },
      ],
    });

    // セキュリティグループの作成
    const albSg = new ec2.SecurityGroup(this, 'AlbSecurityGroup', {
      vpc,
      description: 'Allow HTTP/HTTPS inbound traffic to ALB',
      allowAllOutbound: true,
    });
    albSg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), 'Allow HTTP from anywhere');
    albSg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(443), 'Allow HTTPS from anywhere');

    const fargateServiceSg = new ec2.SecurityGroup(this, 'FargateServiceSecurityGroup', {
      vpc,
      description: 'Allow inbound traffic from ALB to Fargate service',
      allowAllOutbound: true,
    });
    fargateServiceSg.addIngressRule(albSg, ec2.Port.tcp(config.backend.container_port), 'Allow traffic from ALB');

    const databaseSg = new ec2.SecurityGroup(this, 'DatabaseSecurityGroup', {
      vpc,
      description: 'Allow inbound traffic from Fargate service to Database',
      allowAllOutbound: true,
    });
    databaseSg.addIngressRule(fargateServiceSg, ec2.Port.tcp(config.database.port), 'Allow traffic from Fargate service');

    // データベースシークレットの作成
    const databaseCredentials = new sm.Secret(this, 'DatabaseCredentials', {
      secretName: `${appName}-db-credentials`,
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: 'admin' }),
        excludePunctuation: true,
        includeSpace: false,
        generateStringKey: 'password',
      },
    });

    // Aurora Serverless v2 データベースクラスターの作成
    const dbCluster = new rds.ServerlessCluster(this, 'DatabaseCluster', {
      engine: rds.DatabaseClusterEngine.AURORA_MYSQL,
      defaultDatabaseName: config.database.db_name,
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
      securityGroups: [databaseSg],
      credentials: rds.Credentials.fromSecret(databaseCredentials),
      scaling: {
        minCapacity: config.database.min_capacity,
        maxCapacity: config.database.max_capacity,
      },
      removalPolicy: RemovalPolicy.DESTROY, // 開発環境のため - 本番環境では適切に設定する
      deletionProtection: false, // 開発環境のため - 本番環境では適切に設定する
    });

    // ECSクラスターの作成
    const cluster = new ecs.Cluster(this, 'TodoCluster', {
      vpc,
      clusterName: `${appName}-cluster`,
    });

    // ロググループの作成
    const logGroup = new logs.LogGroup(this, 'ServiceLogGroup', {
      logGroupName: `/ecs/${appName}-service`,
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    // Fargateサービスの実行ロール
    const taskExecutionRole = new iam.Role(this, 'TaskExecutionRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonECSTaskExecutionRolePolicy'),
      ],
    });

    // タスク定義の作成
    const taskDefinition = new ecs.FargateTaskDefinition(this, 'TaskDefinition', {
      family: `${appName}-task`,
      cpu: config.backend.task_cpu,
      memoryLimitMiB: config.backend.task_memory,
      executionRole: taskExecutionRole,
    });

    // タスク定義にコンテナを追加
    const containerName = `${appName}-container`;
    const container = taskDefinition.addContainer(containerName, {
      image: ecs.ContainerImage.fromRegistry('amazon/amazon-ecs-sample'), // プレースホルダ - 実際はECRリポジトリからのイメージを使用
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: appName,
        logGroup,
      }),
      environment: {
        'SPRING_PROFILES_ACTIVE': 'prod',
        'DB_URL': `jdbc:mysql://${dbCluster.clusterEndpoint.hostname}:${dbCluster.clusterEndpoint.port}/${config.database.db_name}`,
      },
      secrets: {
        'DB_USERNAME': ecs.Secret.fromSecretsManager(databaseCredentials, 'username'),
        'DB_PASSWORD': ecs.Secret.fromSecretsManager(databaseCredentials, 'password'),
      },
      healthCheck: {
        command: ["CMD-SHELL", `curl -f http://localhost:${config.backend.container_port}/actuator/health || exit 1`],
        interval: Duration.seconds(30),
        timeout: Duration.seconds(5),
        retries: 3,
        startPeriod: Duration.seconds(60),
      },
    });

    container.addPortMappings({
      containerPort: config.backend.container_port,
      protocol: ecs.Protocol.TCP,
    });

    // ALBの作成
    const alb = new elbv2.ApplicationLoadBalancer(this, 'TodoALB', {
      vpc,
      internetFacing: true,
      securityGroup: albSg,
      loadBalancerName: `${appName}-alb`,
    });

    // ALBのターゲットグループの作成
    const targetGroup = new elbv2.ApplicationTargetGroup(this, 'TargetGroup', {
      vpc,
      targetType: elbv2.TargetType.IP,
      port: config.backend.container_port,
      protocol: elbv2.ApplicationProtocol.HTTP,
      healthCheck: {
        path: '/actuator/health',
        interval: Duration.seconds(30),
        timeout: Duration.seconds(5),
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 5,
      },
    });

    // ALBのリスナーの作成
    const listener = alb.addListener('HttpListener', {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultTargetGroups: [targetGroup],
    });

    // Fargateサービスの作成
    const service = new ecs.FargateService(this, 'FargateService', {
      cluster,
      serviceName: config.backend.service_name,
      taskDefinition,
      desiredCount: 2,
      assignPublicIp: false,
      securityGroups: [fargateServiceSg],
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
    });

    // サービスをALBのターゲットとして登録
    service.attachToApplicationTargetGroup(targetGroup);

    // サービスのオートスケーリングを設定
    const scalableTarget = service.autoScaleTaskCount({
      minCapacity: config.backend.scaling_min_capacity,
      maxCapacity: config.backend.scaling_max_capacity,
    });

    // CPU使用率ベースのスケーリング
    scalableTarget.scaleOnCpuUtilization('CpuScaling', {
      targetUtilizationPercent: 70,
      scaleInCooldown: Duration.seconds(60),
      scaleOutCooldown: Duration.seconds(60),
    });

    // フロントエンド用のS3バケットを作成
    const webBucket = new s3.Bucket(this, 'WebBucket', {
      // bucketNameを指定せずにCDKに自動生成させる
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: RemovalPolicy.DESTROY, // 開発環境のため - 本番環境では適切に設定する
      autoDeleteObjects: true, // 開発環境のため - 本番環境では適切に設定する
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'index.html',
    });

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
      enableIpv6: true,
      httpVersion: cloudfront.HttpVersion.HTTP2,
      defaultRootObject: 'index.html',
      errorResponses: [
        {
          httpStatus: 404,
          responsePagePath: '/index.html',
          responseHttpStatus: 200,
        },
        {
          httpStatus: 403,
          responsePagePath: '/index.html',
          responseHttpStatus: 200,
        },
      ],
    });

    // サービスにCloudfrontドメインを環境変数として追加
    container.addEnvironment('CORS_ALLOWED_ORIGINS', `https://${distribution.distributionDomainName}`);

    // CDK Nag suppressions
    NagSuppressions.addStackSuppressions(this, [
      {
        id: 'AwsSolutions-IAM4',
        reason: 'このデモ用プロジェクトではマネージドポリシーを使用',
      },
      {
        id: 'AwsSolutions-EC23',
        reason: '開発環境ではHTTPを許可',
      },
      {
        id: 'AwsSolutions-ELB2',
        reason: '開発環境ではALBのアクセスログを無効化',
      },
      {
        id: 'AwsSolutions-S1',
        reason: '開発環境ではS3バケットのサーバーアクセスログを無効化',
      },
      {
        id: 'AwsSolutions-S5',
        reason: '開発環境ではOAIを使用しない',
      },
      {
        id: 'AwsSolutions-S10',
        reason: '開発環境ではSSL強制を無効化',
      },
      {
        id: 'AwsSolutions-RDS10',
        reason: '開発環境ではAuroraのマルチAZを無効化',
      },
      {
        id: 'AwsSolutions-RDS6',
        reason: '開発環境ではRDSのIAM認証を無効化',
      },
      {
        id: 'AwsSolutions-RDS11',
        reason: '開発環境ではデフォルトポートを使用',
      },
      {
        id: 'AwsSolutions-RDS14',
        reason: '開発環境ではBacktrackを無効化',
      },
      {
        id: 'AwsSolutions-RDS16',
        reason: '開発環境ではログエクスポートを無効化',
      },
      {
        id: 'AwsSolutions-VPC7',
        reason: '開発環境ではVPCフローログを無効化',
      },
      {
        id: 'AwsSolutions-SMG4',
        reason: '開発環境では自動ローテーションを無効化',
      },
      {
        id: 'AwsSolutions-ECS4',
        reason: '開発環境ではContainer Insightsを無効化',
      },
      {
        id: 'AwsSolutions-ECS2',
        reason: '開発環境では環境変数を直接指定',
      },
      {
        id: 'AwsSolutions-CFR1',
        reason: '開発環境ではGeo制限を無効化',
      },
      {
        id: 'AwsSolutions-CFR2',
        reason: '開発環境ではWAFを無効化',
      },
      {
        id: 'AwsSolutions-CFR3',
        reason: '開発環境ではCloudFrontアクセスログを無効化',
      },
      {
        id: 'AwsSolutions-CFR4',
        reason: '開発環境では最小TLSバージョンを設定しない',
      },
      {
        id: 'AwsSolutions-CFR5',
        reason: '開発環境ではオリジン通信でTLS設定を緩和',
      },
    ]);

    // Outputs
    new CfnOutput(this, 'DatabaseEndpoint', {
      description: 'The endpoint of the database',
      value: dbCluster.clusterEndpoint.hostname,
    });

    new CfnOutput(this, 'LoadBalancerDNS', {
      description: 'The DNS name of the load balancer',
      value: alb.loadBalancerDnsName,
    });

    new CfnOutput(this, 'CloudFrontDomainName', {
      description: 'The domain name of the CloudFront distribution',
      value: distribution.distributionDomainName,
    });

    new CfnOutput(this, 'WebBucketName', {
      description: 'The name of the S3 bucket hosting the frontend',
      value: webBucket.bucketName,
    });
  }
}
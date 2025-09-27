import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import * as TodoInfra from '../lib/todo-infra-stack';

describe('TodoInfraStack', () => {
  let app: cdk.App;
  let stack: cdk.Stack;
  let template: Template;

  beforeAll(() => {
    app = new cdk.App();
    stack = new TodoInfra.TodoInfraStack(app, 'TestTodoInfraStack', {
      env: { account: '123456789012', region: 'ap-northeast-1' },
    });
    template = Template.fromStack(stack);
  });

  // スナップショットテスト
  test('スナップショットと一致する', () => {
    expect(app.synth().getStackArtifact(stack.artifactId).template).toMatchSnapshot();
  });

  // リソーステスト
  test('VPCが作成される', () => {
    template.resourceCountIs('AWS::EC2::VPC', 1);
    template.resourceCountIs('AWS::EC2::Subnet', 6); // パブリック2、プライベート2、アイソレート2
  });

  test('セキュリティグループが作成される', () => {
    template.resourceCountIs('AWS::EC2::SecurityGroup', 3);
  });

  test('Aurora Serverless DBが作成される', () => {
    template.resourceCountIs('AWS::RDS::DBCluster', 1);
    
    template.hasResourceProperties('AWS::RDS::DBCluster', {
      Engine: 'aurora-mysql',
      EngineMode: 'serverless',
    });
  });

  test('ECS Fargateサービスが作成される', () => {
    template.resourceCountIs('AWS::ECS::Cluster', 1);
    template.resourceCountIs('AWS::ECS::TaskDefinition', 1);
    template.resourceCountIs('AWS::ECS::Service', 1);
    
    template.hasResourceProperties('AWS::ECS::TaskDefinition', {
      RequiresCompatibilities: ['FARGATE'],
      NetworkMode: 'awsvpc',
      Cpu: '512',
      Memory: '1024',
    });
  });

  test('ALBが作成される', () => {
    template.resourceCountIs('AWS::ElasticLoadBalancingV2::LoadBalancer', 1);
    template.resourceCountIs('AWS::ElasticLoadBalancingV2::Listener', 1);
    template.resourceCountIs('AWS::ElasticLoadBalancingV2::TargetGroup', 1);
    
    template.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
      Port: 8080,
      Protocol: 'HTTP',
    });
  });

  test('S3バケットが作成される', () => {
    template.resourceCountIs('AWS::S3::Bucket', 1);
    
    template.hasResourceProperties('AWS::S3::Bucket', {
      BucketEncryption: {
        ServerSideEncryptionConfiguration: [
          {
            ServerSideEncryptionByDefault: {
              SSEAlgorithm: 'AES256',
            },
          },
        ],
      },
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
        IgnorePublicAcls: true,
        RestrictPublicBuckets: true,
      },
    });
  });

  test('CloudFrontディストリビューションが作成される', () => {
    template.resourceCountIs('AWS::CloudFront::Distribution', 1);
    
    template.hasResourceProperties('AWS::CloudFront::Distribution', {
      DistributionConfig: {
        DefaultRootObject: 'index.html',
        Enabled: true,
      },
    });
  });
});

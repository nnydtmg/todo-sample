import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TodoInfraStack } from '../lib/todo-infra-stack';

describe('TodoInfraStack', () => {
  let app: cdk.App;
  let stack: TodoInfraStack;
  let template: Template;

  beforeAll(() => {
    app = new cdk.App({
      context: {
        app_name: 'todo-test',
        config: {
          backend: {
            service_name: 'todo-backend-test',
            container_port: 8080,
            task_cpu: 512,
            task_memory: 1024,
            scaling_min_capacity: 1,
            scaling_max_capacity: 10
          },
          frontend: {
            service_name: 'todo-frontend-test'
          },
          database: {
            db_name: 'todo_db_test',
            port: 3306,
            min_capacity: 0.5,
            max_capacity: 2
          },
          tags: {
            environment: 'test',
            project: 'todo-app-test'
          }
        }
      }
    });
    stack = new TodoInfraStack(app, 'TestStack', {
      appName: 'todo-test',
      env: { account: '123456789012', region: 'ap-northeast-1' },
      config: app.node.tryGetContext('config')
    });
    template = Template.fromStack(stack);
  });

  test('スナップショットと一致する', () => {
    expect(app.synth().getStackArtifact(stack.artifactId).template).toMatchSnapshot();
  });

  test('VPCが作成される', () => {
    template.resourceCountIs('AWS::EC2::VPC', 1);
    template.resourceCountIs('AWS::EC2::Subnet', 6); // パブリック2、プライベート2、アイソレート2
  });

  test('セキュリティグループが作成される', () => {
    template.resourceCountIs('AWS::EC2::SecurityGroup', 3); // ALB、Fargate、RDS用
  });

  test('Aurora Serverlessが作成される', () => {
    template.resourceCountIs('AWS::RDS::DBCluster', 1);
    
    template.hasResourceProperties('AWS::RDS::DBCluster', {
      Engine: 'aurora-mysql',
      DatabaseName: 'todo_db_test',
      ServerlessV2ScalingConfiguration: {
        MinCapacity: 0.5,
        MaxCapacity: 2
      },
    });
  });

  test('ECSクラスターとFargateサービスが作成される', () => {
    template.resourceCountIs('AWS::ECS::Cluster', 1);
    template.resourceCountIs('AWS::ECS::Service', 1);
    template.resourceCountIs('AWS::ECS::TaskDefinition', 1);
    
    template.hasResourceProperties('AWS::ECS::TaskDefinition', {
      ContainerDefinitions: Match.arrayWith([
        Match.objectLike({
          Environment: Match.arrayWith([
            {
              Name: 'SPRING_PROFILES_ACTIVE',
              Value: 'prod'
            }
          ]),
          LogConfiguration: Match.objectLike({
            LogDriver: 'awslogs',
          }),
          HealthCheck: Match.objectLike({
            Command: Match.arrayWith([
              Match.stringLikeRegexp('.*curl.*'),
            ]),
          }),
          PortMappings: Match.arrayWith([
            {
              ContainerPort: 8080,
              Protocol: 'tcp'
            }
          ]),
        })
      ]),
      Cpu: '512',
      Memory: '1024',
    });
  });

  test('ALBが作成される', () => {
    template.resourceCountIs('AWS::ElasticLoadBalancingV2::LoadBalancer', 1);
    template.resourceCountIs('AWS::ElasticLoadBalancingV2::TargetGroup', 1);
    template.resourceCountIs('AWS::ElasticLoadBalancingV2::Listener', 1);
    
    template.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
      Scheme: 'internet-facing',
    });
  });

  test('S3バケットが作成される', () => {
    template.resourceCountIs('AWS::S3::Bucket', 1);
    
    template.hasResourceProperties('AWS::S3::Bucket', {
      WebsiteConfiguration: {
        IndexDocument: 'index.html',
        ErrorDocument: 'index.html',
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
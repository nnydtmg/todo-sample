import { App, Aspects } from 'aws-cdk-lib';
import { Annotations, Match, Template } from 'aws-cdk-lib/assertions';
import { AwsSolutionsChecks, NagSuppressions } from 'cdk-nag';
import { TodoInfraStack } from '../lib/todo-infra-stack';

describe('CDK Nag', () => {
  let app: App;
  let stack: TodoInfraStack;

  beforeAll(() => {
    app = new App({
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
    stack = new TodoInfraStack(app, 'TestNagStack', {
      appName: 'todo-test',
      env: { account: '123456789012', region: 'ap-northeast-1' },
      config: app.node.tryGetContext('config')
    });
    
    // CDK Nagの適用 (テスト用)
    Aspects.of(app).add(new AwsSolutionsChecks({ verbose: true }));
  });

  test('Nag警告が存在することを確認', () => {
    // 警告を検証（必ず見つかるもの）
    const annotations = Annotations.fromStack(stack);
    const warnings = annotations.findWarning('*', Match.anyValue());
    expect(warnings.length).toBeGreaterThan(0);
  });

  test('特定の警告が適切に抑制されていることを確認', () => {
    const annotations = Annotations.fromStack(stack);
    
    // IAM4警告が抑制されているか確認（マネージドポリシー使用に関する警告）
    const iam4Findings = annotations.findWarning('*', Match.stringLikeRegexp('AwsSolutions-IAM4'));
    expect(iam4Findings.length).toBe(0);
    
    // EC23警告が抑制されているか確認（HTTP使用に関する警告）
    const ec23Findings = annotations.findWarning('*', Match.stringLikeRegexp('AwsSolutions-EC23'));
    expect(ec23Findings.length).toBe(0);
  });
});
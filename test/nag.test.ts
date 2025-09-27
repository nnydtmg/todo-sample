import { App, Aspects } from 'aws-cdk-lib';
import { Annotations, Match, Template } from 'aws-cdk-lib/assertions';
import { AwsSolutionsChecks, NagSuppressions } from 'cdk-nag';
import { TodoInfraStack } from '../lib/todo-infra-stack';

describe('CDK Nag', () => {
  let app: App;
  let stack: TodoInfraStack;

  beforeAll(() => {
    app = new App();
    stack = new TodoInfraStack(app, 'TestTodoInfraStack', {
      env: { account: '123456789012', region: 'ap-northeast-1' },
    });
    
    // CDK Nagの適用 (テスト用)
    Aspects.of(app).add(new AwsSolutionsChecks({ verbose: true }));
    
    // 特定の警告を許容する (テスト例)
    NagSuppressions.addResourceSuppressions(
      stack,
      [
        {
          id: 'AwsSolutions-IAM4',
          reason: 'ECSタスクロールに必要な権限を与えるため、AWSマネージドポリシーを使用',
        },
        {
          id: 'AwsSolutions-IAM5',
          reason: 'ECSタスクロールにワイルドカードアクセス許可が必要',
        },
      ],
      true
    );
  });

  test('Nag警告が存在することを確認', () => {
    // 警告を検証（必ず見つかるもの）
    const annotations = Annotations.fromStack(stack);
    const warnings = annotations.findWarning('*', Match.anyValue());
    expect(warnings.length).toBeGreaterThan(0);
  });
});
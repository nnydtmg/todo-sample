import { CfnResource, IAspect } from 'aws-cdk-lib';
import { CfnBucket } from 'aws-cdk-lib/aws-s3';
import { CfnLoadBalancer } from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { CfnDBCluster } from 'aws-cdk-lib/aws-rds';
import { NagSuppressions } from 'cdk-nag';
import { Construct, IConstruct } from 'constructs';

export class NagSuppressionsAspect implements IAspect {
  public visit(node: IConstruct): void {
    if (node instanceof CfnBucket) {
      // S3バケット関連の警告を抑制
      NagSuppressions.addResourceSuppressions(node, [
        {
          id: 'AwsSolutions-S1',
          reason: '開発環境ではサーバーアクセスログを無効化する',
        },
        {
          id: 'AwsSolutions-S5',
          reason: '開発環境ではOAIを使用しない',
        },
        {
          id: 'AwsSolutions-S10',
          reason: '開発環境ではSSL強制を無効化する',
        },
      ]);
    }

    // S3バケットポリシー関連の警告を抑制
    if (node.node.path.includes('WebBucket/Policy')) {
      NagSuppressions.addResourceSuppressions(node, [
        {
          id: 'AwsSolutions-S10',
          reason: '開発環境ではSSL強制を無効化する',
        },
      ], true);
    } else if (node instanceof CfnLoadBalancer) {
      // ALB関連の警告を抑制
      NagSuppressions.addResourceSuppressions(node, [
        {
          id: 'AwsSolutions-ELB2',
          reason: '開発環境ではALBのアクセスログを無効化する',
        },
        {
          id: 'AwsSolutions-EC23',
          reason: '開発環境ではHTTPを許可する',
        },
      ]);
    } else if (node instanceof CfnDBCluster) {
      // Aurora関連の警告を抑制
      NagSuppressions.addResourceSuppressions(node, [
        {
          id: 'AwsSolutions-RDS6',
          reason: '開発環境ではIAM認証を無効化する',
        },
        {
          id: 'AwsSolutions-RDS10',
          reason: '開発環境ではマルチAZを無効化する',
        },
      ]);
    }

    // CloudFrontディストリビューション関連の警告を抑制
    if (node.node.path.includes('CloudFront') || node.node.path.includes('Distribution')) {
      NagSuppressions.addResourceSuppressions(node, [
        {
          id: 'AwsSolutions-CFR1',
          reason: '開発環境ではGeo制限を無効化する',
        },
        {
          id: 'AwsSolutions-CFR2',
          reason: '開発環境ではWAFを無効化する',
        },
        {
          id: 'AwsSolutions-CFR3',
          reason: '開発環境ではCloudFrontのアクセスログを無効化する',
        },
        {
          id: 'AwsSolutions-CFR4',
          reason: '開発環境では最小TLSバージョンを設定しない',
        },
        {
          id: 'AwsSolutions-CFR5',
          reason: '開発環境ではオリジンとの通信でTLS設定を緩和する',
        },
      ], true);
    }

    // VPC関連の警告を抑制
    if (node.node.path.includes('VPC')) {
      NagSuppressions.addResourceSuppressions(node, [
        {
          id: 'AwsSolutions-VPC7',
          reason: '開発環境ではVPCフローログを無効化する',
        },
      ], true);
    }

    // ECS関連の警告を抑制
    if (node.node.path.includes('Cluster') || node.node.path.includes('TaskDefinition')) {
      NagSuppressions.addResourceSuppressions(node, [
        {
          id: 'AwsSolutions-ECS4',
          reason: '開発環境ではContainer Insightsを無効化する',
        },
        {
          id: 'AwsSolutions-ECS2',
          reason: '開発環境では環境変数を直接指定する',
        },
      ], true);
    }

    // Secrets Manager関連の警告を抑制
    if (node.node.path.includes('DatabaseCredentials')) {
      NagSuppressions.addResourceSuppressions(node, [
        {
          id: 'AwsSolutions-SMG4',
          reason: '開発環境では自動ローテーションを無効化する',
        },
      ], true);
    }

    // RDS関連の追加警告を抑制
    if (node instanceof CfnDBCluster) {
      NagSuppressions.addResourceSuppressions(node, [
        {
          id: 'AwsSolutions-RDS11',
          reason: '開発環境ではデフォルトポートを使用する',
        },
        {
          id: 'AwsSolutions-RDS14',
          reason: '開発環境ではBacktrackを無効化する',
        },
        {
          id: 'AwsSolutions-RDS16',
          reason: '開発環境ではログエクスポートを無効化する',
          appliesTo: ['LogExport::audit', 'LogExport::error', 'LogExport::general', 'LogExport::slowquery'],
        },
      ]);
    }
  }
}
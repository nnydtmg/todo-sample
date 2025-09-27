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
      ]);
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
    if (node.node.path.includes('CloudFront')) {
      NagSuppressions.addResourceSuppressions(node, [
        {
          id: 'AwsSolutions-CFR4',
          reason: '開発環境ではCloudFrontのアクセスログを無効化する',
        },
      ], true);
    }
  }
}
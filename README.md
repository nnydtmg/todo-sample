# Todo アプリケーションのインフラストラクチャ

AWS CDKを使用して、Todoアプリケーションのインフラストラクチャをデプロイするためのプロジェクトです。

## アーキテクチャ

このインフラストラクチャには以下のコンポーネントが含まれています：

* **CloudFront** - グローバルなコンテンツ配信と HTTPS 対応
* **S3** - フロントエンド (React) の静的ホスティング
* **ALB** - バックエンドサービスへのロードバランシング
* **ECS on Fargate** - バックエンド (Spring Boot) のコンテナ実行環境
* **Aurora Serverless v2 MySQL** - スケーラブルなデータベース（最小容量0）

## 前提条件

* AWS CLI がインストールされ、設定済みであること
* Node.js 16.x 以上
* AWS CDK v2 がインストールされていること
* Docker がインストールされていること（ローカルでのイメージビルド用）

## デプロイ方法

### 1. CDK ブートストラップ（初回のみ）

```bash
cd todo-infra
cdk bootstrap
```

### 2. コードのデプロイ

```bash
# スタックの合成（CloudFormation テンプレートの生成）
cdk synth

# スタックのデプロイ
cdk deploy
```

### 3. フロントエンドのビルドとデプロイ

```bash
# フロントエンドのビルド
cd ../todo-sample/frontend
npm run build

# S3バケットへのデプロイ（CDKデプロイ後に表示されるバケット名を使用）
aws s3 sync build/ s3://YOUR-S3-BUCKET-NAME/
```

## 環境変数の設定

バックエンドコンテナには以下の環境変数が自動的に設定されます：

* `SPRING_PROFILES_ACTIVE`: `prod`
* `CORS_ALLOWED_ORIGINS`: CloudFront のドメイン名
* `DB_URL`: Aurora Serverless エンドポイント
* `DB_USERNAME`: データベースユーザー名（SecretsManagerから取得）
* `DB_PASSWORD`: データベースパスワード（SecretsManagerから取得）

## クリーンアップ

```bash
cdk destroy
```

## セキュリティに関する注意事項

* このインフラストラクチャは開発/テスト環境向けに設計されています
* 本番環境で使用する場合は、以下を検討してください：
  * 適切なWAF設定
  * より厳格なセキュリティグループルール
  * リソース削除保護の有効化
  * シークレットローテーションの設定
  * CloudTrail や Config による監査

## Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `npx cdk deploy`  deploy this stack to your default AWS account/region
* `npx cdk diff`    compare deployed stack with current state
* `npx cdk synth`   emits the synthesized CloudFormation template

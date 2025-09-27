# Todo アプリケーション（Spring Boot + React + MySQL）

このプロジェクトはTodoアプリケーションです。Spring Boot（バックエンド）、React（フロントエンド）、MySQL（データベース）を使用しています。インフラストラクチャはAWS CDKで定義されています。

## 機能

- タスクの追加
- タスクの表示（一覧・詳細）
- タスクの編集
- タスクの完了マーク/未完了マーク
- タスクの削除
- タスクのフィルタリング（全て/未完了/完了済み）

## 技術スタック

### バックエンド
- Java 17
- Spring Boot 3.x
- Spring Data JPA
- Flyway（マイグレーション管理）
- MySQL
- JUnit 5（テスト）

### フロントエンド
- React
- TypeScript
- Axios
- React Bootstrap
- カスタムフック

### インフラストラクチャ
- AWS CDK v2
- CloudFront - グローバルなコンテンツ配信と HTTPS 対応
- S3 - フロントエンド (React) の静的ホスティング
- ALB - バックエンドサービスへのロードバランシング
- ECS on Fargate - バックエンド (Spring Boot) のコンテナ実行環境
- Aurora Serverless v2 MySQL - スケーラブルなデータベース
- AWS Secrets Manager - データベース認証情報の安全な管理

## プロジェクト構成

```
todo-app/
│
├── backend/                     # Spring Bootプロジェクト
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/
│   │   │   │   └── com/example/todo/
│   │   │   │       ├── config/      # 設定クラス
│   │   │   │       ├── controller/  # RESTコントローラー
│   │   │   │       ├── dto/         # データ転送オブジェクト
│   │   │   │       ├── model/       # エンティティ
│   │   │   │       ├── repository/  # リポジトリ
│   │   │   │       └── service/     # サービス
│   │   │   └── resources/
│   │   │       ├── application.properties       # 共通設定
│   │   │       ├── application-local.properties # ローカル環境設定
│   │   │       ├── application-prod.properties  # 本番環境設定
│   │   │       └── db/migration/    # Flywayマイグレーションスクリプト
│   │   └── test/                    # テストコード
│   └── pom.xml                      # Mavenプロジェクト設定
│
├── frontend/                   # Reactプロジェクト
│   ├── public/
│   └── src/
│       ├── components/         # Reactコンポーネント
│       ├── services/           # APIサービス
│       ├── hooks/              # カスタムフック
│       ├── types/              # TypeScript型定義
│       └── utils/              # ユーティリティ関数
│
├── infra/                     # AWS CDK プロジェクト
│   ├── bin/                   # CDKアプリケーションのエントリーポイント
│   ├── env/                   # 環境別設定
│   ├── lib/                   # CDKスタックとコンストラクト
│   ├── test/                  # CDKテスト
│   └── cdk.json               # CDK設定ファイル
│
├── .devcontainer/            # Dev Container設定
├── docker-compose.yml        # ローカル開発用Docker Compose設定
└── ADR/                      # アーキテクチャ決定記録
```

## 開発環境での開始方法

### 前提条件
- Java 17以上
- Node.js とnpm
- MySQL
- Docker および Docker Compose（Dockerで実行する場合）
- AWS CLI（インフラをデプロイする場合）
- AWS CDK v2（インフラをデプロイする場合）
- Visual Studio Code（Dev Container機能を使用する場合）

### 1. ローカルでの起動（Docker不使用）

#### バックエンドの起動
1. MySQLでデータベースを作成（名前: todo_db）
```sql
CREATE DATABASE todo_db;
```

2. `application-local.properties`でデータベース接続設定を確認・変更

3. バックエンドプロジェクトを実行（localプロファイルを使用）
```bash
cd backend
./mvnw spring-boot:run -Dspring.profiles.active=local
```

#### フロントエンドの起動
1. パッケージをインストール
```bash
cd frontend
npm install
```

2. 開発サーバーを起動
```bash
npm start
```

3. ブラウザで http://localhost:3000 にアクセス

### 2. Dockerでの起動

1. Docker Composeを使用してアプリケーションを起動
```bash
docker-compose up -d
```

2. ブラウザで http://localhost:3000 にアクセス

3. アプリケーションの停止
```bash
docker-compose down
```

データベースを完全に初期化する場合:
```bash
docker-compose down -v
```

## 開発環境

Visual Studio CodeのDevContainerを使用して開発環境を統一できます。
`.devcontainer`ディレクトリに必要な設定が含まれています。
## API エンドポイント

| メソッド | URL                      | 説明                          |
|---------|--------------------------|------------------------------|
| GET     | /api/todos               | すべてのTodoを取得              |
| GET     | /api/todos?completed=true| 完了済みTodoを取得             |
| GET     | /api/todos/{id}          | 指定IDのTodoを取得             |
| POST    | /api/todos               | 新しいTodoを作成               |
| PUT     | /api/todos/{id}          | 指定IDのTodoを更新             |
| PATCH   | /api/todos/{id}/toggle   | 指定IDのTodoの完了状態を切り替え |
| DELETE  | /api/todos/{id}          | 指定IDのTodoを削除             |

## AWS環境へのデプロイ

本番環境（AWS）にデプロイする場合は、以下の環境変数を設定する必要があります：

```
DB_URL=jdbc:mysql://[RDSのエンドポイント]:3306/todo_db?useSSL=true
DB_USERNAME=[データベースのユーザー名]
DB_PASSWORD=[データベースのパスワード]
CORS_ALLOWED_ORIGINS=https://[本番環境のドメイン]
```

そして、prodプロファイルを使用してアプリケーションを起動します：

```bash
java -jar app.jar --spring.profiles.active=prod
```

## AWSへのデプロイ（CDK使用）

### 1. CDK ブートストラップ（初回のみ）

```bash
cd infra
cdk bootstrap
```

### 2. インフラのデプロイ

```bash
# 依存パッケージのインストール
npm install

# スタックの合成（CloudFormation テンプレートの生成）
cdk synth

# スタックのデプロイ
cdk deploy
```

### 3. フロントエンドのビルドとデプロイ

```bash
# フロントエンドのビルド
cd ../frontend
npm install
npm run build

# S3バケットへのデプロイ（CDKデプロイ後に表示されるバケット名を使用）
aws s3 sync build/ s3://YOUR-S3-BUCKET-NAME/
```

### 4. 環境別のデプロイ

本番環境（prd）へのデプロイ:

```bash
cd infra
cdk deploy --context env=prd
```

## CDK環境変数の設定

バックエンドコンテナには以下の環境変数が自動的に設定されます：

* `SPRING_PROFILES_ACTIVE`: `prod`
* `CORS_ALLOWED_ORIGINS`: CloudFront のドメイン名
* `DB_URL`: Aurora Serverless エンドポイント
* `DB_USERNAME`: データベースユーザー名（SecretsManagerから取得）
* `DB_PASSWORD`: データベースパスワード（SecretsManagerから取得）

## セキュリティに関する注意事項

* このインフラストラクチャは開発/テスト環境向けに設計されています
* 本番環境で使用する場合は、以下を検討してください：
  * 適切なWAF設定
  * より厳格なセキュリティグループルール
  * リソース削除保護の有効化
  * シークレットローテーションの設定
  * CloudTrail や Config による監査

## アーキテクチャ決定記録 (ADR)

このプロジェクトでは、重要な設計判断を記録するためにADRを使用しています。`ADR`ディレクトリには以下のような記録が含まれています：

- アーキテクチャの概要
- データベーススキーマ管理
- フロントエンドの状態管理
- API設計
- テスト戦略
- UIコンポーネント設計
- 開発環境
- 環境別設定
- Dockerマルチステージビルド
- ログ設定

詳細については各ADRファイルを参照してください。

# TodoアプリケーションSpring Boot + React + MySQL)

このプロジェクトはTodoアプリケーションです。Spring Boot（バックエンド）、React（フロントエンド）、MySQL（データベース）を使用しています。

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

## プロジェクト構成

```
todo-app/
│
├── backend/                     # Spring Bootプロジェクト
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/
│   │   │   │   └── com/example/todo/
│   │   │   │       ├── controller/  # RESTコントローラー
│   │   │   │       ├── dto/         # データ転送オブジェクト
│   │   │   │       ├── model/       # エンティティ
│   │   │   │       ├── repository/  # リポジトリ
│   │   │   │       └── service/     # サービス
│   │   │   └── resources/
│   │   │       ├── application.properties  # アプリケーション設定
│   │   │       └── db/migration/    # Flywayマイグレーションスクリプト
│   │   └── test/                    # テストコード
│   └── pom.xml                      # Mavenプロジェクト設定
│
└── frontend/                   # Reactプロジェクト
    ├── public/
    └── src/
        ├── components/         # Reactコンポーネント
        ├── services/          # APIサービス
        ├── hooks/             # カスタムフック
        ├── types/             # TypeScript型定義
        └── utils/             # ユーティリティ関数
```

## 開始方法

### 前提条件
- Java 17以上
- Node.js とnpm
- MySQL

### バックエンドの起動
1. MySQLでデータベースを作成（名前: todo_db）
```sql
CREATE DATABASE todo_db;
```

2. `application.properties`でデータベース接続設定を確認・変更

3. バックエンドプロジェクトを実行
```bash
cd backend
./mvnw spring-boot:run
```

### フロントエンドの起動
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
# Architecture Decision Records (ADR)

このディレクトリには、プロジェクトの主要なアーキテクチャ判断（Architecture Decision Records: ADR）が保存されています。

## ADRとは

ADRは、ソフトウェア設計における重要な決定とその理由を文書化したものです。各ADRには以下の要素が含まれます：

- **コンテキスト**: 決定が必要になった背景
- **決定事項**: 選択した選択肢
- **根拠**: なぜその選択をしたか
- **影響**: その決定がもたらす結果
- **備考**: 追加情報や将来の検討事項

## ADR一覧

1. [全体アーキテクチャの決定](./0001-architecture-overview.md)
2. [データベーススキーマ管理にFlywayを使用](./0002-database-schema-management.md)
3. [フロントエンドの状態管理にカスタムフックを使用](./0003-frontend-state-management.md)
4. [RESTful APIの設計](./0004-api-design.md)
5. [テスト戦略](./0005-testing-strategy.md)
6. [UIコンポーネント設計](./0006-ui-component-design.md)
7. [開発環境のDevcontainer導入](./0007-development-environment.md)
8. [環境固有の設定管理](./0008-environment-specific-config.md)
9. [バックエンドのマルチステージDockerビルド](./0009-docker-multi-stage-build.md)
10. [Logbackを使用したログ設定](./0010-logback-configuration.md)

## 参考

ADRの書き方については、[adr.github.io](https://adr.github.io/) を参照してください。

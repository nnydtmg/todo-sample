# マルチステージビルド - ビルドステージ
FROM maven:3.8.6-eclipse-temurin-17-alpine AS builder

# 作業ディレクトリの設定
WORKDIR /app

# pom.xmlのコピー（依存関係のキャッシュのため）
COPY pom.xml .

# 依存関係の解決（キャッシュを活用するため、ソースコードをコピーする前に実行）
RUN mvn dependency:go-offline

# ソースコードのコピー
COPY src ./src

# アプリケーションのビルド（テストをスキップ）
RUN mvn clean package -DskipTests

# 実行ステージ
FROM eclipse-temurin:17-jre-alpine

# 作業ディレクトリの設定
WORKDIR /app

# タイムゾーンをJSTに設定
RUN apk add --no-cache tzdata && \
    cp /usr/share/zoneinfo/Asia/Tokyo /etc/localtime && \
    echo "Asia/Tokyo" > /etc/timezone && \
    apk del tzdata

# ログ出力用のディレクトリ作成と権限設定
RUN mkdir -p /app/logs && chmod 777 /app/logs

# セキュリティのため、非rootユーザーを作成
RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring

# ビルドステージからjarファイルをコピー
COPY --from=builder /app/target/*.jar app.jar

# ヘルスチェック用のメタデータ
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:8080/actuator/health || exit 1

# コンテナ起動時のプロファイル設定用の環境変数
ENV SPRING_PROFILES_ACTIVE=prod

# ポートの公開
EXPOSE 8080

# アプリケーション起動コマンド
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
# ビルドステージ
FROM node:18-alpine AS builder

# 作業ディレクトリを設定
WORKDIR /app

# パッケージ情報をコピー
COPY package*.json ./

# 依存関係のインストール
RUN npm ci

# ソースコードをコピー
COPY . .

# 環境変数の設定（本番ビルド用）
ENV NODE_ENV=production

# アプリケーションのビルド
RUN npm run build

# 実行ステージ
FROM nginx:stable-alpine

# Nginxの設定ファイルをコピー
COPY nginx.conf /etc/nginx/conf.d/default.conf

# ビルドステージからビルド成果物をコピー
COPY --from=builder /app/build /usr/share/nginx/html

# ポートの公開
EXPOSE 80

# Nginxを起動
CMD ["nginx", "-g", "daemon off;"]
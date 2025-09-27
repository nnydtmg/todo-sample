#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { TodoInfraStack } from "../lib/todo-infra-stack";
import { AwsSolutionsChecks } from "cdk-nag";
import { Aspects } from "aws-cdk-lib";
import { NagSuppressionsAspect } from "../lib/nag-suppressions";
import { config as prdProperties } from "../env/prd";
import { config as devProperties } from "../env/dev";

const app = new cdk.App();

// CDK Nagを適用
Aspects.of(app).add(new AwsSolutionsChecks({ verbose: true }));

// 抑制設定も適用
Aspects.of(app).add(new NagSuppressionsAspect());

// 設定を取得
const appName = app.node.tryGetContext("app_name") || "todo-app";
const env = app.node.tryGetContext("env") || {};
const properties = getProperties(env.envKey || "prd");

// スタックの作成
new TodoInfraStack(app, `${appName}-stack`, {
  env: {
    account: env.account || process.env.CDK_DEFAULT_ACCOUNT,
    region: env.region || process.env.CDK_DEFAULT_REGION || "ap-northeast-1",
  },
  description: "Todo アプリケーションのインフラストラクチャ",
  appName,
  config: properties,
});

function getProperties(envKey: String) {
  if (envKey === "dev") {
    return devProperties;
  } else if (envKey === "prd") {
    return prdProperties;
  } else {
    throw new Error("No Support environment");
  }
}

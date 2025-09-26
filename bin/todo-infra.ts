#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { TodoInfraStack } from '../lib/todo-infra-stack';

const app = new cdk.App();
new TodoInfraStack(app, 'TodoInfraStack', {
  env: { 
    account: process.env.CDK_DEFAULT_ACCOUNT, 
    region: process.env.CDK_DEFAULT_REGION || 'ap-northeast-1'
  },
  description: 'Todo アプリケーションのインフラストラクチャ',
});
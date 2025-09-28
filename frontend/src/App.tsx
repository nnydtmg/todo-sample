import React from "react";
import TodoList from "./components/TodoList";
import { AwsRum, AwsRumConfig } from "aws-rum-web";

try {
  const config: AwsRumConfig = {
    sessionSampleRate: 1,
    identityPoolId: "ap-northeast-1:1112b2d7-b5b3-48c4-8f40-105c9084dd6f",
    endpoint: "https://dataplane.rum.ap-northeast-1.amazonaws.com",
    telemetries: [
      "errors",
      "performance",
      [
        "http",
        {
          addXRayTraceIdHeader: true,
        },
      ],
    ],
    allowCookies: true,
    enableXRay: true,
    signing: false, // If you have a public resource policy and wish to send unsigned requests please set this to false
    guestRoleArn:
      "arn:aws:iam::211125790773:role/todo-app-stack-RumIdentityPoolUnauthenticatedRole2B-6Fpr01jmLsBf",
  };

  const APPLICATION_ID: string = "d8d22cf5-a75e-4a62-bffc-2258f26bc601";
  const APPLICATION_VERSION: string = "1.0.0";
  const APPLICATION_REGION: string = "ap-northeast-1";

  const awsRum: AwsRum = new AwsRum(
    APPLICATION_ID,
    APPLICATION_VERSION,
    APPLICATION_REGION,
    config
  );
} catch (error) {
  // Ignore errors thrown during CloudWatch RUM web client initialization
  console.log(error);
}

function App() {
  return <TodoList />;
}

export default App;

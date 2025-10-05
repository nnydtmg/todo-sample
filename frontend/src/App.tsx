import React from "react";
import TodoList from "./components/TodoList";
import { AwsRum, AwsRumConfig } from "aws-rum-web";

try {
  const config: AwsRumConfig = {
    sessionSampleRate: 1,
    identityPoolId: "ap-northeast-1:${id_pool_id}",
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
      "arn:aws:iam::${ACCOUNT_ID}:role/rolename",
  };

  const APPLICATION_ID: string = "XXXXXXXXXXXXXXXXX";
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

import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { AttributeType, BillingMode, Table } from "aws-cdk-lib/aws-dynamodb";
import { FunctionUrlAuthType, HttpMethod } from "aws-cdk-lib/aws-lambda";

export class LlmSsrStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    new Table(this, "LlmSsrTable", {
      partitionKey: { name: "session_id", type: AttributeType.STRING },
      sortKey: { name: "sent_at", type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const lambda = new cdk.aws_lambda_nodejs.NodejsFunction(
      this,
      "NodejsLambdaFunction",
      {
        entry: `../app/src/handler/index.ts`,
        bundling: {
          forceDockerBundling: false,
        },
        tracing: cdk.aws_lambda.Tracing.ACTIVE,
        environment: {
          OPENAI_API_KEY: cdk.aws_ssm.StringParameter.valueForStringParameter(
            this,
            `OPENAI_API_KEY`
          ),
          OPENAI_ORG_ID: cdk.aws_ssm.StringParameter.valueForStringParameter(
            this,
            `OPENAI_ORG_ID`
          ),
        },
        timeout: cdk.Duration.minutes(15),
      }
    );

    lambda.addFunctionUrl({
      authType: FunctionUrlAuthType.NONE,
      cors: {
        allowedMethods: [HttpMethod.ALL],
        allowedOrigins: ["*"],
      },
    });
  }
}

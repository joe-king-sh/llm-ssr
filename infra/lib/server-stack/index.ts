import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { AttributeType, BillingMode, Table } from "aws-cdk-lib/aws-dynamodb";
import { FunctionUrlAuthType, HttpMethod } from "aws-cdk-lib/aws-lambda";

export class LlmSsrStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const ddb = new Table(this, "LlmSsrTable", {
      tableName: "llm-ssr-table",
      partitionKey: { name: "session_id", type: AttributeType.STRING },
      sortKey: { name: "sent_at", type: AttributeType.NUMBER },
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const lambda = new cdk.aws_lambda_nodejs.NodejsFunction(
      this,
      "NodejsLambdaFunction",
      {
        entry: "../app/src/handler/index.ts",
        bundling: {
          forceDockerBundling: false,
        },
        tracing: cdk.aws_lambda.Tracing.ACTIVE,
        environment: {
          OPENAI_API_KEY: cdk.aws_ssm.StringParameter.valueForStringParameter(
            this,
            "OPENAI_API_KEY"
          ),
          OPENAI_ORG_ID: cdk.aws_ssm.StringParameter.valueForStringParameter(
            this,
            "OPENAI_ORG_ID"
          ),
          // 一度デプロイ後エンドポイントが定まるので、2回目のデプロイで指定する
          LAMBDA_FUNCTION_URL:
            cdk.aws_ssm.StringParameter.valueForStringParameter(
              this,
              "LAMBDA_FUNCTION_URL"
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

    ddb.grantReadWriteData(lambda);
  }
}

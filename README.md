# LLM SSR Demo

This repository contains the code for the server-side rendering demo using LLM, which is introduced in the following Blog.

- [パーソナライズされた UI を自動生成する EC サイトを GPT-4 で SSR して構築してみた/ I tried building an e-commerce site that automatically generates personalized UIs using GPT-4 for SSR (Server-Side Rendering)](https://dev.classmethod.jp/articles/personalize-ui-llm-ssr-demo)

## Install

```shell
$ npm ci
```

## Deploy

Register the following parameters in SSM Parameter Store in advance:

```shell
$ aws ssm put-parameter --name "OPENAI_API_KEY" --type "String" --value "<OpenAI API Key>"
$ aws ssm put-parameter --name "OPENAI_ORG_ID" --type "String" --value "<OpenAI API ORG ID>"
# After deploying with CDK once, specify the Lambda Function URL."
$ aws ssm put-parameter --name "LAMBDA_FUNCTION_URL" --type "String" --value "<Lambda Function Url>"
```

CDK Deploy

```shell
$ npm run cdk -- deploy -w infra
```

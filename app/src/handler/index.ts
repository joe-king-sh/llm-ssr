import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { Handler } from "aws-lambda";
import { OpenAI } from "openai";
import { findMessagesBySessionId, putMessage } from "src/lib/db";
import { v4 as uuid } from "uuid";
import { parse } from "querystring";
import { Role, prompts, sendMessage } from "src/lib/llm";

const ddbClient = new DynamoDBClient();

const endpoint = process.env["LAMBDA_FUNCTION_URL"]!;

export const handler: Handler = async (event) => {
  console.log(event);

  let sessionId: string | undefined;
  let body: any;
  if (
    event.requestContext.http.path === "/messages" &&
    event.requestContext.http.method === "POST"
  ) {
    const decodedBytes = Buffer.from(event.body, "base64").toString("utf-8");
    const urlDecodedStr = decodeURIComponent(decodedBytes);
    console.log({ urlDecodedStr });

    body = parse(urlDecodedStr);
    console.log({ body });

    sessionId = body?.sessionId;
  }
  console.log({ sessionId });

  const messages: { role: Role; content: string }[] = [];
  const needToSaveMessages: { role: Role; content: string }[] = [];

  // LLMへ送信するメッセージを作成
  if (sessionId == null) {
    sessionId = uuid();
    // 初期化プロンプト
    const initMessage = {
      role: "system" as const,
      content: prompts.init({ sessionId, endpoint }),
    };
    messages.push(initMessage);
    needToSaveMessages.push(initMessage);
  } else {
    const prevMessages = await findMessagesBySessionId({
      client: ddbClient,
      sessionId: sessionId,
      tableName: "llm-ssr-table",
    });

    if (prevMessages.length === 0) {
      // 初期化プロンプト
      sessionId = uuid();
      const initMessage = {
        role: "system" as const,
        content: prompts.init({ sessionId, endpoint }),
      };
      messages.push(initMessage);
      needToSaveMessages.push(initMessage);
    } else {
      // 会話履歴を復元
      prevMessages.forEach((message) => {
        messages.push({
          role: message.role as Role,
          content: message.message,
        });
      });
    }

    // ユーザーからのリクエストを会話に追加
    const userMessage = {
      role: "user" as const,
      content: body?.message,
    };
    messages.push(userMessage);
    needToSaveMessages.push(userMessage);

    // 念押し
    messages.push({
      role: "system" as const,
      content:
        "チャット入力フォームの送信ボタンと送信処理は、ユーザーとLLMが対話するために重要です。必ず実装してください。",
    });
  }

  const result = await sendMessage({
    openaiClient: new OpenAI({ apiKey: process.env["OPENAI_API_KEY"]! }),
    messages,
    organizationKey: process.env["OPENAI_ORG_ID"]!,
  });

  console.log({ result });

  const parsedResult = result.replace(/```html/g, "").replace(/```/g, "");
  console.log({ parsedResult });

  needToSaveMessages.push({
    role: "assistant" as const,
    content: parsedResult,
  });

  // メッセージを保存
  for (const message of needToSaveMessages) {
    await putMessage({
      client: ddbClient,
      tableName: "llm-ssr-table",
      item: {
        sessionId: sessionId!,
        role: message.role,
        message: message.content,
      },
    });
  }

  return {
    statusCode: 200,
    headers: { "Content-Type": "text/html" },
    body: parsedResult,
  };
};

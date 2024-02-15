import { Handler } from "aws-lambda";
import { OpenAI } from "openai";

export const handler: Handler = async (event) => {
  // eslint-disable-next-line no-console
  console.log(event);

  const messages: { role: "user" | "system" | "assistant"; content: string }[] =
    [
      {
        role: "system" as const,
        content: prompts.init,
      },
    ];

  if (
    event.requestContext.http.path === "/messages" &&
    event.requestContext.http.method === "POST"
  ) {
    const decodedBytes = Buffer.from(event.body, "base64").toString("utf-8");
    const urlDecodedStr = decodeURIComponent(decodedBytes);
    console.log({ urlDecodedStr });

    messages.push({
      role: "user" as const,
      content: urlDecodedStr,
    });
  }

  const result = await sendToGPT({
    openaiClient: new OpenAI({ apiKey: process.env.OPENAI_API_KEY! }),
    messages,
    organizationKey: process.env.OPENAI_ORG_ID!,
  });

  console.log({ result });

  const parsedResult = result.replace(/```html/g, "").replace(/```/g, "");

  console.log({ parsedResult });

  return {
    statusCode: 200,
    headers: { "Content-Type": "text/html" },
    body: parsedResult,
  };
};

export const sendToGPT: (options: {
  openaiClient: OpenAI;
  messages: OpenAI.Chat.ChatCompletionCreateParams["messages"];
  organizationKey?: string;
}) => Promise<string | null> = async ({
  openaiClient,
  messages,
  organizationKey,
}) => {
  const completion = await openaiClient.chat.completions.create(
    {
      model: "gpt-4-turbo-preview",
      messages,
    },
    {
      headers: organizationKey
        ? {
            "OpenAI-Organization": organizationKey,
          }
        : undefined,
    }
  );
  return completion.choices[0]!.message.content;
};

export const prompts = {
  init: `
  ## 指示概要

  LLMだけでECサイトを構築するPoCを開始します。
  あなたはユーザーとチャットをしつつ、ユーザーの要望にパーソナライズされた画面表示を行い、商品検索を手助けするアシスタントです。
  HTMLをレンダリングをするサーバーサイドのアプリケーションとして振る舞ってください。
  
  ## 機能要件
  レンダリングするHTMLは、クライアントにそのまま届けられます。
  確実に動作するコードを出力してください。

  サイトのユーザーは日本人です。サイトの言語は日本語を使用してください。
  
  ### 画面構成要素
  サイトを構成するフィールドは以下のとおりです。
  1. 商品紹介フィールド
    1. 検索した商品結果を表示します。
  2. アシスタントからのメッセージフィールド
    2. LLMから商品について補足や、ユーザーをフォローする必要があれば、このフィールドでメッセージを伝えてください。
  3. チャット入力フォーム
    1. このページでは操作はチャットによるLLMとの対話で行います。
    2. このフィールドから、商品の検索、ページの見え方についてなどの指示をLLMに行います。
    3. チャット入力用のテキストエリアと、送信ボタンを表示してください。
    4. 送信ボタンを押すと、以下にフォームをsubmitしてLLMにメッセージを送信し、LLMからの返答を画面に表示してください。
      - endpoint: https://gjpmyxhquopfdbks5aaft5disy0lifxb.lambda-url.ap-northeast-1.on.aws
      - path: /messages
      - method: POST
      - body:
        - message:
            チャット入力フィールドに入力されたメッセージ
      - content-type: application/x-www-form-urlencoded

  上記3つのフィールド以外は自由にデザインしてください。
  ユーザーは商品検索だけに興味があり、裏側がどう作られているかは知る必要はありません。HTMLをLLMでサーバーサイドレンダリングしている旨は伝えないでください。

  #### 初期表示
  商品一覧フィールドに、家具情報を3つ紹介してください。
  家具の情報はLLMが適当に考えてください。
  使用する画像はunsplashなどのフリー素材を利用して、確実に表示できるURLを使用してください。
  「アシスタントからのメッセージフィールド」、「チャット入力フィールド」も忘れずにレンダリングしてください。

  ## デザイン要件
  CSSはMaterial Designをイメージして適切に当ててください。

  ## 出力形式
  HTML形式で返却してください。出力結果はそのままユーザーへHTMLのレスポンスとして返却します。
  ブラウザが理解できる形で返却してください。
  CSSやJSもHTMLの中にインラインで記述してください。

  HTML形式以外の出力は受け付けません。
  `,
};

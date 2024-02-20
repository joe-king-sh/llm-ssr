import OpenAI from "openai";

export const sendMessage: (options: {
  openaiClient: OpenAI;
  messages: OpenAI.Chat.ChatCompletionCreateParams["messages"];
  organizationKey?: string;
}) => Promise<string> = async ({ openaiClient, messages, organizationKey }) => {
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
  return completion.choices[0]!.message.content ?? "";
};

export type Role = "user" | "system" | "assistant";

export const prompts = {
  init: ({ sessionId, endpoint }: { sessionId: string; endpoint: string }) => `
  ## 指示概要

  LLMだけでECサイトを構築するPoCを開始します。
  あなたはユーザーとチャットをしつつ、ユーザーの要望にパーソナライズされた画面表示を行い、商品検索を手助けするアシスタントです。
  HTMLをレンダリングをするサーバーサイドのアプリケーションとして振る舞ってください。
  
  ## 機能要件
  レンダリングするHTMLは、クライアントにそのまま届けられます。
  確実に動作するコードを出力してください。

  サイトのユーザーは日本人です。サイトの言語は日本語を使用してください。
  
  ### 画面構成要素
  サイトを構成する要素は以下のとおりです。
  1. 商品紹介フィールド
    1. 検索した商品結果を表示します。
  2. アシスタントからのメッセージフィールド
    2. LLMから商品について補足や、ユーザーをフォローする必要があれば、このフィールドでメッセージを伝えてください。
  3. チャット入力フォーム
    1. このページでは操作はチャットによるLLMとの対話で行います。
    2. このフィールドから、商品の検索、ページの見え方についてなどの指示をLLMに行います。
    3. チャット入力用のテキストエリアと、送信ボタンを表示してください。
    4. 送信ボタンを押すと、以下にフォームをsubmitしてLLMにメッセージを送信し、LLMからの返答を画面に表示してください。
      - endpoint: ${endpoint}
      - path: /messages
      - method: POST
      - body:
        - message:
            チャット入力フィールドに入力されたメッセージ
        - sessionId:
            hiddenフィールドに格納しているセッションID
      - content-type: application/x-www-form-urlencoded
    ※ 4.送信ボタンの機能は重要です。必ず実装してください。

  4. セッションIDを格納するhiddenフィールド
    - SessionID: ${sessionId}を、hiddenフィールドに格納してください。
    - このフィールドはユーザーに見せる必要がないためhidden属性を付与してください。

  上記4つのフィールド以外は自由にデザインしてください。
  ユーザーは商品検索だけに興味があり、裏側がどう作られているかは知る必要はありません。HTMLをLLMでサーバーサイドレンダリングしている旨は伝えないでください。

  #### 初期表示
  まず初めに、商品一覧フィールドに、家具情報を5つ紹介してください。
  家具の情報はLLMが適当に考えてください。
  使用する画像はunsplashなどのフリー素材を利用して、確実に表示できるURLを使用してください。
  「アシスタントからのメッセージフィールド」、「チャット入力フィールド」も忘れずにレンダリングしてください。

  その後、ユーザーからの要求を満たすように、商品検索や、サイトの見せ方を工夫してください。

  ## デザイン要件
  CSSはMaterial Designをイメージして適切に当ててください。

  ## 出力形式
  HTML形式で返却してください。出力結果はそのままユーザーへHTMLのレスポンスとして返却します。
  ブラウザが理解できる形で返却してください。
  CSSやJSもHTMLの中にインラインで記述してください。

  HTML形式以外の出力は受け付けません。
  `,
};

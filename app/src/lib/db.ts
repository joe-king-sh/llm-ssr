import {
  DynamoDBClient,
  PutItemCommand,
  QueryCommand,
  QueryCommandInput,
} from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";

type ddbBaseOptions = {
  client: DynamoDBClient;
  tableName: string;
};

type FindMessagesBySessionIdInput = ddbBaseOptions & {
  sessionId: string;
};
type FindMessagesBySessionIdOutput = {
  sentAt: string;
  messageId: string;
  role: string;
  message: string;
}[];

export const findMessagesBySessionId: (
  input: FindMessagesBySessionIdInput
) => Promise<FindMessagesBySessionIdOutput> = async ({
  client,
  sessionId,
  tableName,
}) => {
  const input: QueryCommandInput = {
    TableName: tableName,
    KeyConditionExpression: "#session_id = :sessionId",
    ExpressionAttributeNames: {
      "#session_id": "session_id",
    },
    ExpressionAttributeValues: {
      ":sessionId": { S: sessionId },
    },
    ScanIndexForward: false,
  };

  console.log("fetch input", {
    data: input,
  });
  const response = await client.send(new QueryCommand(input));
  console.log("response from dynamodb", { data: response });

  if (response?.Items == null || response.Items.length === 0) return [];

  return response.Items.map((item) => {
    const rawItem = unmarshall(item);
    return {
      sentAt: rawItem["sent_at"],
      messageId: rawItem["message_id"],
      role: rawItem["role"],
      message: rawItem["message"],
    };
  });
};

type PutMessageInput = ddbBaseOptions & {
  item: {
    sessionId: string;
    role: "user" | "system" | "assistant";
    message: string;
  };
};

export const putMessage: (input: PutMessageInput) => Promise<void> = async ({
  client,
  tableName,
  item,
}) => {
  console.log("putMessage input", { item });
  const command = new PutItemCommand({
    TableName: tableName,
    Item: marshall({
      session_id: item.sessionId,
      sent_at: new Date().getTime(),
      role: item.role,
      message: item.message,
    }),
  });
  console.log("command", { data: command });
  await client.send(command);
  return;
};

// DynamoDB orders テーブルへのサンプルデータ投入スクリプト
// 使い方: node scripts/seed-dynamodb.js

import {
  DynamoDBClient,
  BatchWriteItemCommand,
} from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({});

const orders = [
  {
    order_id: "ORD-001",
    customer_id: "CUST-001",
    product_id: "PROD-001",
    quantity: 2,
    order_date: "2026-04-01",
    status: "shipped",
  },
  {
    order_id: "ORD-002",
    customer_id: "CUST-002",
    product_id: "PROD-002",
    quantity: 1,
    order_date: "2026-04-02",
    status: "pending",
  },
  {
    order_id: "ORD-003",
    customer_id: "CUST-001",
    product_id: "PROD-003",
    quantity: 3,
    order_date: "2026-04-03",
    status: "shipped",
  },
  {
    order_id: "ORD-004",
    customer_id: "CUST-003",
    product_id: "PROD-001",
    quantity: 1,
    order_date: "2026-04-04",
    status: "delivered",
  },
  {
    order_id: "ORD-005",
    customer_id: "CUST-002",
    product_id: "PROD-004",
    quantity: 5,
    order_date: "2026-04-05",
    status: "shipped",
  },
];

const putRequests = orders.map((order) => ({
  PutRequest: {
    Item: {
      order_id: { S: order.order_id },
      customer_id: { S: order.customer_id },
      product_id: { S: order.product_id },
      quantity: { N: String(order.quantity) },
      order_date: { S: order.order_date },
      status: { S: order.status },
    },
  },
}));

const command = new BatchWriteItemCommand({
  RequestItems: {
    orders: putRequests,
  },
});

try {
  const result = await client.send(command);
  console.log("DynamoDB orders テーブルにデータを投入しました");
  if (result.UnprocessedItems?.orders?.length) {
    console.warn("未処理のアイテムがあります:", result.UnprocessedItems);
  }
} catch (error) {
  console.error("エラー:", error);
  process.exit(1);
}

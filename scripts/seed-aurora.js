// Aurora PostgreSQL products テーブル作成 + サンプルデータ投入スクリプト（Data API使用）
// 使い方: node scripts/seed-aurora.js --cluster-arn <ARN> --secret-arn <ARN>
//
// ARNはCDKデプロイ後のOutputから取得:
//   CLUSTER_ARN=$(aws cloudformation describe-stacks --stack-name DataSourceStack --query "Stacks[0].Outputs[?OutputKey=='AuroraClusterArn'].OutputValue" --output text)
//   SECRET_ARN=$(aws cloudformation describe-stacks --stack-name DataSourceStack --query "Stacks[0].Outputs[?OutputKey=='AuroraSecretArn'].OutputValue" --output text)
//   node scripts/seed-aurora.js --cluster-arn "$CLUSTER_ARN" --secret-arn "$SECRET_ARN"

import {
  RDSDataClient,
  ExecuteStatementCommand,
  BatchExecuteStatementCommand,
} from "@aws-sdk/client-rds-data";

function parseArgs() {
  const args = process.argv.slice(2);
  const params = {};
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace("--", "").replace(/-/g, "_");
    params[key] = args[i + 1];
  }
  return params;
}

const { cluster_arn, secret_arn } = parseArgs();

if (!cluster_arn || !secret_arn) {
  console.error("使い方: node scripts/seed-aurora.js --cluster-arn <ARN> --secret-arn <ARN>");
  process.exit(1);
}

const client = new RDSDataClient({});
const database = "testdb";

const commonParams = {
  resourceArn: cluster_arn,
  secretArn: secret_arn,
  database,
};

// テーブル作成
const createTableSql = `
CREATE TABLE IF NOT EXISTS products (
  product_id VARCHAR(20) PRIMARY KEY,
  product_name VARCHAR(100) NOT NULL,
  category VARCHAR(50) NOT NULL,
  price NUMERIC(10, 0) NOT NULL
)`;

try {
  await client.send(
    new ExecuteStatementCommand({
      ...commonParams,
      sql: createTableSql,
    })
  );
  console.log("products テーブルを作成しました");
} catch (error) {
  console.error("テーブル作成エラー:", error);
  process.exit(1);
}

// 既存データ削除
await client.send(
  new ExecuteStatementCommand({
    ...commonParams,
    sql: "DELETE FROM products",
  })
);

// データ投入
const products = [
  { id: "PROD-001", name: "ワイヤレスマウス", category: "PC周辺機器", price: 3980 },
  { id: "PROD-002", name: "USBキーボード", category: "PC周辺機器", price: 5480 },
  { id: "PROD-003", name: "モニターアーム", category: "オフィス用品", price: 12800 },
  { id: "PROD-004", name: "ウェブカメラ", category: "PC周辺機器", price: 8900 },
];

const insertSql = "INSERT INTO products (product_id, product_name, category, price) VALUES (:id, :name, :category, :price)";

try {
  await client.send(
    new BatchExecuteStatementCommand({
      ...commonParams,
      sql: insertSql,
      parameterSets: products.map((p) => [
        { name: "id", value: { stringValue: p.id } },
        { name: "name", value: { stringValue: p.name } },
        { name: "category", value: { stringValue: p.category } },
        { name: "price", value: { longValue: p.price } },
      ]),
    })
  );
  console.log("products テーブルに4件のデータを投入しました");
} catch (error) {
  console.error("データ投入エラー:", error);
  process.exit(1);
}

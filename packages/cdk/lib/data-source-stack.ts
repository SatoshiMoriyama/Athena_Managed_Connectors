import * as cdk from 'aws-cdk-lib/core';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import type { Construct } from 'constructs';

export class DataSourceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // VPC（Public + Private サブネット、NAT Gateway 1台）
    const vpc = new ec2.Vpc(this, 'AthenaTestVpc', {
      maxAzs: 2,
      natGateways: 1,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
    });

    // DynamoDB: orders テーブル
    const ordersTable = new dynamodb.Table(this, 'OrdersTable', {
      tableName: 'orders',
      partitionKey: { name: 'order_id', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'customer_id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Aurora Serverless v2 (PostgreSQL互換)
    const cluster = new rds.DatabaseCluster(this, 'AuroraCluster', {
      engine: rds.DatabaseClusterEngine.auroraPostgres({
        version: rds.AuroraPostgresEngineVersion.VER_16_6,
      }),
      serverlessV2MinCapacity: 0,
      serverlessV2MaxCapacity: 2,
      writer: rds.ClusterInstance.serverlessV2('Writer'),
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      defaultDatabaseName: 'testdb',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      credentials: rds.Credentials.fromGeneratedSecret('postgres'),
      enableDataApi: true,
    });

    // Athenaコネクタ用セキュリティグループ
    const connectorSg = new ec2.SecurityGroup(this, 'AthenaConnectorSg', {
      vpc,
      description: 'Security group for Athena managed connector ENI',
    });

    // AuroraへのインバウンドをコネクタSGから許可
    cluster.connections.allowFrom(
      connectorSg,
      ec2.Port.tcp(5432),
      'Athena connector',
    );

    // Outputs
    new cdk.CfnOutput(this, 'DynamoDBTableName', {
      value: ordersTable.tableName,
      exportName: 'DataSource-DynamoDBTableName',
    });
    new cdk.CfnOutput(this, 'AuroraClusterEndpoint', {
      value: cluster.clusterEndpoint.hostname,
      exportName: 'DataSource-AuroraClusterEndpoint',
    });
    new cdk.CfnOutput(this, 'AuroraSecretArn', {
      value: cluster.secret?.secretArn ?? '',
      exportName: 'DataSource-AuroraSecretArn',
    });
    new cdk.CfnOutput(this, 'AuroraClusterArn', {
      value: cluster.clusterArn,
      exportName: 'DataSource-AuroraClusterArn',
    });
    new cdk.CfnOutput(this, 'VpcId', {
      value: vpc.vpcId,
      exportName: 'DataSource-VpcId',
    });
    new cdk.CfnOutput(this, 'AuroraSecurityGroupId', {
      value: cluster.connections.securityGroups[0].securityGroupId,
      exportName: 'DataSource-AuroraSecurityGroupId',
    });
    new cdk.CfnOutput(this, 'IsolatedSubnetIds', {
      value: vpc.privateSubnets.map((s) => s.subnetId).join(','),
      exportName: 'DataSource-IsolatedSubnetIds',
    });
    new cdk.CfnOutput(this, 'AthenaConnectorSecurityGroupId', {
      value: connectorSg.securityGroupId,
      exportName: 'DataSource-AthenaConnectorSgId',
    });
  }
}

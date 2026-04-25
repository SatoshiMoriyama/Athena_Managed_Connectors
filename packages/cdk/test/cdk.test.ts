import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { DataSourceStack } from '../lib/data-source-stack';

describe('DataSourceStack', () => {
  test('スナップショットテスト', () => {
    const app = new cdk.App();
    const stack = new DataSourceStack(app, 'TestStack');
    const template = Template.fromStack(stack);

    expect(template.toJSON()).toMatchSnapshot();
  });
});

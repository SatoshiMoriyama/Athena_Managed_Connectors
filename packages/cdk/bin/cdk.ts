#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib/core';
import { DataSourceStack } from '../lib/data-source-stack';

const app = new cdk.App();
new DataSourceStack(app, 'DataSourceStack', {});

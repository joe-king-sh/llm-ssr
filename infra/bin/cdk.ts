#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { LlmSsrStack } from "../lib/server-stack/index";

const app = new cdk.App();

new LlmSsrStack(app, `LlmSsrStack`);

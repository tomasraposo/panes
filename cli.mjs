#!/usr/bin/env node
import { register } from 'tsx/esm/api';

register();

const { execute } = await import('./src/cli.ts');

const rawArgs = process.argv.slice(2);
const { output, exitCode } = await execute(rawArgs);
if (output) {
  process.stdout.write(output.endsWith('\n') ? output : output + '\n');
}
process.exit(exitCode);

import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const nextEntrypoint = require.resolve('next/dist/bin/next');
const nextArgs = process.argv.slice(2);

if (nextArgs.length === 0) {
    console.error('Usage: node scripts/run-next.mjs <dev|build> [next args...]');
    process.exit(1);
}

const [command, ...restArgs] = nextArgs;
const shouldUseTurbopack = process.platform !== 'win32';

let commandArgs;

if (shouldUseTurbopack) {
    commandArgs = [command, ...restArgs, '--turbopack'];
} else if (command === 'dev') {
    commandArgs = [command, ...restArgs, '--webpack'];
} else {
    commandArgs = nextArgs;
}

if (!shouldUseTurbopack) {
    console.log('Using Webpack for Next.js on Windows because Turbopack native bindings are unavailable.');
}

const child = spawn(process.execPath, [nextEntrypoint, ...commandArgs], {
    stdio: 'inherit',
    shell: false,
});

child.on('exit', (code, signal) => {
    if (signal) {
        process.kill(process.pid, signal);
        return;
    }

    process.exit(code ?? 1);
});

child.on('error', (error) => {
    console.error(error);
    process.exit(1);
});
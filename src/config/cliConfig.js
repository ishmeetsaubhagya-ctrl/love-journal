#!/usr/bin/env node

import { spawn } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const COMMANDS = new Set([
    "setup",
    "dev",
    "build",
    "preview",
    "deploy",
    "add",
    "remove"
]);

const VITE_ARGS = {
    dev: [],
    build: ["build"],
    preview: ["preview"]
};

const HELP_TEXT = `
💌 Moracarta — build your own love-letter website

Usage: npx moracarta <command>

Commands:
  setup      Scaffold the site into your project and configure it interactively
  add        Add a letter from a public Google Docs tab
  remove     Remove a letter you've already added
  dev        Start the local dev server to preview your site
  build      Build the site for production
  preview    Preview the production build locally
  deploy     Build and deploy the site to Cloudflare Pages

Run 'moracarta setup' first if you haven't already.
`;

const command = process.argv[2];
const commandArguments = process.argv.slice(3);

if (!command || command === "--help" || command === "-h") {
    console.log(HELP_TEXT);
    process.exit(0);
}

if (!COMMANDS.has(command)) {
    console.error(`Unknown command: ${command}`);
    console.log(HELP_TEXT);
    process.exit(1);
}

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const npxCommand = process.platform === "win32" ? "npx.cmd" : "npx";

const child =
        command === "setup" ||
        command === "deploy" ||
        command === "add" ||
        command === "remove"
    ? spawn(
        process.execPath,
        [
            resolve(packageRoot, "src", "commands", `${command}.js`),
            ...commandArguments
        ],
        { stdio: "inherit" }
    )
    : spawn(
        npxCommand,
        [
            "vite",
            ...VITE_ARGS[command],
            "--config",
            "vite.config.mjs",
            ...commandArguments
        ],
        { stdio: "inherit" }
    );

child.on("exit", (code, signal) => {
    if (signal) {
        process.kill(process.pid, signal);
        return;
    }

    process.exitCode = code ?? 1;
});
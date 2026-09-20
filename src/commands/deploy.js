#!/usr/bin/env node

// This command builds the user's site with Vite and ships the
// resulting dist/ folder to Cloudflare Pages via Wrangler.
//
// Like add.js, it is meant to be run from inside the user's own
// project directory — that's why paths below are resolved
// against process.cwd(), not the installed package location.

import { execSync } from "node:child_process";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const dataPath = resolve(process.cwd(), "src", "config", "globalVariables.js");

let globalVariables;

// Load the user's generated config — it only exists after
// `moracarta setup` has written src/config/globalVariables.js,
// so a missing file just means setup hasn't run yet. That's why
// ERR_MODULE_NOT_FOUND gets a friendly nudge instead of a raw stack trace.
try {
    ({ default: globalVariables } = await import(pathToFileURL(dataPath).href));
} catch (error) {
    if (error.code === "ERR_MODULE_NOT_FOUND") {
        console.error("\n✗ No configuration found. Run moracarta setup first.");
        process.exit(1);
    }

    throw error;
}

const { PROJECT_NAME } = globalVariables;

// Windows needs the .cmd extension to find npx, other platforms don't.
const npxCommand = process.platform === "win32" ? "npx.cmd" : "npx";

console.log(`Building ${PROJECT_NAME}...`);

// Stage 1 — build a static copy of the site into dist/.
execSync(`${npxCommand} vite build --config vite.config.mjs`, {
    stdio: "inherit"
});

console.log(`Deploying ${PROJECT_NAME} to Cloudflare Pages...`);

// Stage 2 — deploy that finished dist/ output to Cloudflare Pages.
execSync(
    `${npxCommand} wrangler pages deploy dist --project-name ${PROJECT_NAME}`,
    {
        stdio: "inherit"
    }
);

console.log(`\n❤️ ${PROJECT_NAME} deployed successfully!`);
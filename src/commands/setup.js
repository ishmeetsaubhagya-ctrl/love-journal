/**
 * 'npx moracarta setup' runs the whole CLI setup part of the app.
 * It gives the user multiple prompts to properly setup their custom site.
 * After it's done all custom variables are written into src/config/globalVariables.js
 * See setupCore.js for further documentation on this.
 */

import { select, input, confirm } from "@inquirer/prompts";
import { writeFile, mkdir } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
    buildSetupConfig,
    copyTemplateFiles,
    ensureModuleType
} from "./setupCore.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PACKAGE_ROOT = resolve(__dirname, "..", "..");

const PROJECT_NAME = await input({
    message: "What should your project be called? (Cloudflare project name, do not use 'moracarta')",
    default: "romantic-gift",
});

const TITLE = await input({
    message: "Enter the title of the application: ",
    default: "Letters to my love"
});

const FONT = await select({
    message: "What font style would you like to use?",
    choices: [
        { name: "Handwritten", value: "handwritten" },
        { name: "Classic", value: "classic" },
        { name: "Modern", value: "modern" }
    ]
});

const TOP_MESSAGES = {
    top_1: "Every letter here holds a piece of everything I feel for you.",
    top_2: "If my love could fit into words, these would just be the beginning.",
    top_3: "Open slowly — every envelope has a little piece of me inside.",
    top_4: "I didn't write letters. I wrote promises.",
    top_5: "Made by hand, kept in my heart — for you."
};

const TOP_CHOICE = await select({
    message: "Choose the message at the top of the main page:",
    choices: [
        {
            name: "Insert custom text",
            value: "custom"
        },
        ...Object.entries(TOP_MESSAGES).map(([value, name]) => ({
            name,
            value
        }))
    ]
});

const TEXT_TOP = TOP_CHOICE === "custom"
    ? await input({
        message: "Enter your custom message:"
    })
    : TOP_MESSAGES[TOP_CHOICE];

const BOTTOM_MESSAGES = {
    bottom_1: "If I could choose again, I'd choose you in every version of my life. ♡",
    bottom_2: "This is only a fraction of what I feel. I show you the rest every day. ♡",
    bottom_3: "Thank you for being the reason for so many letters still to come. ♡",
    bottom_4: "I love you in prose, in silence, and in every line I wrote here. ♡",
    bottom_5: "End of the letters, not of the love. That one keeps going every day. ♡"
};

const BOTTOM_CHOICE = await select({
    message: "Choose the message at the bottom of the main page:",
    choices: [
        {
            name: "Insert custom text",
            value: "custom"
        },
        ...Object.entries(BOTTOM_MESSAGES).map(([value, name]) => ({
            name,
            value
        }))
    ]
});

const TEXT_BOTTOM = BOTTOM_CHOICE === "custom"
    ? await input({
        message: "Enter your custom message:"
    })
    : BOTTOM_MESSAGES[BOTTOM_CHOICE];

const FIRST_NAME = await input({
    message: "Enter your first name: "
});

const YOUR_NAME = "~ "+FIRST_NAME+" ♡"; 

const RECIPIENT_NAME = await input({
    message: "What is their name?"
});

const DEFAULT_CLOSED_LETTER_TEXT_TOP_LINE =
    `&#10084;&#65039; To ${RECIPIENT_NAME} &#10084;&#65039;`;

const DEFAULT_CLOSED_LETTER_TEXT_BOTTOM_LINE =
    "&#10084;&#65039; I love you &#10084;&#65039;";

const EDIT_ENVELOPE_TEXT = await select({
    message: "Would you like to customize the envelope text? ",
    choices: [{
        name: "yes",
        value: true
    },{
        name: "no",
        value: false
    }],
});

let CLOSED_LETTER_TEXT_TOP_LINE = DEFAULT_CLOSED_LETTER_TEXT_TOP_LINE;
let CLOSED_LETTER_TEXT_BOTTOM_LINE = DEFAULT_CLOSED_LETTER_TEXT_BOTTOM_LINE;

if (EDIT_ENVELOPE_TEXT) {
    CLOSED_LETTER_TEXT_TOP_LINE = await input({
        message: "Top line of the closed envelope (press TAB to edit):",
        default: DEFAULT_CLOSED_LETTER_TEXT_TOP_LINE
    });

    CLOSED_LETTER_TEXT_BOTTOM_LINE = await input({
        message: "Bottom line of the closed envelope (press TAB to edit):",
        default: DEFAULT_CLOSED_LETTER_TEXT_BOTTOM_LINE
    });
}

const SHOW_BRANDING = await select({
    message: "Would you like to display 'Made with 💌 Moracarta' branding in the footer? ",
    choices: [{
        name: "yes",
        value: true
    },{
        name: "no",
        value: false
    }],
});

const config = buildSetupConfig({
    projectName: PROJECT_NAME,
    title: TITLE,
    font: FONT,
    textTop: TEXT_TOP,
    textBottom: TEXT_BOTTOM,
    yourName: YOUR_NAME,
    closedLetterTextTopLine: CLOSED_LETTER_TEXT_TOP_LINE,
    closedLetterTextBottomLine: CLOSED_LETTER_TEXT_BOTTOM_LINE,
    showBranding: SHOW_BRANDING
});

const dataPath = resolve(
    process.cwd(),
    "src",
    "config",
    "globalVariables.js"
);

await mkdir(dirname(dataPath), { recursive: true });
await writeFile(dataPath, config, "utf8");


// Files that make up the actual site. These get copied out of the
// installed package and into the user's own project so `dev`/`build`
// run against a real local copy — never against node_modules.
const TEMPLATE_ENTRIES = [
    "index.html",
    "vite.config.mjs",
    "public",
    "src/config/fonts.js",
    "src/content/letters.example.js",
    "src/loaders/lettersLoader.js",
    "src/scripts",
    "src/services",
    "src/styles",
    "src/views"
];

if (resolve(PACKAGE_ROOT) !== resolve(process.cwd())) {
    console.log("\nCopying project files...");
    await copyTemplateFiles(PACKAGE_ROOT, process.cwd(), TEMPLATE_ENTRIES);
    console.log("✓ Project files copied.");
}

await ensureModuleType(process.cwd());

console.log("\n❤️ Moracarta setup complete!");
console.log(`Configuration saved to: ${dataPath}`);
console.log("Run moracarta dev to test the application");

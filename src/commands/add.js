#!/usr/bin/env node

import { input } from "@inquirer/prompts";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { getDocumentText } from "../services/googleDocs.js";

// After scaffolding, the real project lives in the user's cwd —
// never in node_modules/moracarta — so everything here is
// resolved against process.cwd(), not __dirname.
const DATA_DIRECTORY = resolve(
    process.cwd(),
    "src",
    "content"
);

const LETTERS_FILE = resolve(
    DATA_DIRECTORY,
    "letters.js"
);

function formatDate(date = new Date()) {
    return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
    }).format(date);
}

function escapeTemplateLiteral(content) {
    return content
        .replaceAll("\\", "\\\\")
        .replaceAll("`", "\\`")
        .replaceAll("${", "\\${");
}

async function readLettersFile() {
    try {
        return await readFile(LETTERS_FILE, "utf8");
    } catch (error) {
        if (error.code === "ENOENT") {
            return "";
        }

        throw error;
    }
}

function getNextId(lettersFile) {
    const ids = [
        ...lettersFile.matchAll(/\bid:\s*(\d+)/g)
    ].map(match => Number(match[1]));

    return ids.length > 0
        ? Math.max(...ids) + 1
        : 1;
}

function appendLetter(lettersFile, letter) {
    const letterObject = `  {
    id: ${letter.id},
    date: '${letter.date}',
    title: '${letter.title.replaceAll("'", "\\'")}',
    content: \`${escapeTemplateLiteral(letter.content)}\`
  }`;

    if (!lettersFile.trim()) {
        return `export const letters = [
${letterObject}
];

`;
    }

    const closingIndex = lettersFile.lastIndexOf("];");

    if (closingIndex === -1) {
        throw new Error(
            "Could not find the end of the letters array in src/content/letters.js."
        );
    }

    const beforeClosing = lettersFile
        .slice(0, closingIndex)
        .trimEnd();

    const separator = beforeClosing.endsWith("[")
        ? "\n"
        : ",\n";

    return (
        beforeClosing +
        separator +
        letterObject +
        "\n" +
        lettersFile.slice(closingIndex)
    );
}

async function main() {
    console.log("\n💌 Moracarta — Add Letter\n");

    const GOOGLE_DOCS_URL = "\x1b[34mhttps://docs.google.com/document/\x1b[0m";

    const url = await input({
        message: `Create a Google Doc for all your letters;
${GOOGLE_DOCS_URL} (Ctrl + click to open)
Each letter should have it's own tab;
Your Google Doc must be public;
(IMPORTANT) Use 5 spaces instead of TAB for identation;
You will have to add each letter individually;
Paste the Google Docs tab URL:`
    });

    console.log("\nFetching Google Docs tab...\n");

    const content = await getDocumentText(url);

    if (!content) {
        throw new Error(
            "The Google Docs tab does not contain any text."
        );
    }

    const title = await input({
        message: "Letter title:"
    });

    if (!title.trim()) {
        throw new Error(
            "Letter title cannot be empty."
        );
    }

    await mkdir(DATA_DIRECTORY, {
        recursive: true
    });

    const lettersFile = await readLettersFile();

    const nextId = getNextId(lettersFile);

    const letter = {
        id: nextId,
        date: formatDate(),
        title: title.trim(),
        content
    };

    const updatedFile = appendLetter(
        lettersFile,
        letter
    );

    await writeFile(
        LETTERS_FILE,
        updatedFile,
        "utf8"
    );

    console.log("\n✓ Letter added successfully!");
    console.log(`  ID: ${letter.id}`);
    console.log(`  Title: ${letter.title}`);
    console.log(`  Date: ${letter.date}`);
}

main().catch(error => {
    console.error(`\n✗ ${error.message}`);
    process.exit(1);
});
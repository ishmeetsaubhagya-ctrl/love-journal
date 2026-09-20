#!/usr/bin/env node

import { confirm, select } from "@inquirer/prompts";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const LETTERS_FILE = resolve(
    process.cwd(),
    "src",
    "content",
    "letters.js"
);

async function readLettersFile() {
    try {
        return await readFile(LETTERS_FILE, "utf8");
    } catch (error) {
        if (error.code === "ENOENT") {
            throw new Error(
                "No letters have been added yet."
            );
        }

        throw error;
    }
}

function extractLetters(lettersFile) {
    const match = lettersFile.match(
        /export const letters = \[([\s\S]*?)\];/
    );

    if (!match) {
        throw new Error(
            "Could not find the letters array in src/content/letters.js."
        );
    }

    const letters = [];

    const objectRegex =
        /\{[\s\S]*?content:\s*`[\s\S]*?`\s*\}/g;

    const objects = match[1].match(objectRegex) ?? [];

    for (const object of objects) {
        const idMatch = object.match(/id:\s*(\d+)/);
        const dateMatch = object.match(/date:\s*'([^']*)'/);
        const titleMatch = object.match(
            /title:\s*'((?:\\'|[^'])*)'/
        );
        const contentMatch = object.match(
            /content:\s*`([\s\S]*?)`/
        );

        if (!idMatch || !titleMatch || !contentMatch) {
            continue;
        }

        letters.push({
            id: Number(idMatch[1]),
            date: dateMatch?.[1] ?? "",
            title: titleMatch[1].replaceAll("\\'", "'"),
            content: contentMatch[1]
        });
    }

    return letters;
}

function escapeTemplateLiteral(content) {
    return content
        .replaceAll("\\", "\\\\")
        .replaceAll("`", "\\`")
        .replaceAll("${", "\\${");
}

function escapeSingleQuote(value) {
    return value
        .replaceAll("\\", "\\\\")
        .replaceAll("'", "\\'");
}

function generateLettersFile(letters) {
    const objects = letters.map(letter => `  {
    id: ${letter.id},
    date: '${escapeSingleQuote(letter.date)}',
    title: '${escapeSingleQuote(letter.title)}',
    content: \`${escapeTemplateLiteral(letter.content)}\`
  }`);

    return `export const letters = [
${objects.join(",\n")}
];

`;
}

function generateEmptyLettersFile() {
    return `export const letters = [];

`;
}

async function main() {
    console.log("\n💌 Moracarta — Remove Letter\n");

    const lettersFile = await readLettersFile();
    const letters = extractLetters(lettersFile);

    if (letters.length === 0) {
        throw new Error(
            "No letters have been added yet."
        );
    }

    const choices = [
        {
            name: "Remove all letters",
            value: "all"
        },
        ...letters.map(letter => ({
            name: `${letter.id} — ${letter.title}`,
            value: letter.id
        }))
    ];

    const selection = await select({
        message: "Which letter do you want to remove?",
        choices,
        pageSize: 3
    });

    if (selection === "all") {
        const confirmed = await confirm({
            message: `Are you sure you want to remove all ${letters.length} letters?`,
            default: false
        });

        if (!confirmed) {
            console.log("\n✗ Operation cancelled.");
            return;
        }

        await writeFile(
            LETTERS_FILE,
            generateEmptyLettersFile(),
            "utf8"
        );

        console.log(
            `\n✓ All ${letters.length} letters were removed successfully!`
        );

        return;
    }

    const selectedLetter = letters.find(
        letter => letter.id === selection
    );

    if (!selectedLetter) {
        throw new Error("Selected letter could not be found.");
    }

    const remainingLetters = letters
        .filter(letter => letter.id !== selection)
        .map((letter, index) => ({
            ...letter,
            id: index + 1
        }));

    const updatedFile = generateLettersFile(
        remainingLetters
    );

    await writeFile(
        LETTERS_FILE,
        updatedFile,
        "utf8"
    );

    console.log("\n✓ Letter removed successfully!");
    console.log(`  Removed: ${selectedLetter.title}`);

    if (remainingLetters.length > 0) {
        console.log(
            `  Remaining letters: ${remainingLetters.length}`
        );
    } else {
        console.log("  No letters remaining.");
    }
}

main().catch(error => {
    console.error(`\n✗ ${error.message}`);
    process.exit(1);
});
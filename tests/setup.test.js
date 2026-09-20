import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
    buildSetupConfig,
    copyTemplateFiles,
    ensureModuleType
} from "../src/commands/setupCore.js";

test("setup core can build the generated configuration", () => {
    const config = buildSetupConfig({
        projectName: "my-project",
        title: "Letters",
        font: "modern",
        textTop: "Top",
        textBottom: "Bottom",
        yourName: "~ Alex ♡",
        closedLetterTextTopLine: "To Sam",
        closedLetterTextBottomLine: "I love you",
        showBranding: true
    });

    assert.match(config, /const PROJECT_NAME = "my-project";/);
    assert.match(config, /const TITLE = "Letters";/);
    assert.match(config, /const FONT = "modern";/);
    assert.match(config, /const TEXT_TOP = "Top";/);
    assert.match(config, /const TEXT_BOTTOM = "Bottom";/);
    assert.match(config, /const YOUR_NAME = "~ Alex ♡";/);
    assert.match(config, /const CLOSED_LETTER_TEXT_TOP_LINE =\n    "To Sam";/);
    assert.match(config, /const CLOSED_LETTER_TEXT_BOTTOM_LINE =\n    "I love you";/);
    assert.match(config, /const SHOW_BRANDING = true;/);
});

test("ensureModuleType adds type module without losing package.json fields", async () => {
    const projectDir = await mkdtemp(join(tmpdir(), "moracarta-setup-"));

    try {
        await writeFile(
            join(projectDir, "package.json"),
            JSON.stringify({ name: "demo", scripts: { start: "node index.js" } }),
            "utf8"
        );

        await ensureModuleType(projectDir);

        const packageJson = JSON.parse(
            await readFile(join(projectDir, "package.json"), "utf8")
        );

        assert.deepEqual(packageJson, {
            name: "demo",
            scripts: { start: "node index.js" },
            type: "module"
        });
    } finally {
        await rm(projectDir, { recursive: true, force: true });
    }
});

test("copyTemplateFiles copies requested template entries into the project", async () => {
    const packageRoot = await mkdtemp(join(tmpdir(), "moracarta-package-"));
    const projectRoot = await mkdtemp(join(tmpdir(), "moracarta-project-"));

    try {
        await writeFile(join(packageRoot, "index.html"), "<h1>Moracarta</h1>", "utf8");
        await mkdir(join(packageRoot, "src", "views"), { recursive: true });
        await writeFile(
            join(packageRoot, "src", "views", "home.js"),
            "export default {};",
            "utf8"
        );

        await copyTemplateFiles(packageRoot, projectRoot, [
            "index.html",
            "src/views"
        ]);

        assert.equal(
            await readFile(join(projectRoot, "index.html"), "utf8"),
            "<h1>Moracarta</h1>"
        );
        assert.equal(
            await readFile(join(projectRoot, "src", "views", "home.js"), "utf8"),
            "export default {};"
        );
    } finally {
        await rm(packageRoot, { recursive: true, force: true });
        await rm(projectRoot, { recursive: true, force: true });
    }
});

test("copyTemplateFiles does nothing when package and project are the same directory", async () => {
    const root = await mkdtemp(join(tmpdir(), "moracarta-same-root-"));

    try {
        await assert.doesNotReject(() =>
            copyTemplateFiles(root, root, ["missing-template-entry"])
        );
    } finally {
        await rm(root, { recursive: true, force: true });
    }
});

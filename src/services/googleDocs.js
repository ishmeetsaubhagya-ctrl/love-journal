const REQUEST_TIMEOUT = 10_000;

export async function getDocumentText(documentUrl) {
    if (!documentUrl) {
        throw new Error("Google Docs URL is required.");
    }

    let urlObject;

    try {
        urlObject = new URL(documentUrl);
    } catch {
        throw new Error("Invalid Google Docs URL.");
    }

    const pathParts = urlObject.pathname.split("/");
    const documentIndex = pathParts.indexOf("d");

    if (documentIndex === -1 || !pathParts[documentIndex + 1]) {
        throw new Error("Invalid Google Docs URL.");
    }

    const documentId = pathParts[documentIndex + 1];
    const tabId = urlObject.searchParams.get("tab");

    if (!tabId) {
        throw new Error(
            "Could not find a Google Docs tab in the URL."
        );
    }

    const exportUrl =
        `https://docs.google.com/document/d/${documentId}/export` +
        `?format=txt&tab=${encodeURIComponent(tabId)}`;

    let response;

    try {
        response = await fetch(exportUrl, {
            signal: AbortSignal.timeout(REQUEST_TIMEOUT)
        });
    } catch (error) {
        if (error.name === "TimeoutError") {
            throw new Error(
                "Google Docs request timed out. " +
                "Make sure the document is publicly accessible."
            );
        }

        throw new Error(
            `Could not connect to Google Docs: ${error.message}`
        );
    }

    if (!response.ok) {
        throw new Error(
            `Google Docs returned HTTP ${response.status}. ` +
            "Make sure the document is publicly accessible."
        );
    }

    const text = await response.text();

const content = text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\s+$/, "");

    if (!content) {
        throw new Error(
            "The Google Docs tab does not contain any text."
        );
    }

    return content;
}
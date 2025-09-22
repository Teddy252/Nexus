// A simple sanitizer to allow basic markdown (bold, italic, lists) while preventing XSS.
// For a production app, a more robust library like DOMPurify is highly recommended.
export const formatAndSanitizeAiText = (text: string): string => {
    // 1. Escape HTML special characters to prevent injection
    const sanitizedText = text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

    // 2. Apply safe markdown-to-HTML conversions
    let html = sanitizedText
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
        .replace(/\*(.*?)\*/g, '<em>$1</em>');       // Italic

    // 3. Handle simple lists and paragraphs
    const lines = html.split('\n');
    let inList = false;
    let result = '';

    for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('- ')) {
            if (!inList) {
                result += '<ul class="list-disc list-inside ml-4">';
                inList = true;
            }
            result += `<li>${trimmed.substring(2)}</li>`;
        } else {
            if (inList) {
                result += '</ul>';
                inList = false;
            }
            if (trimmed) {
                result += `<p>${trimmed}</p>`;
            }
        }
    }
    if (inList) {
        result += '</ul>';
    }

    return result;
};

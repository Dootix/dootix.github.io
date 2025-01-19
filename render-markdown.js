// render-markdown.js

async function renderMarkdown() {
    // Get the Markdown file from the query parameter
    const urlParams = new URLSearchParams(window.location.search);
    const markdownFile = urlParams.get('file');

    if (!markdownFile) {
        document.getElementById('markdown-content').innerHTML = '<p style="color: red;">No file specified.</p>';
        return;
    }

    try {
        // Fetch the Markdown file
        const response = await fetch(markdownFile);
        if (!response.ok) {
            throw new Error(`Failed to load ${markdownFile}`);
        }

        // Convert Markdown to HTML
        const markdownText = await response.text();
        const htmlContent = marked(markdownText);

        // Inject the rendered HTML into the page
        document.getElementById('markdown-content').innerHTML = htmlContent;
    } catch (error) {
        console.error('Error rendering Markdown:', error);
        document.getElementById('markdown-content').innerHTML = '<p style="color: red;">Failed to load the Markdown file.</p>';
    }
}

// Run when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', renderMarkdown);

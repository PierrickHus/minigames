// ==========================================
// PARSER MARKDOWN
// ==========================================

/**
 * Parse un tableau markdown en HTML
 */
function parseMarkdownTables(md) {
    const lines = md.split('\n');
    const result = [];
    let inTable = false;
    let tableLines = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        if (line.includes('|') && !inTable) {
            if (i + 1 < lines.length && /^\|?[\s-:|]+\|?$/.test(lines[i + 1])) {
                inTable = true;
                tableLines = [line];
                continue;
            }
        }

        if (inTable) {
            if (line.includes('|')) {
                tableLines.push(line);
            } else {
                result.push(convertTableToHtml(tableLines));
                inTable = false;
                tableLines = [];
                result.push(line);
            }
        } else {
            result.push(line);
        }
    }

    if (inTable && tableLines.length > 0) {
        result.push(convertTableToHtml(tableLines));
    }

    return result.join('\n');
}

/**
 * Convertit les lignes d'un tableau en HTML
 */
function convertTableToHtml(lines) {
    if (lines.length < 2) return lines.join('\n');

    let html = '<table>';

    const headerCells = lines[0].split('|').map(c => c.trim()).filter(c => c);
    html += '<thead><tr>';
    headerCells.forEach(cell => {
        html += `<th>${cell}</th>`;
    });
    html += '</tr></thead>';

    html += '<tbody>';
    for (let i = 2; i < lines.length; i++) {
        const cells = lines[i].split('|').map(c => c.trim()).filter(c => c);
        if (cells.length > 0) {
            html += '<tr>';
            cells.forEach(cell => {
                html += `<td>${cell}</td>`;
            });
            html += '</tr>';
        }
    }
    html += '</tbody></table>';

    return html;
}

/**
 * Parse le markdown en HTML
 */
export function parseMarkdown(md) {
    let html = md;

    // Échapper les caractères HTML dangereux
    html = html.replace(/</g, '&lt;').replace(/>/g, '&gt;');

    // Titres
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

    // Gras et italique
    html = html.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>');
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

    // Code inline
    html = html.replace(/`(.*?)`/g, '<code>$1</code>');

    // Lignes horizontales
    html = html.replace(/^---$/gim, '<hr>');

    // Tableaux
    html = parseMarkdownTables(html);

    // Listes non ordonnées
    html = html.replace(/^\- (.*$)/gim, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)(\n(?!<li>))/g, '$1</ul>$2');
    html = html.replace(/(?<!<\/ul>)(\n)(<li>)/g, '$1<ul>$2');

    // Listes ordonnées
    html = html.replace(/^\d+\. (.*$)/gim, '<oli>$1</oli>');
    html = html.replace(/(<oli>.*<\/oli>)(\n(?!<oli>))/g, '$1</ol>$2');
    html = html.replace(/(?<!<\/ol>)(\n)(<oli>)/g, '$1<ol>$2');
    html = html.replace(/<oli>/g, '<li>').replace(/<\/oli>/g, '</li>');

    // Paragraphes
    html = html.replace(/\n\n/g, '</p><p>');
    html = '<p>' + html + '</p>';

    // Nettoyer les paragraphes vides autour des éléments de bloc
    html = html.replace(/<p>(<h[1-6]>)/g, '$1');
    html = html.replace(/(<\/h[1-6]>)<\/p>/g, '$1');
    html = html.replace(/<p>(<hr>)<\/p>/g, '$1');
    html = html.replace(/<p>(<ul>)/g, '$1');
    html = html.replace(/(<\/ul>)<\/p>/g, '$1');
    html = html.replace(/<p>(<ol>)/g, '$1');
    html = html.replace(/(<\/ol>)<\/p>/g, '$1');
    html = html.replace(/<p>(<table>)/g, '$1');
    html = html.replace(/(<\/table>)<\/p>/g, '$1');
    html = html.replace(/<p>\s*<\/p>/g, '');

    return html;
}

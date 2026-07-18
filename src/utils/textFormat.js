export function formatListText(text, listStyle) {
    if (listStyle === 'none' || !text) return text;
    const lines = text.split('\n');

    if (listStyle === 'bullet') {
        return lines.map(l => l.length > 0 ? `• ${l}` : '').join('\n');
    }

    if (listStyle === 'numbered') {
        let counter = 1;
        return lines.map(l => {
            if (l.length === 0) return '';
            return `${counter++}. ${l}`;
        }).join('\n');
    }

    return text;
}
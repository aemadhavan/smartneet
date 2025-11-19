import 'server-only';
import { remark } from 'remark';
import html from 'remark-html';
import remarkGfm from 'remark-gfm';

export async function renderMarkdownToHTML(content: string): Promise<string> {
    const processedContent = await remark()
        .use(remarkGfm)
        .use(html)
        .process(content);

    return processedContent.toString();
}

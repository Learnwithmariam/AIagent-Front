import React from 'react';

/**
 * Minimal Markdown for chat replies: headings, bullet/numbered lists, fenced code,
 * **bold**, *italic*, `code` and links. Renders React elements only — never raw HTML.
 */

function inline(text: string, keyBase: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*\s][^*]*\*|\[[^\]]+\]\(https?:\/\/[^)\s]+\))/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const tok = m[0];
    const key = `${keyBase}-${i++}`;
    if (tok.startsWith('**')) out.push(<strong key={key} className="font-semibold text-white">{tok.slice(2, -2)}</strong>);
    else if (tok.startsWith('`'))
      out.push(
        <code key={key} className="px-1.5 py-0.5 rounded-md bg-black/40 border border-white/[0.06] text-brand-200 font-mono text-[0.85em]">
          {tok.slice(1, -1)}
        </code>
      );
    else if (tok.startsWith('[')) {
      const [, label, href] = /\[([^\]]+)\]\(([^)]+)\)/.exec(tok)!;
      out.push(
        <a key={key} href={href} target="_blank" rel="noreferrer noopener" className="text-brand-300 underline decoration-brand-500/40 underline-offset-2 hover:text-brand-200">
          {label}
        </a>
      );
    } else out.push(<em key={key}>{tok.slice(1, -1)}</em>);
    last = m.index + tok.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export const Markdown: React.FC<{ text: string }> = ({ text }) => {
  const lines = (text || '').replace(/\r/g, '').split('\n');
  const blocks: React.ReactNode[] = [];
  let i = 0;
  let k = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.trim().startsWith('```')) {
      const code: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) code.push(lines[i++]);
      i++;
      blocks.push(
        <pre key={k++} className="my-2 p-3 rounded-xl bg-black/40 border border-white/[0.06] overflow-x-auto text-xs font-mono text-slate-200">
          {code.join('\n')}
        </pre>
      );
      continue;
    }

    const heading = /^(#{1,4})\s+(.*)$/.exec(line);
    if (heading) {
      blocks.push(
        <p key={k++} className="mt-3 first:mt-0 mb-1 font-bold text-white">
          {inline(heading[2], `h${k}`)}
        </p>
      );
      i++;
      continue;
    }

    if (/^\s*([-*•]|\d+[.)])\s+/.test(line)) {
      const ordered = /^\s*\d+[.)]/.test(line);
      const items: string[] = [];
      while (i < lines.length && /^\s*([-*•]|\d+[.)])\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*([-*•]|\d+[.)])\s+/, ''));
        i++;
      }
      const ListTag = ordered ? 'ol' : 'ul';
      blocks.push(
        <ListTag key={k++} className={`my-1.5 pl-5 space-y-1 ${ordered ? 'list-decimal' : 'list-disc'} marker:text-brand-400`}>
          {items.map((it, j) => (
            <li key={j}>{inline(it, `l${k}-${j}`)}</li>
          ))}
        </ListTag>
      );
      continue;
    }

    if (!line.trim()) {
      i++;
      continue;
    }

    // paragraph: consecutive non-special lines
    const para: string[] = [];
    while (i < lines.length && lines[i].trim() && !/^(#{1,4}\s|```|\s*([-*•]|\d+[.)])\s+)/.test(lines[i])) para.push(lines[i++]);
    blocks.push(
      <p key={k++} className="my-1.5 first:mt-0 last:mb-0">
        {para.map((p, j) => (
          <React.Fragment key={j}>
            {j > 0 && <br />}
            {inline(p, `p${k}-${j}`)}
          </React.Fragment>
        ))}
      </p>
    );
  }

  return <div className="break-words">{blocks}</div>;
};

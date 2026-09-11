function renderInline(text: string) {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("`") && part.endsWith("`")) {
      return <code key={i}>{part.slice(1, -1)}</code>;
    }
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
}

export function MarkdownView({ markdown }: { markdown: string }) {
  const blocks = markdown.split(/\n{2,}/);
  return (
    <div className="prose-ssot">
      {blocks.map((block, i) => {
        const lines = block.split("\n");
        if (lines[0].startsWith("# ")) return <h1 key={i}>{lines[0].slice(2)}</h1>;
        if (lines[0].startsWith("## ")) return <h2 key={i}>{lines[0].slice(3)}</h2>;
        if (lines[0].startsWith("### ")) return <h3 key={i}>{lines[0].slice(4)}</h3>;
        if (lines[0].startsWith("> ")) return <blockquote key={i}>{lines.map((l) => l.replace(/^>\s?/, "")).join(" ")}</blockquote>;
        if (lines[0].startsWith("|")) {
          const rows = lines.filter((l) => l.includes("|") && !/^\|?\s*-+/.test(l));
          return (
            <table key={i}>
              <tbody>
                {rows.map((row, ri) => (
                  <tr key={ri}>
                    {row
                      .split("|")
                      .filter(Boolean)
                      .map((cell, ci) =>
                        ri === 0 ? <th key={ci}>{cell.trim()}</th> : <td key={ci}>{cell.trim()}</td>,
                      )}
                  </tr>
                ))}
              </tbody>
            </table>
          );
        }
        if (lines.every((l) => l.startsWith("- "))) {
          return (
            <ul key={i}>
              {lines.map((l, li) => (
                <li key={li}>{renderInline(l.slice(2))}</li>
              ))}
            </ul>
          );
        }
        return (
          <p key={i}>
            {lines.map((l, li) => (
              <span key={li}>
                {renderInline(l)}
                {li < lines.length - 1 && <br />}
              </span>
            ))}
          </p>
        );
      })}
    </div>
  );
}

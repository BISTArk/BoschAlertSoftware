/**
 * Simple Markdown Text Renderer
 * Renders basic markdown formatting: bold, italic, bullets
 */

interface MarkdownTextProps {
  text: string;
  className?: string;
}

export function MarkdownText({ text, className = "" }: MarkdownTextProps) {
  // Process the text to handle markdown
  const processMarkdown = (input: string): React.ReactNode[] => {
    const parts: React.ReactNode[] = [];

    // Split by lines to handle bullets
    const lines = input.split('\n');
    
    lines.forEach((line, lineIndex) => {
      // Check if line is a bullet point
      const bulletMatch = line.match(/^[\s]*[-•]\s+(.+)$/);
      if (bulletMatch) {
        parts.push(
          <div key={`line-${lineIndex}`} className="flex gap-2 ml-2">
            <span className="text-muted-foreground">•</span>
            <span>{processInlineMarkdown(bulletMatch[1])}</span>
          </div>
        );
        return;
      }

      // Process regular line with inline formatting
      if (line.trim()) {
        parts.push(
          <span key={`line-${lineIndex}`}>
            {processInlineMarkdown(line)}
            {lineIndex < lines.length - 1 && <br />}
          </span>
        );
      } else if (lineIndex < lines.length - 1) {
        parts.push(<br key={`br-${lineIndex}`} />);
      }
    });

    return parts;
  };

  // Process inline markdown (bold, italic)
  const processInlineMarkdown = (text: string): React.ReactNode[] => {
    const parts: React.ReactNode[] = [];
    let remaining = text;
    let key = 0;

    while (remaining.length > 0) {
      // Look for **bold**
      const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
      if (boldMatch && boldMatch.index !== undefined) {
        // Add text before bold
        if (boldMatch.index > 0) {
          parts.push(
            <span key={`text-${key++}`}>
              {remaining.substring(0, boldMatch.index)}
            </span>
          );
        }
        // Add bold text
        parts.push(
          <strong key={`bold-${key++}`} className="font-bold text-foreground">
            {boldMatch[1]}
          </strong>
        );
        remaining = remaining.substring(boldMatch.index + boldMatch[0].length);
        continue;
      }

      // Look for *italic*
      const italicMatch = remaining.match(/\*(.+?)\*/);
      if (italicMatch && italicMatch.index !== undefined) {
        // Add text before italic
        if (italicMatch.index > 0) {
          parts.push(
            <span key={`text-${key++}`}>
              {remaining.substring(0, italicMatch.index)}
            </span>
          );
        }
        // Add italic text
        parts.push(
          <em key={`italic-${key++}`} className="italic">
            {italicMatch[1]}
          </em>
        );
        remaining = remaining.substring(italicMatch.index + italicMatch[0].length);
        continue;
      }

      // No more markdown, add remaining text
      parts.push(<span key={`text-${key++}`}>{remaining}</span>);
      break;
    }

    return parts;
  };

  return <div className={className}>{processMarkdown(text)}</div>;
}

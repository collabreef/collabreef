/**
 * Extract plain text from TipTap JSON content
 */
export const extractTextFromTipTapJSON = (content: string): string => {
  if (!content) return '';

  try {
    const json = JSON.parse(content);
    return extractTextFromNode(json);
  } catch (e) {
    // If parsing fails, return empty string
    return '';
  }
};

/**
 * Recursively extract text from TipTap JSON nodes
 */
const extractTextFromNode = (node: any): string => {
  if (!node) return '';

  // If node has text property, return it
  if (node.text) {
    return node.text;
  }

  // If node has content array, process each child
  if (node.content && Array.isArray(node.content)) {
    return node.content.map((child: any) => extractTextFromNode(child)).join('');
  }

  return '';
};

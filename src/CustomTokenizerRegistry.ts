type Tokenizer = (code: string) => Promise<Iterable<Token>> | Iterable<Token>;

interface Token {
  type: string;
  startOffset: number;
  endOffset: number;
}

const resolver = new WeakMap<
  Promise<Tokenizer>,
  (tokenizer: Tokenizer) => void
>();

class CustomTokenizerRegistry {
  #map = new Map<string, Tokenizer>();
  #reverseMap = new Map<Tokenizer, string>();

  define(name: string, tokenizer: Tokenizer): void {
    this.#map.set(name, tokenizer);
    this.#reverseMap.set(tokenizer, name);
  }

  get(name: string): Tokenizer | undefined {
    return this.#map.get(name);
  }

  getName(tokenizer: Tokenizer): string | undefined {
    return this.#reverseMap.get(tokenizer);
  }
}

function tokenizeJavaScript(source: string) {
  const tokens: Token[] = [];
  let offset = 0;

  const regexPatterns = [
    { type: "comment", regex: /\/\/.*|\/\*[\s\S]*?\*\//y },
    {
      type: "keyword",
      regex:
        /\b(?:if|else|while|for|function|class|const|let|var|return|switch|case|break|continue)\b/y,
    },
    { type: "string", regex: /(['"])(?:\\.|(?!\1)[^\\])*\1/y },
    { type: "method", regex: /\.[\w$]+/y },
    { type: "varname", regex: /\b[a-zA-Z_$][\w$]*\b/y },
    { type: "number", regex: /\b\d+(\.\d+)?\b/y },
    { type: "boolean", regex: /\b(?:true|false)\b/y },
    { type: "regex", regex: /\/(?!\/)(?:\\.|[^/])+\//y },
  ];

  while (offset < source.length) {
    let tokenFound = false;
    for (const { type, regex } of regexPatterns) {
      regex.lastIndex = offset;
      const match = regex.exec(source);
      if (match && match.index === offset) {
        tokens.push({
          type,
          startOffset: offset,
          endOffset: offset + match[0].length - 1,
        });
        offset += match[0].length;
        tokenFound = true;
        break;
      }
    }
    if (!tokenFound) {
      // If no match was found, skip one character ahead
      offset++;
    }
  }

  return tokens;
}

const customTokenizers = new CustomTokenizerRegistry();
customTokenizers.define("js", tokenizeJavaScript);
customTokenizers.define("javascript", tokenizeJavaScript.bind(undefined));

export { customTokenizers };
export type { Tokenizer, Token };

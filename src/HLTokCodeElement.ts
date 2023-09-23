import { customTokenizers, Token } from "./CustomTokenizerRegistry.js";

const tokenizeJavaScript = customTokenizers.get("js")!;

export default class HLTokCodeElement extends HTMLElement {
  #internals: ElementInternals;
  #tokenizationP: Promise<Iterable<Token>> | undefined;

  constructor() {
    super();

    this.#internals = this.attachInternals();
    this.attachShadow({ mode: "closed" });

    const mo = new MutationObserver(() => {
      this.#textChangedCallback();
    });
    mo.observe(this, { characterData: true });
  }

  connectedCallback() {
    this.#textChangedCallback();
  }

  #getText() {
    return [...this.childNodes]
      .filter((x) => x.nodeType === Node.TEXT_NODE)
      .map((x) => x.textContent)
      .join("");
  }

  #textChangedCallback() {
    const text = this.#getText();
    this.#internals.shadowRoot!.textContent = text;
    const p = this.#tokenize(text);
    p.then((tokens) => {
      if (p === this.#tokenizationP) {
        this.#applyTokens(tokens);
      }
    });
    this.#tokenizationP = p;
  }

  async #tokenize(code: string): Promise<Iterable<Token>> {
    return tokenizeJavaScript(code);
  }

  #applyTokens(tokens: Iterable<Token>) {
    const reversedTokens = [...tokens].reverse();
    for (const { type, startOffset, endOffset } of reversedTokens) {
      const range = new Range();
      range.setStart(this.#internals.shadowRoot!.firstChild!, startOffset);
      range.setEnd(this.#internals.shadowRoot!.firstChild!, endOffset + 1);
      const span = document.createElement("span");
      span.setAttribute("part", type);
      range.surroundContents(span);
    }
  }
}

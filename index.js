function getJavaScriptTokens(source) {
  const tokens = [];
  let token = "";
  let state = "start";
  let start = 0;

  for (let i = 0; i < source.length; i++) {
    const char = source[i];

    switch (state) {
      case "start":
        if (/\s/.test(char)) {
          state = "whitespace";
        } else if (char === "/" && source[i + 1] === "/") {
          state = "lineComment";
        } else if (char === "/" && source[i + 1] === "*") {
          state = "blockComment";
        } else if (char === '"' || char === "'") {
          state = "string";
          token += char;
          start = i;
        } else if (
          char === "/" ||
          char === "+" ||
          char === "-" ||
          char === "*" ||
          char === "%" ||
          char === "&" ||
          char === "|" ||
          char === "^" ||
          char === "=" ||
          char === "<" ||
          char === ">" ||
          char === "!" ||
          char === "?" ||
          char === ":" ||
          char === ";" ||
          char === "," ||
          char === "." ||
          char === "(" ||
          char === ")" ||
          char === "{" ||
          char === "}" ||
          char === "[" ||
          char === "]"
        ) {
          tokens.push([char, i, i]);
        } else {
          state = "word";
          token += char;
          start = i;
        }
        break;

      case "whitespace":
        if (!/\s/.test(char)) {
          state = "start";
          i--; // Reprocess this character in the "start" state
        }
        break;

      case "lineComment":
        if (char === "\n" || char === "\r") {
          state = "start";
        }
        break;

      case "blockComment":
        if (char === "*" && source[i + 1] === "/") {
          state = "start";
          i++; // Skip the closing '*/' character
        }
        break;

      case "string":
        token += char;
        if ((char === '"' || char === "'") && source[i - 1] !== "\\") {
          tokens.push([token, start, i]);
          token = "";
          state = "start";
        }
        break;

      case "word":
        if (!/[a-zA-Z0-9_$]/.test(char)) {
          tokens.push([token, start, i - 1]);
          token = "";
          state = "start";
          i--; // Reprocess this character in the "start" state
        } else {
          token += char;
        }
        break;
    }
  }

  return tokens;
}

const code = document.querySelector("#code");
const tokens = getJavaScriptTokens(code.textContent);
const postApplicators = [];
for (const [token, start, end] of tokens) {
  const range = new Range();
  range.setStart(code.firstChild, start);
  range.setEnd(code.firstChild, end + 1);
  postApplicators.push(() => {
    const span = document.createElement("span");
    span.className = token;
    // if (range.commonAncestorContainer.lastElementChild) {
    //   range.setStartAfter(range.commonAncestorContainer.lastElementChild);
    // }
    range.surroundContents(span);
  });
}
for (const applicator of postApplicators.reverse()) {
  applicator();
}

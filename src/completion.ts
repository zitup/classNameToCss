import * as fs from "fs";
import * as vscode from "vscode";
const path = require('path');

const extensionArray: string[] = ["htm", "html", "jsx", "tsx"];
const htmMatchRegex = /class=["'][\w- ]+["']/g;
const sxMatchRegex = /className=["'][\w- ]+["']/g;
const fileSep = path.sep;

/**
 * @param {*} document
 * @param {*} position
 * @param {*} token
 * @param {*} context
 */
function provideCompletionItems(
  document: vscode.TextDocument,
  position: vscode.Position,
) {
  const typeText = document
    .lineAt(position)
    .text.substring(position.character - 1, position.character);
  if (typeText !== ".") {
    return;
  }
  // current file path
  const filePath: string = document.fileName;

  let classNames: string[] = [];
  // vue
  if (document.languageId === "vue") {
    classNames = getClass(filePath);
  }
  // css-like file
  else {
    // current dir path
    const dir: string = filePath.slice(0, filePath.lastIndexOf(fileSep));
    // current dir files
    const files: string[] = fs.readdirSync(dir);
    // filter target file
    const target: string[] = files.filter((item: string) =>
      extensionArray.includes(item.split(".")[1])
    );
    // get target files class name
    target.forEach((item: string) => {
      const filePath = `${dir}${fileSep}${item}`;
      const fileClass = getClass(filePath);
      classNames = classNames.concat(fileClass);
    });
  }

  classNames = classNames.reduce((arr, ele) => {
    const className: string = ele.split("=")[1];
    // remove the quotes
    const field: string = className.slice(1, className.length - 1);
    // handle multi class name
    if (ele.includes(" ")) {
      return arr.concat(field.split(" "));
    } else {
      arr.push(field);
      return arr;
    }
  }, [] as string[]);

  // de-duplication
  classNames = [...new Set(classNames)];

  return classNames.map((ele: string) => {
    return new vscode.CompletionItem(
      // intelliSense content need include trigger operator
      // https://github.com/Microsoft/vscode/issues/71662
      document.languageId === "vue" ? `${ele}` : `.${ele}`,
      vscode.CompletionItemKind.Text
    );
  });
}

function getClass(path: string) {
  const data: string = fs.readFileSync(path, "utf8").split("\n").join("");

  let result;
  // htm/html/vue use class
  if (path.includes("htm") || path.includes("vue")) {
    result = data.match(htmMatchRegex);
  }
  // tsx/jsx use className
  if (path.includes("sx")) {
    result = data.match(sxMatchRegex);
  }
  return result || [];
}

/**
 * @param {*} item
 * @param {*} token
 */
function resolveCompletionItem() {
  return null;
}

export default function (context: vscode.ExtensionContext): void {
  // trigger only when type dot
  context.subscriptions.push(
    vscode.languages.registerCompletionItemProvider(
      [
        { scheme: "file", language: "css" },
        { scheme: "file", language: "less" },
        { scheme: "file", language: "scss" },
        { scheme: "file", language: "sass" },
        { scheme: "file", language: "stylus" },
        { scheme: "file", language: "vue" },
      ],
      {
        provideCompletionItems,
        resolveCompletionItem,
      },
      "."
    )
  );
}

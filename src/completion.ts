import * as fs from "fs";
import * as vscode from "vscode";

const fileExtensionArray: string[] = ["htm", "html", "jsx", "tsx"];
const htmMatchRegex: RegExp = /class="[\w-]+"/g;
const sxMatchRegex: RegExp = /className="[\w-]+"/g;

/**
 * @param {*} document
 * @param {*} position
 * @param {*} token
 * @param {*} context
 */
function provideCompletionItems(
  document: vscode.TextDocument,
  _position: vscode.Position,
  _token: vscode.CancellationToken,
  _context: vscode.CompletionContext
) {
  /**
   * 获取当前目录目标文件——htm/html/tsx/jsx
   */
  const filePath: string = document.fileName;
  const dir: string = filePath.slice(0, filePath.lastIndexOf("/"));
  // ['1.file', '2.tsx', '3.html']
  const files: string[] = fs.readdirSync(dir);
  // 筛选目标文件
  // ['tsx', 'html']
  const target: string[] = files.filter((item: string) =>
    fileExtensionArray.includes(item.split(".")[1])
  );
  // 读取目标文件，获取class
  // ['className="a"', 'class="b"']
  let classNames: string[] = [];
  target.forEach((item: string) => {
    const data: string = fs
      .readFileSync(`${dir}/${item}`, "utf8")
      .split("\n")
      .join("");

    // htm/html-->class
    if (item.includes("htm")) {
      const result = data.match(htmMatchRegex);
      if (result) {
        classNames = classNames.concat(result);
      }
    }
    // tsx/jsx-->className
    if (item.includes("sx")) {
      const result = data.match(sxMatchRegex);
      if (result) {
        classNames = classNames.concat(result);
      }
    }
  });

  return classNames.map((item: string) => {
    // ['"a"']
    const className: string = item.split("=")[1];
    const field: string = className.slice(1, className.length - 1);
    return new vscode.CompletionItem(
      // 提示内容要带上触发字符，https://github.com/Microsoft/vscode/issues/71662
      `.${field}`,
      vscode.CompletionItemKind.Field
    );
  });
}

/**
 * @param {*} item
 * @param {*} token
 */
function resolveCompletionItem() {
  return null;
}

export default function(context: vscode.ExtensionContext) {
  // 注册代码建议提示，只有当按下“.”时才触发
  context.subscriptions.push(
    vscode.languages.registerCompletionItemProvider(
      [
        { scheme: "file", language: "css" },
        { scheme: "file", language: "less" },
        { scheme: "file", language: "scss" }
      ],
      {
        provideCompletionItems,
        resolveCompletionItem
      },
      "."
    )
  );
}

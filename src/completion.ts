import * as fs from "fs";
import * as vscode from "vscode";

const extensionArray: string[] = ["htm", "html", "jsx", "tsx", "js"];
const htmMatchRegex: RegExp = /class="[\w- ]+"/g;
const sxMatchRegex: RegExp = /className="[\w- ]+"/g;

/**
 * @param {*} document
 * @param {*} position
 * @param {*} token
 * @param {*} context
 */
function provideCompletionItems(
  document: vscode.TextDocument,
  position: vscode.Position,
  _token: vscode.CancellationToken,
  _context: vscode.CompletionContext
) {
  const typeText = document
    .lineAt(position)
    .text.substring(position.character - 1, position.character);
  if (typeText !== ".") {
    return;
  }
  // 获取当前文件路径
  const filePath: string = document.fileName;

  let classNames: string[] = [];
  // 在vue文件触发
  if (document.languageId === "vue") {
    // 读取当前文件
    classNames = getClass(filePath);
  }
  // 在css类文件触发
  else {
    // 获取当前文件夹路径
    const dir: string = filePath.slice(0, filePath.lastIndexOf("/"));
    // 读取当前文件夹下的文件名
    const files: string[] = fs.readdirSync(dir);
    // 筛选目标文件
    const target: string[] = files.filter((item: string) =>
      extensionArray.includes(item.split(".")[1])
    );
    // 读取目标文件，获取class
    target.forEach((item: string) => {
      const filePath: string = `${dir}/${item}`;
      classNames = getClass(filePath);
    });
  }

  classNames = classNames.reduce((arr, ele) => {
    const className: string = ele.split("=")[1];
    // 去掉引号
    const field: string = className.slice(1, className.length - 1);
    // 处理多class情况
    if (ele.includes(" ")) {
      return arr.concat(field.split(" "));
    } else {
      arr.push(field);
      return arr;
    }
  }, [] as string[]);

  return classNames.map((ele: string) => {
    return new vscode.CompletionItem(
      // 提示内容要带上触发字符，https://github.com/Microsoft/vscode/issues/71662
      `.${ele}`,
      vscode.CompletionItemKind.Text
    );
  });
}

function getClass(path: string) {
  const data: string = fs
    .readFileSync(path, "utf8")
    .split("\n")
    .join("");

  let result;
  // htm/html/vue-->class
  if (path.includes("htm") || path.includes("vue")) {
    result = data.match(htmMatchRegex);
  }
  // tsx/jsx-->className
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

export default function(context: vscode.ExtensionContext) {
  // 注册代码建议提示，只有当按下“.”时才触发
  context.subscriptions.push(
    vscode.languages.registerCompletionItemProvider(
      [
        { scheme: "file", language: "css" },
        { scheme: "file", language: "less" },
        { scheme: "file", language: "scss" },
        { scheme: "file", language: "sass" },
        { scheme: "file", language: "stylus" },
        { scheme: "file", language: "vue" }
      ],
      {
        provideCompletionItems,
        resolveCompletionItem
      },
      "."
    )
  );
}

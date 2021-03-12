import * as vscode from "vscode";
import completion from "./completion";

export function activate(context: vscode.ExtensionContext): void {
  completion(context);
}

// this method is called when your extension is deactivated
// export function deactivate() {}

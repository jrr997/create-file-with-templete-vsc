import * as vscode from 'vscode';
import { handleFile } from './handleFile';

const defaultExcludes = ['^node_modules', '^\\.'];

export function activate(context: vscode.ExtensionContext) {
  const config = vscode.workspace.getConfiguration('createTemplateFile');
  let templateDir = config.get('templateDir') as string;
  let templateConfig = config.get('template') as { [key: string]: string[] };
  let excludes = config.get('excludes') as string[];

  let disposable = vscode.workspace.onDidCreateFiles(async (e) => {
    if (e.files.length > 1) {
      return;
    }
    for (const uri of e.files) {
      const relativePath = vscode.workspace.asRelativePath(uri);

      const isExcluded = [...(excludes ?? []), ...defaultExcludes].some(
        (pattern) => {
          const reg = new RegExp(pattern as string);
          return reg.test(relativePath);
        }
      );
      if (isExcluded) {
        continue;
      }

      const stat = await vscode.workspace.fs.stat(uri);

      const isFile = stat.type === vscode.FileType.File;
      if (!isFile) {
        continue;
      }

      const isEmpty = stat.size === 0;
      if (!isEmpty) {
        continue;
      }

      const suffix = relativePath.split('/').pop();
      const [fileName, ext] = suffix?.split('.') ?? [];

      handleFile(uri, { ext, fileName, templateDir, templateConfig });
    }

    context.subscriptions.push(
      vscode.workspace.onDidChangeConfiguration((e) => {
        if (e.affectsConfiguration('createTemplateFile.templateDir')) {
          const newTemplateDir = vscode.workspace
            .getConfiguration('createTemplateFile')
            .get('templateDir') as string;
          if (newTemplateDir !== templateDir) {
            templateDir = newTemplateDir;
          }
        }
        if (e.affectsConfiguration('createTemplateFile.template')) {
          const newTemplateConfig = vscode.workspace
            .getConfiguration('createTemplateFile')
            .get('template') as { [key: string]: string[] };
          templateConfig = newTemplateConfig;
        }
        if (e.affectsConfiguration('createTemplateFile.excludes')) {
          const newExcludes = vscode.workspace
            .getConfiguration('createTemplateFile')
            .get('excludes') as string[];
          excludes = newExcludes;
        }
      })
    );
  });

  context.subscriptions.push(disposable);
}

import * as vscode from 'vscode';
import { IExtraInfo, ITemplates } from './types';
const path = require('path');
const fs = require('fs');
const ejs = require('ejs');

export const handleFile = (
  uri: vscode.Uri,
  { ext, fileName, templateDir, templateConfig }: IExtraInfo
) => {
  const normalizedPath = path.normalize(uri.fsPath);
  const tplManager = new TemplateManager(templateConfig, templateDir);
  const tplPath = tplManager.findTemplate(normalizedPath!);

  if (!tplPath) {
    return;
  }

  const content = fs.readFileSync(tplPath, 'utf-8');
  const edit = new vscode.WorkspaceEdit();
  const paths = normalizedPath.split(path.sep);
  edit.insert(
    uri,
    new vscode.Position(0, 0),
    ejs.render(content, {
      paths,
      fileName,
      ext,
      normalizedPath,
      FileName: fileName!.charAt(0).toUpperCase() + fileName.slice(1),
    })
  );

  vscode.workspace.applyEdit(edit);
};

class TemplateManager {
  private internalTemplates: ITemplates = {
    ['tsx.tpl']: [`\.tsx$`],
    ['jsx.tpl']: [`\.jsx$`],
    ['js.tpl']: [`\.(js|ts)$`],
  };
  private userTemplates: ITemplates = {};
  private templateDir: string = '';

  private _findTemplate(
    normalizedPath: string,
    templates: ITemplates,
    templateDir: string
  ) {
    for (const [key, value] of Object.entries(templates)) {
      for (const pattern of value) {
        const reg = new RegExp(pattern as string);
        if (reg.test(normalizedPath)) {
          return path.resolve(templateDir, key);
        }
      }
    }
    return '';
  }

  constructor(userTemplates?: ITemplates, templateDir?: string) {
    this.userTemplates = userTemplates ?? {};
    this.templateDir = templateDir ?? '';
  }

  public findTemplate(normalizedPath: string) {
    return (
      this._findTemplate(
        normalizedPath,
        this.userTemplates,
        this.templateDir
      ) ||
      this._findTemplate(
        normalizedPath,
        this.internalTemplates,
        path.join(__dirname, 'template')
      )
    );
  }
}

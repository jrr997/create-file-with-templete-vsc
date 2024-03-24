export interface IExtraInfo {
  ext?: string;
  fileName: string;
  templateDir?: string,
  templateConfig?: ITemplates,
}

export interface ITemplates {
  [key: string]: (RegExp | string)[];
}
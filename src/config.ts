// src/config.ts
import { read, write, tsGitPath } from "./files.js";
import { lines, setIn } from "./util.js";


export const strToObj = (str: string): Record<string, any> => { /* parse ini → object */ 
  const result: Record<string, any> = {};
  let currentSection: string[] = [];

  for (const line of lines(str)) {
    const subsectionMatch = line.match(/^\[(\w+)\s+"([^"]+)"\]$/);
    const sectionMatch    = line.match(/^\[(\w+)\]$/);
    const kvMatch         = line.match(/^\s*(\w+)\s*=\s*(.+)$/);

    if (subsectionMatch) {
      currentSection = [subsectionMatch[1], subsectionMatch[2]];
    } else if (sectionMatch) {
      currentSection = [sectionMatch[1]];
    } else if (kvMatch) {
      setIn(result, [...currentSection, kvMatch[1], kvMatch[2].trim()]);
    }
  }

  return result;
};
export const objToStr = (obj: Record<string, any>): string => { /* object → ini string */ 
    const lines: string[] = [];

  for (const [section, sectionVal] of Object.entries(obj)) {
    const hasSubsections = Object.values(sectionVal).some(v => typeof v === "object");

    if (hasSubsections) {
      for (const [sub, subVal] of Object.entries(sectionVal)) {
        lines.push(`[${section} "${sub}"]`);
        for (const [k, v] of Object.entries(subVal as Record<string, string>)) {
          lines.push(`    ${k} = ${v}`);
        }
      }
    } else {
      lines.push(`[${section}]`);
      for (const [k, v] of Object.entries(sectionVal)) {
        lines.push(`    ${k} = ${v}`);
      }
    }
  }

  return lines.join("\n");
};
export const readConfig = (): Record<string, any> => {
    const tsDir=tsGitPath("config");
    const content = read(tsDir);
    return strToObj(content);

 };
export const writeConfig = (config: Record<string, any>): void => { 
    const tsDir = tsGitPath("config");
    const contentConfig = objToStr(config);
    write(tsDir,contentConfig);
    /* write .tsgit/config */ };
export const isBare = (): boolean => { /* check core.bare */
return readConfig().core?.bare === "true"}
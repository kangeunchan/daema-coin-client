import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import prettier from "prettier";
import type { Options as PrettierOptions } from "prettier";
import StyleDictionary from "style-dictionary";
import { transformGroups } from "style-dictionary/enums";
import { z } from "zod";

type JsonObject = Record<string, unknown>;
type ThemeName = "light" | "dark";
type TokenRecord = {
  filePath: string;
  path: string[];
  type: string;
  value: unknown;
};
type TransformedToken = {
  $value?: unknown;
  original?: {
    $value?: unknown;
  };
  filePath?: string;
  name: string;
  path: string[];
};

const packageRoot = process.cwd();
const checkMode = process.argv.includes("--check");
const generatedDir = path.join(packageRoot, "src/generated");
const generatedCssDir = path.join(generatedDir, "css");
const primitiveFile = "src/tokens/primitives.json";
const componentFile = "src/tokens/components.json";
const themeFiles: Record<ThemeName, string> = {
  light: "src/tokens/themes/light.json",
  dark: "src/tokens/themes/dark.json",
};
const themeNames = Object.keys(themeFiles) as ThemeName[];
const metadataKeys = new Set(["$schema", "$description", "$extensions", "$type"]);
const allowedTokenTypes = new Set([
  "color",
  "cubicBezier",
  "dimension",
  "duration",
  "fontFamily",
  "fontWeight",
  "number",
  "shadow",
]);
const aliasPattern = /\{([^}]+)\}/g;
const jsonObjectSchema = z.record(z.string(), z.unknown());

function assertJsonObject(value: unknown, filePath: string): JsonObject {
  const result = jsonObjectSchema.safeParse(value);

  if (!result.success) {
    throw new Error(`${filePath} must contain a JSON object at the root.`);
  }

  return result.data;
}

async function readTokenFile(filePath: string) {
  const source = await readFile(path.join(packageRoot, filePath), "utf8");
  return assertJsonObject(JSON.parse(source), filePath);
}

function isObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function deepMerge(target: JsonObject, source: JsonObject): JsonObject {
  const output = { ...target };

  for (const [key, value] of Object.entries(source)) {
    const existing = output[key];
    output[key] = isObject(existing) && isObject(value) ? deepMerge(existing, value) : value;
  }

  return output;
}

function validateTokenName(name: string, filePath: string, tokenPath: string[]) {
  if (name.length === 0 || /[{}$]/u.test(name)) {
    throw new Error(
      `${filePath} contains an invalid token name at ${[...tokenPath, name].join(".")}.`,
    );
  }
}

function flattenTokens(
  filePath: string,
  node: JsonObject,
  tokenPath: string[] = [],
  inheritedType?: string,
): TokenRecord[] {
  const localType = typeof node.$type === "string" ? node.$type : inheritedType;

  if ("$value" in node) {
    if (!localType) {
      throw new Error(`${filePath} token ${tokenPath.join(".")} is missing $type.`);
    }

    if (!allowedTokenTypes.has(localType)) {
      throw new Error(
        `${filePath} token ${tokenPath.join(".")} has unsupported $type ${localType}.`,
      );
    }

    return [
      {
        filePath,
        path: tokenPath,
        type: localType,
        value: node.$value,
      },
    ];
  }

  return Object.entries(node).flatMap(([key, value]) => {
    if (metadataKeys.has(key)) {
      return [];
    }

    validateTokenName(key, filePath, tokenPath);

    if (!isObject(value)) {
      throw new Error(`${filePath} group ${[...tokenPath, key].join(".")} must be an object.`);
    }

    return flattenTokens(filePath, value, [...tokenPath, key], localType);
  });
}

function findAliases(value: unknown): string[] {
  if (typeof value === "string") {
    return [...value.matchAll(aliasPattern)]
      .map((match) => match[1])
      .filter((alias): alias is string => typeof alias === "string" && alias.length > 0);
  }

  if (Array.isArray(value)) {
    return value.flatMap(findAliases);
  }

  if (isObject(value)) {
    return Object.values(value).flatMap(findAliases);
  }

  return [];
}

async function validateTokenGraph(themeName: ThemeName) {
  const files = [primitiveFile, themeFiles[themeName], componentFile];
  const tokenFiles = await Promise.all(
    files.map(async (filePath) => ({
      filePath,
      content: await readTokenFile(filePath),
    })),
  );
  const mergedTokens = tokenFiles.reduce<JsonObject>(
    (merged, tokenFile) => deepMerge(merged, tokenFile.content),
    {},
  );
  const tokenRecords = flattenTokens(`${themeName} token graph`, mergedTokens);
  const tokenPaths = new Set(tokenRecords.map((token) => token.path.join(".")));

  for (const token of tokenRecords) {
    for (const alias of findAliases(token.value)) {
      if (!tokenPaths.has(alias)) {
        throw new Error(
          `${token.filePath} token ${token.path.join(".")} references missing token ${alias}.`,
        );
      }
    }
  }
}

async function getThemeDictionary(themeName: ThemeName) {
  const styleDictionary = new StyleDictionary({
    source: [primitiveFile, themeFiles[themeName], componentFile],
    platforms: {
      web: {
        transformGroup: transformGroups.css,
        prefix: "daema",
      },
    },
  });

  await styleDictionary.init();
  return styleDictionary.getPlatformTokens("web");
}

function toKebab(value: string) {
  return value
    .replace(/([a-z0-9])([A-Z])/gu, "$1-$2")
    .replace(/[^a-zA-Z0-9]+/gu, "-")
    .replace(/^-|-$/gu, "")
    .toLowerCase();
}

function tokenPathKey(tokenPath: string[]) {
  return tokenPath.join(".");
}

function cssVarNameForPath(tokenPath: string[]) {
  return `--daema-${tokenPath.map(toKebab).join("-")}`;
}

function cssVarNameForReference(reference: string) {
  return cssVarNameForPath(reference.split("."));
}

function stringifyCssValue(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number") {
    return String(value);
  }

  if (typeof value === "boolean") {
    return String(value);
  }

  if (value === null || value === undefined) {
    return "";
  }

  return JSON.stringify(value);
}

function containsAlias(value: string) {
  aliasPattern.lastIndex = 0;
  const result = aliasPattern.test(value);
  aliasPattern.lastIndex = 0;
  return result;
}

function outputValueForToken(token: TransformedToken) {
  const originalValue = token.original?.$value;

  if (typeof originalValue === "string" && !containsAlias(originalValue)) {
    return originalValue;
  }

  return token.$value;
}

function cssValueForToken(token: TransformedToken) {
  const originalValue = token.original?.$value;

  if (typeof originalValue === "string" && containsAlias(originalValue)) {
    return originalValue.replace(aliasPattern, (_, reference: string) => {
      return `var(${cssVarNameForReference(reference)})`;
    });
  }

  aliasPattern.lastIndex = 0;
  return stringifyCssValue(outputValueForToken(token));
}

function isThemeScopedToken(token: TransformedToken) {
  return token.filePath !== primitiveFile;
}

function formatCssBlock(selector: string, tokens: TransformedToken[], colorScheme?: ThemeName) {
  const declarations = [
    colorScheme ? `  color-scheme: ${colorScheme};` : undefined,
    ...tokens.map((token) => `  ${cssVarNameForPath(token.path)}: ${cssValueForToken(token)};`),
  ].filter(Boolean);

  return `${selector} {\n${declarations.join("\n")}\n}`;
}

function tailwindVarNameForToken(token: TransformedToken) {
  const [category, ...parts] = token.path;

  if (!category) {
    return undefined;
  }

  if (category === "color") {
    if (parts[0] === "palette") {
      return `--color-daema-${parts.slice(1).map(toKebab).join("-")}`;
    }

    return `--color-${parts.map(toKebab).join("-")}`;
  }

  if (category === "space") {
    return `--spacing-${parts.map(toKebab).join("-")}`;
  }

  if (category === "radius") {
    return `--radius-${parts.map(toKebab).join("-")}`;
  }

  if (category === "shadow") {
    return `--shadow-${parts.map(toKebab).join("-")}`;
  }

  if (category === "font" && parts[0] === "family") {
    return `--font-${parts.slice(1).map(toKebab).join("-")}`;
  }

  if (category === "font" && parts[0] === "size") {
    return `--text-${parts.slice(1).map(toKebab).join("-")}`;
  }

  if (category === "font" && parts[0] === "weight") {
    return `--font-weight-${parts.slice(1).map(toKebab).join("-")}`;
  }

  if (category === "line" && parts[0] === "height") {
    return `--leading-${parts.slice(1).map(toKebab).join("-")}`;
  }

  if (category === "tracking") {
    return `--tracking-${parts.map(toKebab).join("-")}`;
  }

  if (category === "ease") {
    return `--ease-${parts.map(toKebab).join("-")}`;
  }

  if (category === "breakpoint") {
    return `--breakpoint-${parts.map(toKebab).join("-")}`;
  }

  if (category === "container") {
    return `--container-${parts.map(toKebab).join("-")}`;
  }

  return undefined;
}

function createRuntimeCss(lightTokens: TransformedToken[], darkTokens: TransformedToken[]) {
  return [
    "/*",
    " * Do not edit directly, this file was auto-generated by scripts/build-tokens.ts.",
    " */",
    "",
    "@layer theme {",
    indentCss(formatCssBlock(':root,\n[data-theme="light"]', lightTokens, "light")),
    "",
    indentCss(formatCssBlock('[data-theme="dark"]', darkTokens.filter(isThemeScopedToken), "dark")),
    "}",
    "",
  ].join("\n");
}

function createTailwindCss(tokens: TransformedToken[]) {
  const declarations = tokens
    .map((token) => {
      const tailwindName = tailwindVarNameForToken(token);
      return tailwindName ? `  ${tailwindName}: var(${cssVarNameForPath(token.path)});` : undefined;
    })
    .filter(Boolean);

  return [
    "/*",
    " * Do not edit directly, this file was auto-generated by scripts/build-tokens.ts.",
    " */",
    "",
    "@theme inline {",
    ...declarations,
    "}",
    "",
  ].join("\n");
}

function indentCss(css: string) {
  return css
    .split("\n")
    .map((line) => (line.length > 0 ? `  ${line}` : line))
    .join("\n");
}

function setNestedValue(target: JsonObject, keys: string[], value: unknown) {
  const [key, ...rest] = keys;

  if (!key) {
    return;
  }

  if (rest.length === 0) {
    target[key] = value;
    return;
  }

  const next = target[key];

  if (!isObject(next)) {
    target[key] = {};
  }

  setNestedValue(target[key] as JsonObject, rest, value);
}

function nestedValues(tokens: TransformedToken[]) {
  return tokens.reduce<JsonObject>((output, token) => {
    setNestedValue(output, token.path, outputValueForToken(token));
    return output;
  }, {});
}

function flatValues(tokens: TransformedToken[]) {
  return tokens.reduce<Record<string, unknown>>((output, token) => {
    output[tokenPathKey(token.path)] = outputValueForToken(token);
    return output;
  }, {});
}

function createGeneratedJson(tokensByTheme: Record<ThemeName, TransformedToken[]>) {
  const lightTokens = tokensByTheme.light;

  return `${JSON.stringify(
    {
      themes: themeNames,
      tokens: {
        light: flatValues(tokensByTheme.light),
        dark: flatValues(tokensByTheme.dark),
      },
      cssVarNames: Object.fromEntries(
        lightTokens.map((token) => [tokenPathKey(token.path), cssVarNameForPath(token.path)]),
      ),
    },
    null,
    2,
  )}\n`;
}

async function createTypeScriptApi(
  tokensByTheme: Record<ThemeName, TransformedToken[]>,
  prettierOptions: PrettierOptions,
) {
  const lightTokens = tokensByTheme.light;
  const tokenNameList = lightTokens.map((token) => tokenPathKey(token.path));
  const cssVarNameEntries = Object.fromEntries(
    lightTokens.map((token) => [tokenPathKey(token.path), cssVarNameForPath(token.path)]),
  );
  const cssVarEntries = Object.fromEntries(
    lightTokens.map((token) => [tokenPathKey(token.path), `var(${cssVarNameForPath(token.path)})`]),
  );
  const source = `
    /*
     * Do not edit directly, this file was auto-generated by scripts/build-tokens.ts.
     */

    export const themeNames = ${JSON.stringify(themeNames)} as const;
    export type ThemeName = (typeof themeNames)[number];

    export const tokenNames = ${JSON.stringify(tokenNameList)} as const;
    export type TokenName = (typeof tokenNames)[number];

    export const lightTokens = ${JSON.stringify(nestedValues(tokensByTheme.light), null, 2)} as const;
    export const darkTokens = ${JSON.stringify(nestedValues(tokensByTheme.dark), null, 2)} as const;

    export const tokensByTheme = {
      light: lightTokens,
      dark: darkTokens,
    } as const;

    export const cssVarNames = ${JSON.stringify(cssVarNameEntries, null, 2)} as const;
    export type CssVarName = (typeof cssVarNames)[TokenName];

    export const cssVars = ${JSON.stringify(cssVarEntries, null, 2)} as const;

    export function tokenVar(name: TokenName): (typeof cssVars)[TokenName] {
      return cssVars[name];
    }
  `;

  return prettier.format(source, { ...prettierOptions, parser: "typescript" });
}

async function writeOrCheck(filePath: string, content: string) {
  const absolutePath = path.join(packageRoot, filePath);

  if (checkMode) {
    let existing: string;

    try {
      existing = await readFile(absolutePath, "utf8");
    } catch {
      throw new Error(`${filePath} does not exist. Run bun run tokens:build.`);
    }

    if (existing !== content) {
      throw new Error(`${filePath} is out of date. Run bun run tokens:build.`);
    }

    return;
  }

  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, content);
}

async function main() {
  await Promise.all(themeNames.map(validateTokenGraph));

  const dictionaries = await Promise.all(
    themeNames.map(async (themeName) => {
      const dictionary = await getThemeDictionary(themeName);
      return [themeName, dictionary.allTokens as TransformedToken[]] as const;
    }),
  );
  const tokensByTheme = Object.fromEntries(dictionaries) as Record<ThemeName, TransformedToken[]>;
  const prettierOptions = (await prettier.resolveConfig(packageRoot)) ?? {};
  const runtimeCss = await prettier.format(
    createRuntimeCss(tokensByTheme.light, tokensByTheme.dark),
    {
      ...prettierOptions,
      parser: "css",
    },
  );
  const tailwindCss = await prettier.format(createTailwindCss(tokensByTheme.light), {
    ...prettierOptions,
    parser: "css",
  });
  const tokensJson = await prettier.format(createGeneratedJson(tokensByTheme), {
    ...prettierOptions,
    parser: "json",
  });

  await mkdir(generatedCssDir, { recursive: true });
  await Promise.all([
    writeOrCheck("src/generated/css/runtime.css", runtimeCss),
    writeOrCheck("src/generated/css/tailwind.css", tailwindCss),
    writeOrCheck("src/generated/tokens.json", tokensJson),
    writeOrCheck(
      "src/generated/tokens.ts",
      await createTypeScriptApi(tokensByTheme, prettierOptions),
    ),
  ]);

  const action = checkMode ? "checked" : "built";
  console.log(
    `Design tokens ${action}: ${tokensByTheme.light.length} tokens across ${themeNames.length} themes.`,
  );
}

await main();

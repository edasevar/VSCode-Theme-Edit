"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadTemplateJsonc = loadTemplateJsonc;
const fs = __importStar(require("fs"));
const jsonc_parser_1 = require("jsonc-parser");
/**
 * Parse the JSONC template:
 *  1) JSONC -> ThemeSpec
 *  2) trailing comments -> descriptions
 *  3) CAPITALIZED section headers -> flat categories (legacy)
 *  4) category tree -> Section → prefix groups (editor., statusBar., etc.)
 */
function loadTemplateJsonc(templatePath) {
    const raw = fs.readFileSync(templatePath, "utf8");
    const theme = (0, jsonc_parser_1.parse)(raw);
    const colorBlock = extractBlock(raw, /"colors"\s*:\s*{/, "colors");
    const semanticBlock = extractBlock(raw, /"semanticTokenColors"\s*:\s*{/, "semanticTokenColors");
    const descriptions = {
        ...extractTrailingComments(colorBlock),
        ...extractTrailingComments(semanticBlock)
    };
    const categories = categorizeKeys(colorBlock);
    const tree = buildTree(categories);
    return { theme, descriptions, categories, tree };
}
function extractBlock(source, startRegex, _label) {
    const startIdx = source.search(startRegex);
    if (startIdx === -1)
        return "";
    let i = startIdx;
    while (i < source.length && source[i] !== "{")
        i++;
    let depth = 0;
    let j = i;
    for (; j < source.length; j++) {
        if (source[j] === "{")
            depth++;
        else if (source[j] === "}") {
            depth--;
            if (depth === 0) {
                j++;
                break;
            }
        }
    }
    return source.slice(i, j);
}
function extractTrailingComments(block) {
    const lines = block.split(/\r?\n/);
    const map = {};
    const keyLine = /^\s*"([^"]+)"\s*:\s*.+?(?:,)?\s*(?:\/\/\s*(.+))?$/;
    for (const line of lines) {
        const m = line.match(keyLine);
        if (m) {
            const key = m[1];
            const desc = (m[2] || "").trim();
            if (desc)
                map[key] = desc;
        }
    }
    return map;
}
/** Legacy (flat) sections from comment banners. */
function categorizeKeys(colorBlock) {
    const lines = colorBlock.split(/\r?\n/);
    const result = {};
    let current = "General";
    const section = /^\s*\/\/\s*={5,}\s*$/;
    const sectionTitle = /^\s*\/\/\s*(.+?)\s*$/;
    let waitingForTitle = false;
    for (let idx = 0; idx < lines.length; idx++) {
        const line = lines[idx];
        if (section.test(line)) {
            waitingForTitle = true;
            continue;
        }
        if (waitingForTitle) {
            const m = line.match(sectionTitle);
            if (m)
                current = m[1].trim() || "General";
            waitingForTitle = false;
            continue;
        }
        const keyMatch = line.match(/^\s*"([^"]+)"/);
        if (keyMatch) {
            result[current] ??= [];
            result[current].push(keyMatch[1]);
        }
    }
    if (!Object.keys(result).length)
        result["General"] = [];
    return result;
}
/** Build a nicer tree: Section -> prefix groups (e.g. "editor.", "statusBar.") -> keys */
function buildTree(sections) {
    const nodes = [];
    for (const [section, keys] of Object.entries(sections)) {
        const groups = new Map();
        for (const k of keys) {
            const prefix = (k.split(".")[0] || "misc").trim();
            const label = title(prefix);
            if (!groups.has(label))
                groups.set(label, []);
            groups.get(label).push(k);
        }
        const children = [];
        for (const [label, groupKeys] of Array.from(groups.entries()).sort()) {
            children.push({ id: `${section}/${label}`, label, keys: groupKeys.sort() });
        }
        nodes.push({ id: section, label: section, children: children.sort((a, b) => a.label.localeCompare(b.label)) });
    }
    nodes.sort((a, b) => a.label.localeCompare(b.label));
    return nodes;
}
function title(s) {
    return s
        .replace(/([A-Z])/g, " $1")
        .replace(/[-_.]/g, " ")
        .replace(/\s+/g, " ")
        .replace(/^\s|\s$/g, "")
        .replace(/(^|\s)\S/g, c => c.toUpperCase());
}
//# sourceMappingURL=templateParser.js.map
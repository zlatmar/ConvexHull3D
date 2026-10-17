// Run the browser-independent TypeScript sources without emitting into src/.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import * as predicates from 'robust-predicates';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cache = new Map();
export function loadSource(relative) {
    if (relative === 'robust-predicates') return predicates;
    let file = path.resolve(root, relative);
    if (!path.extname(file)) file = fs.existsSync(`${file}.ts`) ? `${file}.ts` : path.join(file, 'index.ts');
    if (cache.has(file)) return cache.get(file).exports;
    const module = { exports: {} };
    cache.set(file, module);
    const result = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
        compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS }
    });
    const evaluate = vm.runInThisContext(`(function(require,module,exports){${result.outputText}\n})`, { filename: file });
    evaluate(request => loadSource(request.startsWith('.') ? path.resolve(path.dirname(file), request) : request), module, module.exports);
    return module.exports;
}

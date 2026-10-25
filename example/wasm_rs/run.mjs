import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";

const module = await WebAssembly.compile(await readFile(process.argv[2]));
// Debug Ghostty builds use env.log; release builds normally have no imports.
for (const entry of WebAssembly.Module.imports(module)) {
    assert.equal(`${entry.module}.${entry.name}:${entry.kind}`, "env.log:function");
}
const instance = await WebAssembly.instantiate(module, {
    env: {
        log(ptr, len) {
            // Memory64 passes pointers and lengths as BigInts. Reacquire
            // the buffer each time because library calls can grow memory.
            const bytes = new Uint8Array(instance.exports.memory.buffer, Number(ptr), Number(len));
            console.error(new TextDecoder().decode(bytes));
        },
    },
});
instance.exports.run();
console.log("Wasm ABI, terminal, callbacks, and allocator checks passed");

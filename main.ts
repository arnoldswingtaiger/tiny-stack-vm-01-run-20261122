// Tiny stack VM for make.fun's tiny-stack ISA v1. One run answers every
// instance in the input directory: <id>/stdout.bin gets exactly the bytes
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
const E = new TextEncoder();
// Opcode table: byte -> [immediate bytes, values popped, values pushed];
// -1 marks a byte no opcode names.
const S: any[] = [];
for (let i = 0; i < 256; i++) S[i] = -1;
const d = (o: number, a: number, b: number, c: number) => (S[o] = [a, b, c]);
d(0, 0, 0, 0); d(1, 1, 0, 1); d(2, 4, 0, 1); d(3, 0, 1, 0); d(4, 0, 1, 2);
d(5, 0, 2, 2); d(6, 0, 2, 3); d(7, 0, 3, 3);
for (let o = 0x10; o <= 0x22; o++) d(o, 0, 2, 1);
d(0x17, 0, 1, 1); d(0x1b, 0, 1, 1);
d(0x30, 2, 0, 0); d(0x31, 2, 1, 0); d(0x32, 2, 1, 0);
d(0x33, 2, 0, 0); d(0x34, 0, 0, 0);
d(0x40, 0, 1, 1); d(0x41, 0, 2, 0);
d(0x50, 0, 1, 0); d(0x51, 0, 1, 0); d(0x52, 0, 0, 1); d(0x53, 0, 1, 0);

// Runs one program on its input bytes; returns what it wrote and its exit.
function run(p: Uint8Array, g: Uint8Array) {
  const n = p.length;
  const st = new Int32Array(256);
  let sp = 0;
  const cs = new Int32Array(64);
  let cp = 0;
  const mem = new Int32Array(256);
  const out = new Uint8Array(65536);
  let ol = 0;
  let ip = 0;
  let pc = 0;
  let steps = 0;
  const end = (code: number) => ({ out: out.slice(0, ol), code });
  for (;;) {
    if (steps === 1e6) return end(10);
    if (pc < 0 || pc >= n) return end(9);
    const spec = S[p[pc]];
    if (spec === -1) return end(5);
    const [imm, pops, pushes] = spec;
    if (pc + imm >= n) return end(9);
    steps++;
    const next = pc + 1 + imm;
    if (sp < pops) return end(2);
    if (sp - pops + pushes > 256) return end(3);
    pc = next;
    const op = p[pc - 1 - imm];
    if (op === 0) return end(0);
    if (op === 1) st[sp++] = (p[next - 1] << 24) >> 24;
    else if (op === 2) st[sp++] = p[next - 4] | (p[next - 3] << 8) | (p[next - 2] << 16) | (p[next - 1] << 24);
    else if (op === 3) sp--;
    else if (op === 4) { st[sp] = st[sp - 1]; sp++; }
    else if (op === 5) { const t = st[sp - 1]; st[sp - 1] = st[sp - 2]; st[sp - 2] = t; }
    else if (op === 6) { st[sp] = st[sp - 2]; sp++; }
    else if (op === 7) { const t = st[sp - 3]; st[sp - 3] = st[sp - 2]; st[sp - 2] = st[sp - 1]; st[sp - 1] = t; }
    else if (op === 0x17) st[sp - 1] = (-st[sp - 1]) | 0;
    else if (op === 0x1b) st[sp - 1] = ~st[sp - 1];
    else if (op >= 0x10 && op <= 0x22) {
      const b = st[sp - 1];
      const a = st[sp - 2];
      let r: number;
      if (op === 0x10) r = (a + b) | 0;
      else if (op === 0x11) r = (a - b) | 0;
      else if (op === 0x12) r = Math.imul(a, b);
      else if (op === 0x13) { if (b === 0) return end(4); r = a === -2147483648 && b === -1 ? a : (a / b) | 0; }
      else if (op === 0x14) { if (b === 0) return end(4); r = b === -1 ? 0 : (a % b) | 0; }
      else if (op === 0x15) { if (b === 0) return end(4); r = Math.floor((a >>> 0) / (b >>> 0)) | 0; }
      else if (op === 0x16) { if (b === 0) return end(4); r = ((a >>> 0) % (b >>> 0)) | 0; }
      else if (op === 0x18) r = a & b;
      else if (op === 0x19) r = a | b;
      else if (op === 0x1a) r = a ^ b;
      else if (op === 0x1c) r = a << (b & 31);
      else if (op === 0x1d) r = a >> (b & 31);
      else if (op === 0x1e) r = (a >>> (b & 31)) | 0;
      else if (op === 0x20) r = a === b ? 1 : 0;
      else if (op === 0x21) r = a < b ? 1 : 0;
      else r = (a >>> 0) < (b >>> 0) ? 1 : 0;
      sp -= 2;
      st[sp++] = r;
    } else if (op >= 0x30 && op <= 0x32) {
      const rel = ((p[next - 2] | (p[next - 1] << 8)) << 16) >> 16;
      let take = op === 0x30;
      if (op !== 0x30) { const v = st[--sp]; take = op === 0x31 ? v === 0 : v !== 0; }
      if (take) pc = next + rel;
    } else if (op === 0x33) {
      if (cp === 64) return end(7);
      cs[cp++] = next;
      pc = p[next - 2] | (p[next - 1] << 8);
    } else if (op === 0x34) {
      if (cp === 0) return end(8);
      pc = cs[--cp];
    } else if (op === 0x40) {
      const a = st[sp - 1];
      if (a < 0 || a >= 256) return end(6);
      st[sp - 1] = mem[a];
    } else if (op === 0x41) {
      const a = st[sp - 1];
      if (a < 0 || a >= 256) return end(6);
      mem[a] = st[sp - 2];
      sp -= 2;
    } else if (op === 0x50) {
      const t = E.encode(String(st[sp - 1]));
      if (ol + t.length > 65536) return end(11);
      sp--;
      out.set(t, ol);
      ol += t.length;
    } else if (op === 0x51) {
      if (ol + 1 > 65536) return end(11);
      out[ol++] = st[--sp] & 255;
    } else if (op === 0x52) {
      st[sp++] = ip < g.length ? g[ip++] : -1;
    } else {
      return end(st[--sp] & 255);
    }
  }
}

const I = process.env.MAKEFUN_INPUT_DIR ?? '/input';
const O = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
for (const id of readdirSync(I).sort()) {
  const { out, code } = run(
    new Uint8Array(readFileSync(join(I, id, 'program.bin'))),
    new Uint8Array(readFileSync(join(I, id, 'input.bin'))),
  );
  mkdirSync(join(O, id), { recursive: true });
  writeFileSync(join(O, id, 'stdout.bin'), out);
  writeFileSync(join(O, id, 'exit.txt'), `${code}\n`);
}

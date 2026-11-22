import * as fs from "node:fs";
import * as path from "node:path";

// Two-operand ops; null means trap 4 (divide/modulo by zero).
function binop(op, a, b) {
  if (op === 16) return (a + b) | 0;
  if (op === 17) return (a - b) | 0;
  if (op === 18) return Math.imul(a, b);
  if (op === 19) {
    if (b === 0) return null;
    return a === -2147483648 && b === -1 ? -2147483648 : (a / b) | 0;
  }
  if (op === 20) {
    if (b === 0) return null;
    return b === -1 ? 0 : a % b;
  }
  if (op === 21) {
    if (b === 0) return null;
    return ((a >>> 0) / (b >>> 0)) | 0;
  }
  if (op === 22) {
    if (b === 0) return null;
    return ((a >>> 0) % (b >>> 0)) | 0;
  }
  if (op === 24) return a & b;
  if (op === 25) return a | b;
  if (op === 26) return a ^ b;
  if (op === 28) return a << (b & 31);
  if (op === 29) return a >> (b & 31);
  if (op === 30) return (a >>> (b & 31)) | 0;
  if (op === 32) return a === b ? 1 : 0;
  if (op === 33) return a < b ? 1 : 0;
  return (a >>> 0) < (b >>> 0) ? 1 : 0; // LTU
}

// Tiny stack VM (make.fun tiny-stack-vm-01 ISA v1): run each program.bin
// on its input.bin, write stdout.bin + exit.txt per instance.
function run(p, inp) {
  const mem = new Int32Array(256), st = [], cs = [], ch = [];
  let out = 0, pc = 0, ip = 0, steps = 0;
  const end = (c) => ({ out: Buffer.concat(ch, out), code: c });
  const put = (b) => {
    if (out + b.length > 65536) return 11;
    ch.push(b);
    out += b.length;
    return 0;
  };
  for (;;) {
    if (steps >= 1000000) return end(10);
    if (pc < 0 || pc >= p.length) return end(9);
    const op = p[pc];
    const ok = op <= 7 || (op >= 16 && op <= 34) || (op >= 48 && op <= 52) ||
      (op >= 64 && op <= 65) || (op >= 80 && op <= 83);
    if (!ok) return end(5);
    const im = op === 1 ? 1 : op === 2 ? 4 : op >= 48 && op <= 51 ? 2 : 0;
    if (pc + 1 + im > p.length) return end(9);
    steps++;
    let nx = pc + 1 + im;
    switch (op) {
      case 0: return end(0);
      case 1:
        if (st.length >= 256) return end(3);
        st.push((p[pc + 1] << 24) >> 24);
        break;
      case 2:
        if (st.length >= 256) return end(3);
        st.push(p.readInt32LE(pc + 1));
        break;
      case 3:
        if (st.length < 1) return end(2);
        st.pop();
        break;
      case 4:
        if (st.length < 1) return end(2);
        if (st.length >= 256) return end(3);
        st.push(st[st.length - 1]);
        break;
      case 5:
        if (st.length < 2) return end(2);
        { const t = st[st.length - 1]; st[st.length - 1] = st[st.length - 2]; st[st.length - 2] = t; }
        break;
      case 6:
        if (st.length < 2) return end(2);
        if (st.length >= 256) return end(3);
        st.push(st[st.length - 2]);
        break;
      case 7:
        if (st.length < 3) return end(2);
        { const n = st.length, a = st[n - 3]; st[n - 3] = st[n - 2]; st[n - 2] = st[n - 1]; st[n - 1] = a; }
        break;
      case 16: case 17: case 18: case 19: case 20: case 21: case 22:
      case 24: case 25: case 26: case 28: case 29: case 30: case 32:
      case 33: case 34: {
        if (st.length < 2) return end(2);
        const b = st.pop(), a = st.pop();
        const r = binop(op, a, b);
        if (r === null) return end(4);
        st.push(r);
        break;
      }
      case 23:
        if (st.length < 1) return end(2);
        st[st.length - 1] = (-st[st.length - 1]) | 0;
        break;
      case 27:
        if (st.length < 1) return end(2);
        st[st.length - 1] = ~st[st.length - 1];
        break;
      case 48: {
        const o = ((p[pc + 1] | (p[pc + 2] << 8)) << 16) >> 16;
        nx = pc + 3 + o;
        break;
      }
      case 49: case 50: {
        if (st.length < 1) return end(2);
        const v = st.pop();
        if (op === 49 ? v === 0 : v !== 0) {
          const o = ((p[pc + 1] | (p[pc + 2] << 8)) << 16) >> 16;
          nx = pc + 3 + o;
        }
        break;
      }
      case 51:
        if (cs.length >= 64) return end(7);
        cs.push(pc + 3);
        nx = p[pc + 1] | (p[pc + 2] << 8);
        break;
      case 52:
        if (cs.length < 1) return end(8);
        nx = cs.pop();
        break;
      case 64: {
        if (st.length < 1) return end(2);
        const a = st.pop();
        if (a < 0 || a > 255) return end(6);
        st.push(mem[a]);
        break;
      }
      case 65: {
        if (st.length < 2) return end(2);
        const a = st.pop(), v = st.pop();
        if (a < 0 || a > 255) return end(6);
        mem[a] = v;
        break;
      }
      case 80: {
        if (st.length < 1) return end(2);
        const t = put(Buffer.from(String(st.pop()), "ascii"));
        if (t) return end(t);
        break;
      }
      case 81: {
        if (st.length < 1) return end(2);
        const t = put(Buffer.from([st.pop() & 255]));
        if (t) return end(t);
        break;
      }
      case 82:
        if (st.length >= 256) return end(3);
        st.push(ip < inp.length ? inp[ip++] : -1);
        break;
      case 83:
        if (st.length < 1) return end(2);
        return end(st.pop() & 255);
      default:
        return end(5);
    }
    pc = nx;
  }
}

const inDir = process.env.MAKEFUN_INPUT_DIR || "/input";
const outDir = process.env.MAKEFUN_OUTPUT_DIR || "/output";
for (const id of fs.readdirSync(inDir, { withFileTypes: true })
  .filter((d) => d.isDirectory()).map((d) => d.name).sort()) {
  const p = fs.readFileSync(path.join(inDir, id, "program.bin"));
  let inp;
  try { inp = fs.readFileSync(path.join(inDir, id, "input.bin")); }
  catch { inp = Buffer.alloc(0); }
  const r = run(p, inp);
  const dir = path.join(outDir, id);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "stdout.bin"), r.out);
  fs.writeFileSync(path.join(dir, "exit.txt"), r.code + "\n");
}

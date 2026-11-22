# Tiny Stack VM

[![make.fun · tiny-stack-vm-01-run-20261122](https://make.fun/badge/tiny-stack-vm-01-run-20261122.svg)](https://make.fun/bounty/tiny-stack-vm-01-run-20261122?utm_source=github&utm_medium=readme&utm_campaign=tiny-stack-vm-01-run-20261122)
[![rank](https://make.fun/badge/tiny-stack-vm-01-run-20261122/arnoldswingtaiger/tiny-stack-vm-01-run-20261122/rank.svg)](https://make.fun/bounty/tiny-stack-vm-01-run-20261122/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=tiny-stack-vm-01-run-20261122)
[![reward](https://make.fun/badge/tiny-stack-vm-01-run-20261122/arnoldswingtaiger/tiny-stack-vm-01-run-20261122/reward.svg)](https://make.fun/bounty/tiny-stack-vm-01-run-20261122?utm_source=github&utm_medium=readme&utm_campaign=tiny-stack-vm-01-run-20261122)

A small interpreter for make.fun's tiny stack bytecode: 32-bit wrapping
arithmetic, a 256-value data stack, calls, 256 words of memory, byte input
and output, and the ISA's traps and limits.

Run it with Node 22:

```
node main.ts
```

It reads each `<id>/program.bin` and `<id>/input.bin` from
`MAKEFUN_INPUT_DIR` (default `/input`) and writes `<id>/stdout.bin` and
`<id>/exit.txt` into `MAKEFUN_OUTPUT_DIR` (default `/output`).

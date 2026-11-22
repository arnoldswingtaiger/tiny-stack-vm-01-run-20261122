# Tiny Stack VM

[![make.fun · tiny-stack-vm-01-run-20261122](https://make.fun/badge/tiny-stack-vm-01-run-20261122.svg)](https://make.fun/bounty/tiny-stack-vm-01-run-20261122?utm_source=github&utm_medium=readme&utm_campaign=tiny-stack-vm-01-run-20261122)
[![rank](https://make.fun/badge/tiny-stack-vm-01-run-20261122/arnoldswingtaiger/tiny-stack-vm-01-run-20261122/rank.svg)](https://make.fun/bounty/tiny-stack-vm-01-run-20261122/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=tiny-stack-vm-01-run-20261122)
[![reward](https://make.fun/badge/tiny-stack-vm-01-run-20261122/arnoldswingtaiger/tiny-stack-vm-01-run-20261122/reward.svg)](https://make.fun/bounty/tiny-stack-vm-01-run-20261122?utm_source=github&utm_medium=readme&utm_campaign=tiny-stack-vm-01-run-20261122)

A tiny stack virtual machine for make.fun's tiny-stack ISA v1, entered in the make.fun bounty [tiny-stack-vm-01-run-20261122](https://make.fun/bounty/tiny-stack-vm-01-run-20261122). One run answers every instance: for each `<id>/program.bin` with its `<id>/input.bin` it writes `<id>/stdout.bin` and `<id>/exit.txt`. It implements the whole ISA — wrapping 32-bit arithmetic, the 256-value stack, calls, 256 words of memory, input/output, all ten traps, and the step and output limits — and matches the kit's reference VM on all 40 practice instances.

Run it with `node main.ts` (reads `MAKEFUN_INPUT_DIR`, default `/input`; writes `MAKEFUN_OUTPUT_DIR`, default `/output`). No network, no dependencies, deterministic.

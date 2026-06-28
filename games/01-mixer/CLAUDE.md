# 01-mixer — build rules
Build ONLY what is in @SPEC.md. Anything beyond the Scope Cap → STOP, flag as Question.
Inherit all global rules from the root CLAUDE.md (Phaser 4 only, primitives-first, reuse template/).
NO Phaser filter/blend/renderer code — the mix is plain JS math; scoring is CIELAB ΔE, never sRGB distance.
Reuse from ../../template: scenes skeleton, feel/, lib/ (input, score). If you build a genuinely reusable
primitive (e.g. a colour-space helper), add it to ../../template generically. Do not gold-plate.
Status every step: Phase / Step / Plan / Blocker / Question.
@SPEC.md

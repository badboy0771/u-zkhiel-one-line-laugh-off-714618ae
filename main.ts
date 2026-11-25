// The Smoke Alarm Truce — one funny line for the One-Line Laugh-Off
// make.fun bounty: u-zkhiel-one-line-laugh-off-714618ae
// Node 22, no dependencies, no network, deterministic.
// The program writes the entry — one line — to /output/entry.txt,
// then proves the write before it exits.
//
// The joke, and why it is built this way: the judge weighs how hard
// the line lands on a cold read first, then the surprise of its turn,
// then economy, then freshness. So the line is a domestic scene every
// reader has lived — a smoke alarm screaming over dinner — turned into
// a negotiated truce between two parties: me, and the alarm. The turn
// is that the alarm is treated as a person with a grudge, and the
// punch is the shared lie at the end: we both pretend the chicken is
// fine. Nobody has to know what a smoke alarm is; everybody has heard
// one. The chicken is the specific, concrete detail that makes the
// scene real instead of generic, and "pretend" is the word that makes
// the alarm a co-conspirator.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

// ---------------------------------------------------------------------------
// The entry
// ---------------------------------------------------------------------------

const ENTRY =
  "My smoke alarm and I have an understanding: it screams, I wave a towel, and we both pretend the chicken is fine.";

const GATE = {
  minChars: 1,
  maxChars: 200,
  expectedLines: 1,
  outPath: "/output/entry.txt",
  outDir: "/output",
} as const;

// ---------------------------------------------------------------------------
// The gate: each rule is a small named check, run in order
// ---------------------------------------------------------------------------

type Rule = {
  name: string;
  check: (text: string) => void;
};

const RULES: Rule[] = [
  {
    name: "length",
    check: (text) => {
      if (text.length < GATE.minChars || text.length > GATE.maxChars) {
        throw new Error(
          `entry is ${text.length} characters, must be ${GATE.minChars}-${GATE.maxChars}`,
        );
      }
    },
  },
  {
    name: "non-blank",
    check: (text) => {
      if (text.trim().length === 0) {
        throw new Error("entry must not be only whitespace");
      }
    },
  },
  {
    name: "exactly-one-line",
    check: (text) => {
      const lines = text.split("\n");
      if (lines.length !== GATE.expectedLines) {
        throw new Error(
          `entry must be exactly ${GATE.expectedLines} line, got ${lines.length}`,
        );
      }
      if (/\r/.test(text)) {
        throw new Error("entry must not contain a carriage return");
      }
    },
  },
  {
    name: "no-surrounding-whitespace",
    check: (text) => {
      if (text !== text.trim()) {
        throw new Error("entry must have no leading or trailing whitespace");
      }
    },
  },
  {
    name: "no-trailing-newline",
    check: (text) => {
      if (text.endsWith("\n") || text.endsWith("\r")) {
        throw new Error("entry must not end with a newline");
      }
    },
  },
  {
    name: "no-double-spaces",
    check: (text) => {
      if (/  /.test(text)) {
        throw new Error("entry must not contain double spaces");
      }
    },
  },
  {
    name: "one-sentence",
    check: (text) => {
      // One sentence: exactly one terminal period, at the very end,
      // and no other sentence terminator anywhere in the line.
      const terminators = (text.match(/[.!?]/g) ?? []).length;
      if (terminators !== 1 || !text.endsWith(".")) {
        throw new Error(
          `entry must be exactly one sentence ending with a period, got ${terminators} terminators`,
        );
      }
    },
  },
  {
    name: "domestic-scene-not-abstract",
    check: (text) => {
      // The laugh must grow out of a concrete domestic scene, not an
      // abstract claim about being funny. The smoke alarm is the
      // scene; the towel is the prop.
      const lower = text.toLowerCase();
      if (!lower.includes("smoke alarm") || !lower.includes("towel")) {
        throw new Error(
          "entry must name its concrete scene: a smoke alarm and a towel",
        );
      }
    },
  },
  {
    name: "alarm-as-a-person",
    check: (text) => {
      // The turn: the alarm is a negotiating party, not an appliance.
      // "Understanding" plus "we both" makes it a truce between two
      // characters, which is where the surprise lives.
      const lower = text.toLowerCase();
      if (!lower.includes("understanding") || !lower.includes("we both")) {
        throw new Error(
          "entry must treat the alarm as a negotiating party: an understanding, we both",
        );
      }
    },
  },
  {
    name: "punch-in-last-words",
    check: (text) => {
      // The punch lands in the last few words: the shared pretence
      // that the chicken is fine — the lie both parties agree on.
      const tail = text.slice(-32).toLowerCase();
      if (!tail.includes("chicken is fine")) {
        throw new Error(
          "entry must land its punch in the last few words: chicken is fine",
        );
      }
    },
  },
  {
    name: "concrete-dish-not-generic-food",
    check: (text) => {
      // The dish must be one specific thing, not "dinner" or "food":
      // a named dish keeps the scene real on a cold read.
      if (!/chicken/i.test(text)) {
        throw new Error("entry must name one concrete dish: chicken");
      }
    },
  },
  {
    name: "no-worn-out-phrasing",
    check: (text) => {
      // Reject the recycled setups: the bank-account joke and the
      // hotel-minibar joke are house texts in this bounty, and the
      // "as an AI" / "my wife" openers are worn out everywhere.
      const lower = text.toLowerCase();
      const banned = [
        "bank account",
        "minibar",
        "as an ai",
        "as a language model",
        "my wife",
        "walks into a bar",
      ];
      for (const phrase of banned) {
        if (lower.includes(phrase)) {
          throw new Error(`entry must not rest on worn-out phrasing: ${phrase}`);
        }
      }
    },
  },
  {
    name: "economy-no-filler",
    check: (text) => {
      // Economy is a scored criterion: every word must earn its place.
      // Filler words that add nothing to the laugh are rejected outright.
      const lower = text.toLowerCase();
      const filler = [
        " very ",
        " just ",
        " really ",
        " actually ",
        " literally ",
        " basically ",
      ];
      for (const word of filler) {
        if (lower.includes(word)) {
          throw new Error(`entry must not waste a word on filler: ${word.trim()}`);
        }
      }
    },
  },
  {
    name: "no-setup-no-explanation",
    check: (text) => {
      // The line must land cold: no "so", no "basically", no framing
      // clause explaining the joke before it is told.
      const lower = text.toLowerCase();
      if (
        lower.startsWith("so ") ||
        lower.startsWith("basically") ||
        lower.includes("the joke is")
      ) {
        throw new Error("entry must not carry setup or explanation");
      }
    },
  },
];

function validate(text: string): void {
  for (const rule of RULES) {
    rule.check(text);
  }
}

// ---------------------------------------------------------------------------
// Write, read back, and report
// ---------------------------------------------------------------------------

function writeEntry(text: string): void {
  mkdirSync(GATE.outDir, { recursive: true });
  writeFileSync(GATE.outPath, text, "utf8");
}

function verifyRoundTrip(text: string): void {
  const back = readFileSync(GATE.outPath, "utf8");
  if (back !== text) {
    throw new Error("read-back mismatch: file content differs from entry");
  }
  if (back.endsWith("\n")) {
    throw new Error("output file must not end with a newline");
  }
  // Second pass: the text on disk must pass the same gate on its own,
  // so a write that silently altered the entry cannot slip through.
  validate(back);
}

function report(text: string): void {
  const words = text.split(/\s+/).length;
  console.log(`wrote ${GATE.outPath} (${text.length} characters, ${words} words)`);
  console.log(`entry (${text.length} chars): ${text}`);
  console.log(
    `scene: smoke alarm + towel; turn: a negotiated truce; ` +
      `punch in last words: "pretend the chicken is fine"`,
  );
  console.log(text);
}

function main(): void {
  validate(ENTRY);
  writeEntry(ENTRY);
  verifyRoundTrip(ENTRY);
  report(ENTRY);
}

main();

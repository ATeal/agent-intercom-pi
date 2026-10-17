import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { intercomJoinGuidance } from "./join-guidance.ts";

const askOnce = /ask once whether to form a team/;
const waitForApproval = /Wait for approval before creating a team/;
const afterApprovalSnippet = /After user approval/;
const enough = /collaborate with named Pi sessions or delegate work, that request is enough to form the team/;
const ungrouped = /omitting `team`/;
const explicitMembership = /Explicit team messages still require both sessions to be members/;
const reuse = /Reuse the team for the same task/;

test("intercom_join guidance asks once when team approval is on", () => {
  const guidance = intercomJoinGuidance(true);
  const text = [guidance.promptSnippet, ...guidance.promptGuidelines].join("\n");
  assert.match(guidance.promptSnippet, afterApprovalSnippet);
  assert.match(text, askOnce);
  assert.match(text, waitForApproval);
  assert.match(text, /user declines/);
  assert.match(text, /inbound team-message turn/);
  assert.match(text, ungrouped);
  assert.match(text, explicitMembership);
  assert.match(text, /Reuse the approved team/);
  assert.doesNotMatch(text, enough);
});

test("intercom_join guidance treats a collaboration request as enough when team approval is off", () => {
  const guidance = intercomJoinGuidance(false);
  const text = [guidance.promptSnippet, ...guidance.promptGuidelines].join("\n");
  assert.match(text, enough);
  assert.match(guidance.promptSnippet, /collaborate with or delegate to named sessions/);
  assert.match(text, ungrouped);
  assert.match(text, explicitMembership);
  assert.match(text, reuse);
  assert.match(text, /different task may need a different team/);
  assert.doesNotMatch(text, askOnce);
  assert.doesNotMatch(text, waitForApproval);
  assert.doesNotMatch(text, afterApprovalSnippet);
  assert.doesNotMatch(text, /user declines/);
});

test("registered intercom_join tool uses teamApproval from the environment", async () => {
  const root = mkdtempSync(join(tmpdir(), "pi-intercom-join-guidance-"));
  const previousAgentDir = process.env.PI_CODING_AGENT_DIR;
  const previousApproval = process.env.PI_INTERCOM_TEAM_APPROVAL;
  process.env.PI_CODING_AGENT_DIR = root;
  process.env.PI_INTERCOM_TEAM_APPROVAL = "0";
  try {
    const { default: piIntercomExtension } = await import("./index.ts");
    const tools: Array<{ name: string; promptSnippet?: string; promptGuidelines?: string[] }> = [];
    piIntercomExtension({
      getSessionName: () => "wiring",
      events: { on: () => () => undefined, emit: () => undefined },
      on: () => undefined,
      registerMessageRenderer: () => undefined,
      registerTool: (tool: { name: string; promptSnippet?: string; promptGuidelines?: string[] }) => {
        tools.push(tool);
      },
      registerCommand: () => undefined,
      registerShortcut: () => undefined,
      sendMessage: () => undefined,
      appendEntry: () => undefined,
    } as never);
    const join = tools.find((tool) => tool.name === "intercom_join");
    assert.ok(join, "intercom_join registered");
    const text = [join.promptSnippet, ...(join.promptGuidelines ?? [])].join("\n");
    assert.match(text, enough);
    assert.doesNotMatch(text, askOnce);
    assert.doesNotMatch(text, waitForApproval);
    assert.doesNotMatch(join.promptSnippet ?? "", afterApprovalSnippet);
  } finally {
    if (previousAgentDir === undefined) delete process.env.PI_CODING_AGENT_DIR;
    else process.env.PI_CODING_AGENT_DIR = previousAgentDir;
    if (previousApproval === undefined) delete process.env.PI_INTERCOM_TEAM_APPROVAL;
    else process.env.PI_INTERCOM_TEAM_APPROVAL = previousApproval;
    rmSync(root, { recursive: true, force: true });
  }
});

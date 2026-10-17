export interface IntercomJoinGuidance {
  promptSnippet: string;
  promptGuidelines: string[];
}

const membershipRules = "Without a shared team, send an ungrouped direct message by omitting `team`; belonging to an unrelated team must not prevent initial contact. Explicit team messages still require both sessions to be members.";
const teamSelectionRule = "Pass `team` when sending task messages, especially if peers share multiple teams. Replies inherit their original message's team automatically.";

export function intercomJoinGuidance(teamApproval: boolean): IntercomJoinGuidance {
  if (!teamApproval) {
    return {
      promptSnippet: "Form a task team when the user asks you to collaborate with or delegate to named sessions.",
      promptGuidelines: [
        "For independent Pi sessions: when the user asks you to collaborate with named Pi sessions or delegate work, that request is enough to form the team. Do not ask whether to form a team, and do not wait for a separate approval.",
        membershipRules,
        "Discover the intended sessions, then use intercom_join({ name: \"launch\", create: true, members: [\"front\", \"writer\"], work: \"Current task\" }). The tool adds everyone together; do not ask the user to join each terminal manually.",
        "Reuse the team for the same task and append new members the user named. Joining another team preserves previous memberships. The same participants doing a different task may need a different team.",
        teamSelectionRule,
      ],
    };
  }

  return {
    promptSnippet: "After user approval, form a task team with the named sessions they want to collaborate with.",
    promptGuidelines: [
      "For independent Pi sessions: when the user asks you to collaborate with named Pi sessions or delegate work, and this task has no approved team, ask once whether to form a team with you and those sessions (for example: 要把我、front、writer 组成一个 team 来负责这个任务吗？). Wait for approval before creating a team or adding peers.",
      `An explicit user request to create/join a team is approval. Do not ask again for an approved team or in an inbound team-message turn. If the user declines, do not keep prompting or silently create a team. ${membershipRules}`,
      "After approval, discover the intended sessions, then use intercom_join({ name: \"launch\", create: true, members: [\"front\", \"writer\"], work: \"Current task\" }). The tool adds everyone together; do not ask the user to join each terminal manually.",
      "Reuse the approved team for the same task and append new approved members. Joining another team preserves previous memberships. The same participants doing a different task may need a different team.",
      teamSelectionRule,
    ],
  };
}

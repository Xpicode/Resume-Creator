import { describe, expect, it } from "vitest";
import { newResumeContent, newSection } from "@/features/resume/schema";
import {
  itemFilled,
  nextStep,
  PERSONAL_STEP,
  personalDone,
  resumeProgress,
  sectionDone,
} from "@/features/editor/progress";

describe("guided editor progress", () => {
  it("an empty resume is 0% and starts at personal info", () => {
    const { steps, percent } = resumeProgress(newResumeContent("fresh_grad"));
    expect(percent).toBe(0);
    expect(steps[0]).toMatchObject({ id: PERSONAL_STEP, done: false });
  });

  it("personal info needs a full name and an email or phone", () => {
    expect(personalDone({ firstName: "Ana", lastName: "Reyes" })).toBe(false);
    expect(personalDone({ firstName: "Ana", lastName: "Reyes", phone: "0917" })).toBe(true);
    expect(personalDone({ firstName: " ", lastName: "Reyes", email: "a@b.co" })).toBe(false);
  });

  it("a section is done once any real field has text; checkboxes and ids don't count", () => {
    expect(itemFilled({ id: "x", isCurrent: true })).toBe(false);
    expect(itemFilled({ id: "x", bullets: ["", "  "] })).toBe(false);
    expect(itemFilled({ id: "x", bullets: ["Fixed printers"] })).toBe(true);
    const refs = { ...newSection("references"), availableUponRequest: true };
    expect(sectionDone(refs)).toBe(true);
  });

  it("hidden sections don't count against the percentage and are skipped by Next", () => {
    const content = newResumeContent("fresh_grad");
    content.personal = { firstName: "Ana", lastName: "Reyes", email: "ana@example.com" };
    content.sections = content.sections.map((s, i) => (i === 0 ? s : { ...s, isVisible: false }));
    const { steps, percent } = resumeProgress(content);
    expect(percent).toBe(50); // personal done, first section empty, the rest hidden
    expect(nextStep(steps, PERSONAL_STEP)?.id).toBe(content.sections[0].id);
    expect(nextStep(steps, content.sections[0].id)).toBeNull();
  });
});

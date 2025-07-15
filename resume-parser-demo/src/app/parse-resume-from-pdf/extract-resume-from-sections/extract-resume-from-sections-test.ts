import { describe, it, expect } from "@jest/globals";
import {
  matchOnlyNameLike,
  matchFlexiblePhone,
  matchEmail,
  matchUrl,
} from "./extract-profile";
import type { TextItem } from "../types";

const makeTextItem = (text: string) => ({ text } as TextItem);

describe("extract-profile tests - ", () => {
  it("Name", () => {
    expect(
      matchOnlyNameLike(makeTextItem("Leonardo W. DiCaprio"))![0]
    ).toBe("Leonardo W. DiCaprio");
  });

  it("Email", () => {
    expect(matchEmail(makeTextItem("  hello@open-resume.org  "))![0]).toBe(
      "hello@open-resume.org"
    );
  });

  it("Phone", () => {
    expect(matchFlexiblePhone(makeTextItem("  (123)456-7890  "))![0]).toBe(
      "(123)456-7890"
    );
  });

  it("Url", () => {
    expect(matchUrl(makeTextItem("  linkedin.com/in/open-resume  "))![0]).toBe(
      "linkedin.com/in/open-resume"
    );
    expect(matchUrl(makeTextItem("hello@open-resume.org"))).toBeFalsy();
  });
});

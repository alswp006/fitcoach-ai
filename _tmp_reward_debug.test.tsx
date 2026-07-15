import { describe, it, expect } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import { mockAppsInToss } from "@/__tests__/__helpers__/mocks";

mockAppsInToss();

import { loadFullScreenAd } from "@apps-in-toss/web-framework";
import { TossRewardAd } from "@/components/TossRewardAd";

describe("debug", () => {
  it("shows gate initially", () => {
    render(
      React.createElement(
        TossRewardAd,
        { slotId: "test-slot" },
        React.createElement("div", null, "CHILD_CONTENT"),
      ),
    );
    console.log("loadFullScreenAd mock calls:", (loadFullScreenAd as any).mock?.calls?.length);
    console.log("is vi mock:", typeof (loadFullScreenAd as any).mock);
    screen.debug();
  });
});

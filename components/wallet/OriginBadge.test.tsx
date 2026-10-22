import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { OriginBadge, SigningOriginNote } from "./OriginBadge";
import type { OriginState } from "@/lib/wallet/origin";

function state(overrides: Partial<OriginState>): OriginState {
  return {
    origin: "https://synapse.example.com",
    hostname: "synapse.example.com",
    isHttps: true,
    classification: "genuine",
    framed: false,
    allowedOrigins: ["https://synapse.example.com"],
    ...overrides,
  };
}

describe("OriginBadge", () => {
  it("renders the genuine origin state in green with its hostname", () => {
    render(<OriginBadge state={state({ classification: "genuine" })} />);
    const badge = screen.getByRole("status");
    expect(badge).toHaveTextContent("GENUINE ORIGIN");
    expect(badge).toHaveTextContent("synapse.example.com");
    expect(badge).toHaveAttribute("data-origin-classification", "genuine");
    expect(badge).toHaveAttribute("data-origin-hostname", "synapse.example.com");
  });

  it("renders the local dev state", () => {
    render(
      <OriginBadge
        state={state({ classification: "dev", hostname: "localhost", origin: "http://localhost:3000" })}
      />,
    );
    expect(screen.getByRole("status")).toHaveTextContent("LOCAL DEV");
  });

  it("renders the unverified origin state", () => {
    render(
      <OriginBadge
        state={state({
          classification: "unknown",
          hostname: "evil-clone.example",
          origin: "https://evil-clone.example",
        })}
      />,
    );
    const badge = screen.getByRole("status");
    expect(badge).toHaveTextContent("UNVERIFIED ORIGIN");
    expect(badge).toHaveTextContent("evil-clone.example");
  });

  it("renders the embedded/framed state", () => {
    render(<OriginBadge state={state({ classification: "framed", framed: true })} />);
    expect(screen.getByRole("status")).toHaveTextContent("EMBEDDED · DO NOT SIGN");
  });

  it("includes the hint as the element's title", () => {
    render(<OriginBadge state={state({ classification: "unknown" })} />);
    expect(screen.getByRole("status")).toHaveAttribute(
      "title",
      expect.stringContaining("Check the address bar"),
    );
  });

  it("falls back to the live origin and renders the real hostname when no override is given", () => {
    render(<OriginBadge />);
    const badge = screen.getByRole("status");
    expect(badge).toHaveAttribute("data-origin-hostname", window.location.hostname);
  });
});

describe("SigningOriginNote", () => {
  it("shows a muted confirm-and-sign message for a genuine origin", () => {
    render(<SigningOriginNote state={state({ classification: "genuine" })} />);
    expect(screen.getByText(/confirm this host against the address bar/i)).toBeInTheDocument();
  });

  it("shows a muted confirm-and-sign message for a dev origin", () => {
    render(<SigningOriginNote state={state({ classification: "dev", origin: "http://localhost:3000" })} />);
    expect(screen.getByText(/confirm this host against the address bar/i)).toBeInTheDocument();
  });

  it("shows the loud label and hint for an unverified origin", () => {
    render(<SigningOriginNote state={state({ classification: "unknown" })} />);
    expect(screen.getByText(/UNVERIFIED ORIGIN/)).toBeInTheDocument();
    expect(screen.getByText(/Do not proceed if the host looks wrong\./)).toBeInTheDocument();
  });

  it("shows the loud label and hint for a framed origin", () => {
    render(<SigningOriginNote state={state({ classification: "framed", framed: true })} />);
    expect(screen.getByText(/EMBEDDED · DO NOT SIGN/)).toBeInTheDocument();
  });
});

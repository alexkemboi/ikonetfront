import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CorrectDatesForm, addLength } from "@/components/subscriber-time/CorrectDatesForm";

function local(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

describe("CorrectDatesForm", () => {
  it("adds months on the calendar and minutes, hours and days by the clock", () => {
    const start = new Date(2026, 0, 15, 8, 0);
    expect(addLength(start, 1, "months")).toEqual(new Date(2026, 1, 15, 8, 0));
    expect(addLength(start, 90, "minutes")).toEqual(new Date(2026, 0, 15, 9, 30));
    expect(addLength(start, 3, "hours")).toEqual(new Date(2026, 0, 15, 11, 0));
    expect(addLength(start, 7, "days")).toEqual(new Date(2026, 0, 22, 8, 0));
  });

  it("sends the start and an end given as a length in months", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const start = new Date(Date.now() - 2 * 86_400_000);
    start.setSeconds(0, 0);
    render(<CorrectDatesForm idPrefix="t" initialStart={start.toISOString()} initialEnd={null} busy={false} fieldClass="" onSubmit={onSubmit} />);

    await user.click(screen.getByRole("button", { name: "Length" }));
    await user.type(screen.getByLabelText("Length from the start"), "1");
    await user.selectOptions(screen.getByLabelText("Length unit"), "months");
    await user.click(screen.getByRole("button", { name: "Correct dates" }));

    const end = addLength(new Date(local(start)), 1, "months");
    expect(onSubmit).toHaveBeenCalledWith(new Date(local(start)).toISOString(), end.toISOString());
  });

  it("says when the end has passed and offers to end the package now", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const start = new Date(Date.now() - 5 * 3_600_000);
    const end = new Date(Date.now() - 3_600_000);
    render(<CorrectDatesForm idPrefix="t" initialStart={start.toISOString()} initialEnd={end.toISOString()} busy={false} fieldClass="" onSubmit={onSubmit} />);

    expect(screen.getByText(/that has passed, so the package ends now/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "End the package now" }));
    expect(onSubmit).toHaveBeenCalled();
  });
});

import { describe, expect, it } from "vitest";
import { createRawSnippet } from "svelte";
import { render } from "svelte/server";

import DataTable from "../svelte/DataTable.svelte";
import RowMenu, {
  dangerItemClass,
  menuItemClass,
  nextIndex,
  normalItemClass,
} from "../svelte/RowMenu.svelte";

const cell = createRawSnippet<[{ id: number }, string]>((row, key) => ({
  render: () => `<span>${key()}-${row().id}</span>`,
}));

const base = {
  rowKey: (r: { id: number }) => r.id,
  cell,
  empty: "Nothing here",
  ariaLabel: "Things",
};

describe("DataTable", () => {
  it("renders header cells and one row per data row plus the header row", () => {
    const { body } = render(DataTable, {
      props: {
        ...base,
        columns: [
          { key: "a", label: "Name" },
          { key: "b", label: "Status" },
        ],
        rows: [{ id: 1 }, { id: 2 }, { id: 3 }],
      },
    });
    expect(body).toContain('role="table"');
    expect(body).toContain('aria-label="Things"');
    expect(body.match(/role="columnheader"/g)).toHaveLength(2);
    expect(body.match(/role="row"/g)).toHaveLength(4);
    expect(body.match(/role="cell"/g)).toHaveLength(6);
    expect(body).toContain("a-2");
  });

  it("renders the empty text and no body rows for an empty array", () => {
    const { body } = render(DataTable, {
      props: { ...base, columns: [{ key: "a", label: "Name" }], rows: [] },
    });
    expect(body).toContain("Nothing here");
    expect(body.match(/role="row"/g)).toHaveLength(2);
    expect(body.match(/role="cell"/g)).toHaveLength(1);
  });

  it("hides hideBelow columns at narrow widths", () => {
    const { body } = render(DataTable, {
      props: {
        ...base,
        columns: [
          { key: "a", label: "Name", width: "2fr" },
          { key: "b", label: "Owner", hideBelow: "md" },
        ],
        rows: [{ id: 1 }],
      },
    });
    expect(body).toContain("max-md:hidden");
    expect(body).toContain("--cols-wide: 2fr 1fr");
    expect(body).toContain("--cols-narrow: 2fr;");
  });

  it("makes rows focusable only when onRowClick is set", () => {
    const props = {
      ...base,
      columns: [{ key: "a", label: "Name" }],
      rows: [{ id: 1 }],
    };
    expect(render(DataTable, { props }).body).not.toContain("tabindex");
    expect(
      render(DataTable, { props: { ...props, onRowClick: () => {} } }).body,
    ).toContain('tabindex="0"');
  });
});

describe("RowMenu", () => {
  it("renders a closed menu button with the popup attributes", () => {
    const { body } = render(RowMenu, {
      props: {
        label: "Row actions",
        items: [{ label: "Delete", onSelect: () => {}, danger: true }],
      },
    });
    expect(body).toContain('aria-haspopup="menu"');
    expect(body).toContain('aria-label="Row actions"');
    expect(body).toContain('aria-expanded="false"');
    expect(body).not.toContain('role="menu"');
  });

  it("menu items show keyboard focus with an outline, not only a fill", () => {
    expect(menuItemClass).toContain("focus-visible:outline-2");
    expect(menuItemClass).toContain("focus-visible:outline-accent");
    expect(menuItemClass).not.toContain("focus-visible:outline-none");
  });

  it("danger items read red and wash red on hover", () => {
    expect(dangerItemClass).toContain("text-danger");
    expect(dangerItemClass).toContain("hover:bg-danger");
    expect(dangerItemClass).not.toContain("hover:bg-surface");
    expect(normalItemClass).not.toContain("text-danger");
  });

  it("nextIndex wraps arrows and jumps on Home/End", () => {
    expect(nextIndex("ArrowDown", 2, 3)).toBe(0);
    expect(nextIndex("ArrowUp", 0, 3)).toBe(2);
    expect(nextIndex("Home", 2, 3)).toBe(0);
    expect(nextIndex("End", 0, 3)).toBe(2);
    expect(nextIndex("Tab", 0, 3)).toBe(-1);
    expect(nextIndex("ArrowDown", 0, 0)).toBe(-1);
  });
});

describe("DataTable alignment", () => {
  it("header, data and empty rows bleed 12px past the container, table does not clip", () => {
    const cols = [{ key: "a", label: "Name" }];
    const full = render(DataTable, {
      props: { ...base, columns: cols, rows: [{ id: 1 }] },
    }).body;
    expect(full.match(/role="row"[^>]*-mx-3/g)).toHaveLength(2);
    expect(full).toContain("overflow-visible");
    const empty = render(DataTable, {
      props: { ...base, columns: cols, rows: [] },
    }).body;
    expect(empty.match(/role="row"[^>]*-mx-3/g)).toHaveLength(2);
    expect(full).toContain("px-3");
  });
});

import assert from "node:assert/strict";
import test from "node:test";
import { accessRedirect, panelRoles, roleHome } from "../src/lib/auth/access.ts";

const homes = [
  ["ADMIN", "/"],
  ["DIRECTOR", "/diretoria"],
  ["COUNSELOR", "/conselheiro"],
  ["MEMBER", "/minha-area"],
];

for (const [role, home] of homes) {
  test(role + " enters its own area and is redirected away from other areas", () => {
    assert.equal(roleHome[role], home);
    assert.equal(accessRedirect(role, [role]), null);
    for (const [other] of homes) {
      if (role !== other) assert.equal(accessRedirect(role, [other]), home);
    }
    assert.equal(accessRedirect(role, panelRoles), ["ADMIN", "DIRECTOR"].includes(role) ? null : home);
  });
}

test("anonymous visitor is sent to login", () => {
  assert.equal(accessRedirect(null, panelRoles), "/login");
});
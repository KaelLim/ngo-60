import { assertEquals } from "jsr:@std/assert";
import { normalize, findBlockedWord } from "./text-normalize.ts";

Deno.test("normalize lowercases and strips spaces/punctuation", () => {
  assertEquals(normalize("F U C K!!!"), "fuck");
  assertEquals(normalize("幹 ！"), "幹");
  assertEquals(normalize("Hello, World."), "helloworld");
});

Deno.test("findBlockedWord finds a substring match", () => {
  assertEquals(findBlockedWord("我想說幹你娘", ["幹", "操"]), "幹");
});

Deno.test("findBlockedWord returns null when clean", () => {
  assertEquals(findBlockedWord("祝福慈濟平安喜樂", ["幹", "操"]), null);
});

Deno.test("findBlockedWord ignores empty words", () => {
  assertEquals(findBlockedWord("anything", ["", "x"]), null);
});

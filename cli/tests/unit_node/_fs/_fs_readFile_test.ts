// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import { assertCallbackErrorUncaught } from "../_test_utils.ts";
import { readFile, readFileSync } from "node:fs";
import * as path from "../../../../test_util/std/path/mod.ts";
import { assert, assertEquals } from "../../../../test_util/std/assert/mod.ts";

const moduleDir = path.dirname(path.fromFileUrl(import.meta.url));
const testData = path.resolve(moduleDir, "testdata", "hello.txt");

Deno.test("readFileSuccess", async function () {
  const data = await new Promise((res, rej) => {
    readFile(testData, (err, data) => {
      if (err) {
        rej(err);
      }
      res(data);
    });
  });

  assert(data instanceof Uint8Array);
  assertEquals(new TextDecoder().decode(data as Uint8Array), "hello world");
});

Deno.test("readFileEncodeUtf8Success", async function () {
  const data = await new Promise((res, rej) => {
    readFile(testData, { encoding: "utf8" }, (err, data) => {
      if (err) {
        rej(err);
      }
      res(data);
    });
  });
  assertEquals(typeof data, "string");
  assertEquals(data as string, "hello world");
});

Deno.test("readFileEncodeHexSuccess", async function () {
  const data = await new Promise((res, rej) => {
    readFile(testData, { encoding: "hex" }, (err, data) => {
      if (err) {
        rej(err);
      }
      res(data);
    });
  });

  assertEquals(typeof data, "string");
  assertEquals(data as string, "68656c6c6f20776f726c64");
});

Deno.test("readFileEncodeBase64Success", async function () {
  const data = await new Promise((res, rej) => {
    readFile(testData, { encoding: "base64" }, (err, data) => {
      if (err) {
        rej(err);
      }
      res(data);
    });
  });
  assertEquals(typeof data, "string");
  assertEquals(data as string, "aGVsbG8gd29ybGQ=");
});

Deno.test("readFileEncodingAsString", async function () {
  const data = await new Promise((res, rej) => {
    readFile(testData, "utf8", (err, data) => {
      if (err) {
        rej(err);
      }
      res(data);
    });
  });

  assertEquals(typeof data, "string");
  assertEquals(data as string, "hello world");
});

Deno.test("readFileSyncSuccess", function () {
  const data = readFileSync(testData);
  assert(data instanceof Uint8Array);
  assertEquals(new TextDecoder().decode(data as Uint8Array), "hello world");
});

Deno.test("readFileEncodeUtf8Success", function () {
  const data = readFileSync(testData, { encoding: "utf8" });
  assertEquals(typeof data, "string");
  assertEquals(data as string, "hello world");
});

Deno.test("readFileEncodeHexSuccess", function () {
  const data = readFileSync(testData, { encoding: "hex" });
  assertEquals(typeof data, "string");
  assertEquals(data as string, "68656c6c6f20776f726c64");
});

Deno.test("readFileEncodeBase64Success", function () {
  const data = readFileSync(testData, { encoding: "base64" });
  assertEquals(typeof data, "string");
  assertEquals(data as string, "aGVsbG8gd29ybGQ=");
});

Deno.test("readFileEncodeAsString", function () {
  const data = readFileSync(testData, "utf8");
  assertEquals(typeof data, "string");
  assertEquals(data as string, "hello world");
});

Deno.test("[std/node/fs] readFile callback isn't called twice if error is thrown", async () => {
  const tempFile = await Deno.makeTempFile();
  const importUrl = new URL("node:fs", import.meta.url);
  await assertCallbackErrorUncaught({
    prelude: `import { readFile } from ${JSON.stringify(importUrl)}`,
    invocation: `readFile(${JSON.stringify(tempFile)}, `,
    async cleanup() {
      await Deno.remove(tempFile);
    },
  });
});

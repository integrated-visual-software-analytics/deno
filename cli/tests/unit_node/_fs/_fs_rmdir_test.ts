// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import { assertEquals, fail } from "../../../../test_util/std/assert/mod.ts";
import { rmdir, rmdirSync } from "node:fs";
import { closeSync } from "node:fs";
import { existsSync } from "node:fs";
import { join } from "../../../../test_util/std/path/mod.ts";
import { assertCallbackErrorUncaught } from "../_test_utils.ts";

Deno.test({
  name: "ASYNC: removing empty folder",
  async fn() {
    const dir = Deno.makeTempDirSync();
    await new Promise<void>((resolve, reject) => {
      rmdir(dir, (err) => {
        if (err) reject(err);
        resolve();
      });
    })
      .then(() => assertEquals(existsSync(dir), false), () => fail())
      .finally(() => {
        if (existsSync(dir)) Deno.removeSync(dir);
      });
  },
});

Deno.test({
  name: "SYNC: removing empty folder",
  fn() {
    const dir = Deno.makeTempDirSync();
    rmdirSync(dir);
    assertEquals(existsSync(dir), false);
  },
});

function closeRes(before: Deno.ResourceMap, after: Deno.ResourceMap) {
  for (const key in after) {
    if (!before[key]) {
      try {
        closeSync(Number(key));
      } catch (error) {
        return error;
      }
    }
  }
}

Deno.test({
  name: "ASYNC: removing non-empty folder",
  async fn() {
    const rBefore = Deno.resources();
    const dir = Deno.makeTempDirSync();
    Deno.createSync(join(dir, "file1.txt"));
    Deno.createSync(join(dir, "file2.txt"));
    Deno.mkdirSync(join(dir, "some_dir"));
    Deno.createSync(join(dir, "some_dir", "file.txt"));
    await new Promise<void>((resolve, reject) => {
      rmdir(dir, { recursive: true }, (err) => {
        if (err) reject(err);
        resolve();
      });
    })
      .then(() => assertEquals(existsSync(dir), false), () => fail())
      .finally(() => {
        if (existsSync(dir)) Deno.removeSync(dir, { recursive: true });
        const rAfter = Deno.resources();
        closeRes(rBefore, rAfter);
      });
  },
  ignore: Deno.build.os === "windows",
});

Deno.test({
  name: "SYNC: removing non-empty folder",
  fn() {
    const rBefore = Deno.resources();
    const dir = Deno.makeTempDirSync();
    Deno.createSync(join(dir, "file1.txt"));
    Deno.createSync(join(dir, "file2.txt"));
    Deno.mkdirSync(join(dir, "some_dir"));
    Deno.createSync(join(dir, "some_dir", "file.txt"));
    rmdirSync(dir, { recursive: true });
    assertEquals(existsSync(dir), false);
    // closing resources
    const rAfter = Deno.resources();
    closeRes(rBefore, rAfter);
  },
  ignore: Deno.build.os === "windows",
});

Deno.test("[std/node/fs] rmdir callback isn't called twice if error is thrown", async () => {
  // The correct behaviour is not to catch any errors thrown,
  // but that means there'll be an uncaught error and the test will fail.
  // So the only way to test this is to spawn a subprocess, and succeed if it has a non-zero exit code.
  // (assertRejects won't work because there's no way to catch the error.)
  const tempDir = await Deno.makeTempDir();
  const importUrl = new URL("node:fs", import.meta.url);
  await assertCallbackErrorUncaught({
    prelude: `import { rmdir } from ${JSON.stringify(importUrl)}`,
    invocation: `rmdir(${JSON.stringify(tempDir)}, `,
  });
});

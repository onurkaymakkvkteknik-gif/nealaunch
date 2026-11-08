import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    testTimeout: 35000,
    fileParallelism: false,
    allowOnly: false,
    passWithNoTests: false,
    reporters: [
      'default',
      {
        onFinished(files) {
          let testCount = 0;
          let skippedCount = 0;
          function countTasks(tasks: any[]) {
            for (const task of tasks || []) {
              if (task.type === 'test') {
                testCount++;
                if (task.mode === 'skip' || task.result?.state === 'skip') {
                  skippedCount++;
                }
              }
              if (task.tasks) {
                countTasks(task.tasks);
              }
            }
          }
          for (const file of files || []) {
            countTasks(file.tasks);
          }
          console.log(`\n[VITEST PROTECTED AUDIT] Verified tests executed: ${testCount}, skipped: ${skippedCount}`);
          if (skippedCount > 0) {
            throw new Error(`[PROTECTED INTEGRITY GATE] Skipped tests detected (${skippedCount})! All protected tests must execute.`);
          }
          const MIN_EXPECTED_TESTS = 9; // 1 optical + 5 property + 3 network-airgap
          if (testCount < MIN_EXPECTED_TESTS) {
            throw new Error(`[PROTECTED INTEGRITY GATE] Fewer than expected tests ran! Expected >= ${MIN_EXPECTED_TESTS}, ran ${testCount}.`);
          }
        }
      }
    ]
  },
});

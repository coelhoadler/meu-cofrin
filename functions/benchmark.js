const { performance } = require('perf_hooks');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const mockGetUser = async (uid) => {
  await sleep(50); // Simulate network latency
  return { uid, email: `user${uid}@example.com`, displayName: `User ${uid}` };
};

const mockGetUsers = async (uids) => {
  await sleep(50); // Simulate network latency for batch
  return {
    users: uids.map(({uid}) => ({ uid, email: `user${uid}@example.com`, displayName: `User ${uid}` }))
  };
};

async function runNPlusOne(uids) {
  const start = performance.now();
  const users = [];
  for (const uid of uids) {
    const u = await mockGetUser(uid);
    users.push(u);
  }
  const end = performance.now();
  console.log(`N+1 Query took: ${(end - start).toFixed(2)}ms`);
}

async function runBatch(uids) {
  const start = performance.now();
  const users = [];
  // chunk by 100
  for (let i = 0; i < uids.length; i += 100) {
    const chunk = uids.slice(i, i + 100).map(uid => ({uid}));
    const res = await mockGetUsers(chunk);
    users.push(...res.users);
  }
  const end = performance.now();
  console.log(`Batch Query took: ${(end - start).toFixed(2)}ms`);
}

async function run() {
  const uids = Array.from({length: 50}, (_, i) => String(i));
  await runNPlusOne(uids);
  await runBatch(uids);
}

run();

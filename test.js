(async () => {
  console.time("latency");
  const res = await fetch("http://localhost:8080/async");
  await res.json();
  console.timeEnd("latency");
})();

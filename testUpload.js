
(async () => {
  const data = new FormData();
  data.set("gallery", "test_gallery");
  data.set("group", "test_group");
  data.set("resizeTo", 800);
  data.set("uploadForFullSize", "true");
  data.set("isDev", "true");
  data.set("image", )
  console.time("latency");
  const res = await fetch("http://localhost:8080/upload", {
    method: "POST",
    body: data,
  });
  await res.json();
  console.timeEnd("latency");
})();

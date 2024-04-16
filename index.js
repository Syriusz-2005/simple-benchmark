import express from "express";

const app = express();

function fib(n) {
  if (n <= 1) {
    return n;
  }
  return fib(n - 1) + fib(n - 2);
}

function randomArr() {
  const arr = [];
  for (let i = 0; i < 1_000; i++) {
    arr.push(Math.random());
  }
  return arr;
}

const wait = (t) => new Promise((r) => setTimeout(r, t));

app.use(express.json());
app.get("/fib", (req, res) => {
  res.json({ result: fib(20) });
});
app.get("/async", async (req, res) => {
  fib(15);
  await wait(300);
  fib(15);
  res.send(JSON.stringify(randomArr()));
});

app.listen(process.env.PORT || 8080, () => {
  console.log("Server is running...");
});

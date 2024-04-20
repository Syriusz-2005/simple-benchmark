import express from "express";
import fs from "fs/promises";
import {fileParser} from "./fileParser.js";
import sharp from "sharp";

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

let lastWatermark;

async function handleGroupImageUpload(req, res) {
  const merchantEmail = "slomkam7@gmail.com";
  const file = (req.files)?.at(0);
  const resizeTo = Math.min(Math.max(Number(req.body.resizeTo), 400), 1600);
  const sharpInstance = sharp(file.buffer);

  console.time("Resize and upload");
  console.time("Full size");
  await sharpInstance.jpeg({quality: 90}).toBuffer();
  console.timeEnd("Full size");

  const {data: resizedBuffer, info} = await sharpInstance
    .resize(resizeTo, resizeTo, {
      fit: "inside",
    })
    .toBuffer({resolveWithObject: true});
    
  const resizedSharpInstance = sharp(resizedBuffer);

  const watermarkResourceName = String(req.body.watermarkResourceName);
  let watermarkBuffer;
  if (
    !lastWatermark ||
    lastWatermark.email !== merchantEmail ||
    lastWatermark.resourceName !== watermarkResourceName
  ) {
    watermarkBuffer = await fs.readFile("./watermark.png");

    lastWatermark = {
      email: merchantEmail,
      resourceName: watermarkResourceName,
      buffer: watermarkBuffer,
    };
  } else {
    watermarkBuffer = lastWatermark.buffer;
  }

  resizedSharpInstance.composite([
    {
      input: await sharp(watermarkBuffer)
        .resize(info.width - 5, info.height - 5, {
          fit: "cover",
          withoutEnlargement: true,
        })
        .toBuffer(),
      top: 0,
      left: 0,
    },
  ]);

  const watermarkedSharpInstance = sharp(await resizedSharpInstance.toBuffer());

  watermarkedSharpInstance.jpeg({progressive: true, quality: 100});

  await watermarkedSharpInstance.toBuffer();

  watermarkedSharpInstance.resize(400, 400, {fit: "inside"});

  await watermarkedSharpInstance.toBuffer();
  console.timeEnd("Resize and upload");
  res.send({status: 200, message: "OK"});
}

app.post("/upload", async (req, res) => {
  const [first, second] = fileParser();
  first(req, res, () => {
    second(req, res, () => {
      handleGroupImageUpload(req, res);
    });
  });
});

app.listen(process.env.PORT || 8080, () => {
  console.log("Server is running...");
});

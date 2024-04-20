import express from "express";
import fs from "fs/promises";

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

  const fileOriginalName = file.originalname.filename;

  const resizeTo = Math.min(Math.max(Number(req.body.resizeTo), 400), 1600);
  const addWatermark = req.body.watermarkPath !== undefined;
  const uploadForFullSize = String(req.body.uploadForFullSize) === "true";

  const sharpInstance = sharp(file.buffer);

  const defaultUploadOptions = {
    email: merchantEmail,
    gallery: String(req.body.gallery),
    group: String(req.body.group),
    imageName: String(fileOriginalName),
    inDevelopment: isDev,
  };

  if (uploadForFullSize) {
    await sharpInstance.jpeg({quality: 100}).toBuffer();
    await wait(150); // Simulating uploading full size file
  }

  const {data: resizedBuffer, info} = await sharpInstance
    .resize(resizeTo, resizeTo, {
      fit: "inside",
    })
    .toBuffer({resolveWithObject: true});

  const resizedSharpInstance = sharp(resizedBuffer);

  if (addWatermark) {
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
  }

  const watermarkedSharpInstance = sharp(await resizedSharpInstance.toBuffer());

  watermarkedSharpInstance.jpeg({progressive: true, quality: 100});

  await watermarkedSharpInstance.toBuffer();
  await wait(50); // simulating uploading resized image

  watermarkedSharpInstance.resize(400, 400, {fit: "inside"});

  await watermarkedSharpInstance.toBuffer();
  await wait(30) // simulating uploading preview buffer

  res.send({status: 200, message: "OK"});
}

app.get("/upload", async (req, res) => {
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

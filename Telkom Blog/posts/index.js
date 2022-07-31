const express = require("express");
const bodyParser = require("body-parser");
const { randomBytes } = require("crypto");
const cors = require("cors");
const axios = require("axios");

//MongoDB
const {MongoClient} = require('mongodb');

const app = express();
app.use(bodyParser.json());
app.use(cors());

const posts = {};

app.get("/posts", (req, res) => {
  res.send(posts);
});

app.post("/posts", async (req, res) => {
  const id = randomBytes(4).toString("hex");
  const { title } = req.body;

  posts[id] = {
    id,
    title,
  };

  await axios.post("http://localhost:4005/events", {
    type: "PostCreated",
    data: {
      id,
      title,
    },
  });

  //Save to DB
  saveMongo(id, title).catch(console.error);

  res.status(201).send(posts[id]);
});

app.post("/events", (req, res) => {
  console.log("Received Event", req.body.type);

  res.send({});
});

app.listen(4000, () => {
  console.log("Listening on 4000");
});

//MongoDB
async function saveMongo(id, title){
  const uri = "mongodb+srv://admin:admin123@cluster0.nwxyrmv.mongodb.net/?retryWrites=true&w=majority";

  const client = new MongoClient(uri);

  try {
      // Connect to the MongoDB cluster
      await client.connect();

      // Insert data to database
      await createListing(client,
        {
            id: id,
            title: title,
        }
    );

  } catch (e) {
      console.error(e);
  } finally {
      await client.close();
  }
}

async function createListing(client, newListing){
  const result = await client.db("db_posts").collection("posts").insertOne(newListing);
  console.log(`New listing created with the following id: ${result.insertedId}`);
}

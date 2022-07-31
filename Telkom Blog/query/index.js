const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const axios = require("axios");

//MongoDB
const {MongoClient} = require('mongodb');

const app = express();
app.use(bodyParser.json());
app.use(cors());

const posts = {};

const handleEvent = (type, data) => {
  if (type === "PostCreated") {
    const { id, title } = data;

    posts[id] = { id, title, comments: [] };
  }

  if (type === "CommentCreated") {
    const { id, content, postId, status } = data;

    const post = posts[postId];
    post.comments.push({ id, content, status });
  }

  if (type === "CommentUpdated") {
    const { id, content, postId, status } = data;

    const post = posts[postId];
    const comment = post.comments.find((comment) => {
      return comment.id === id;
    });

    comment.status = status;
    comment.content = content;
  }
};

app.get("/posts", (req, res) => {
  res.send(posts);
});

app.post("/events", (req, res) => {
  const { type, data } = req.body;

  handleEvent(type, data);

  //Save to DB
  saveMongo(type, data).catch(console.error);

  res.send({});
});

app.listen(4002, async () => {
  console.log("Listening on 4002");
  try {
    const res = await axios.get("http://localhost:4005/events");

    for (let event of res.data) {
      console.log("Processing event:", event.type);

      handleEvent(event.type, event.data);
    }
  } catch (error) {
    console.log(error.message);
  }
});

//MongoDB
async function saveMongo(type, data){
  const uri = "mongodb+srv://admin:admin123@cluster0.nwxyrmv.mongodb.net/?retryWrites=true&w=majority";

  const client = new MongoClient(uri);

  try {
      // Connect to the MongoDB cluster
      await client.connect();

      // Insert data to database
      await createListing(client,
        {
            type: type,
            data: data,
        }
    );

  } catch (e) {
      console.error(e);
  } finally {
      await client.close();
  }
}

async function createListing(client, newListing){
  const result = await client.db("db_query").collection("query").insertOne(newListing);
  console.log(`New listing created with the following id: ${result.insertedId}`);
}

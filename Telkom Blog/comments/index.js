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

const commentsByPostId = {};

app.get("/posts/:id/comments", (req, res) => {
  res.send(commentsByPostId[req.params.id] || []);
});

app.post("/posts/:id/comments", async (req, res) => {
  const commentId = randomBytes(4).toString("hex");
  const { content } = req.body;

  const comments = commentsByPostId[req.params.id] || [];

  comments.push({ id: commentId, content, status: "pending" });

  commentsByPostId[req.params.id] = comments;

  await axios.post("http://localhost:4005/events", {
    type: "CommentCreated",
    data: {
      id: commentId,
      content,
      postId: req.params.id,
      status: "pending",
    },
  });

  res.status(201).send(comments);
});

app.post("/events", async (req, res) => {
  console.log("Event Received:", req.body.type);

  const { type, data } = req.body;

  if (type === "CommentModerated") {
    const { postId, id, status, content } = data;
    const comments = commentsByPostId[postId];

    const comment = comments.find((comment) => {
      return comment.id === id;
    });
    comment.status = status;

    await axios.post("http://localhost:4005/events", {
      type: "CommentUpdated",
      data: {
        id,
        status,
        postId,
        content,
      },
    });
  }

  //Save to DB
  saveMongo(type, data).catch(console.error);

  res.send({});
});

app.listen(4001, () => {
  console.log("Listening on 4001");
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
          data: {
            id: data.id,
            postId: data.postId,
            status: data.status,
            content: data.content
          }
        }
    );

  } catch (e) {
      console.error(e);
  } finally {
      await client.close();
  }
}

async function createListing(client, newListing){
  const result = await client.db("db_comments").collection("comments").insertOne(newListing);
  console.log(`New listing created with the following id: ${result.insertedId}`);
}

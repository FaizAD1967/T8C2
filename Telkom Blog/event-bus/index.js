const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");

//MongoDB
const {MongoClient} = require('mongodb');

const app = express();
app.use(bodyParser.json());

const events = [];

app.post("/events", (req, res) => {
  const event = req.body;

  events.push(event);

  axios.post("http://localhost:4000/events", event).catch((err) => {
    console.log(err.message);
  });
  axios.post("http://localhost:4001/events", event).catch((err) => {
    console.log(err.message);
  });
  axios.post("http://localhost:4002/events", event).catch((err) => {
    console.log(err.message);
  });
  axios.post("http://localhost:4003/events", event).catch((err) => {
    console.log(err.message);
  });

  //Save to DB
  saveMongo(event).catch(console.error);

  res.send({ status: "OK" });
});

app.get("/events", (req, res) => {
  res.send(events);
});

app.listen(4005, () => {
  console.log("Listening on 4005");
});

//MongoDB
async function saveMongo(event){
  const uri = "mongodb+srv://admin:admin123@cluster0.nwxyrmv.mongodb.net/?retryWrites=true&w=majority";

  const client = new MongoClient(uri);

  try {
      // Connect to the MongoDB cluster
      await client.connect();

      // Insert data to database
      await createListing(client,
        {
            event:event
        }
    );

  } catch (e) {
      console.error(e);
  } finally {
      await client.close();
  }
}

async function createListing(client, newListing){
  const result = await client.db("db_event-bus").collection("event-bus").insertOne(newListing);
  console.log(`New listing created with the following id: ${result.insertedId}`);
}

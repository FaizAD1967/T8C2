const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

//MongoDB
const {MongoClient} = require('mongodb');

const app = express();
app.use(bodyParser.json());

app.post('/events', async (req, res) => {
  const { type, data } = req.body;

  if (type === 'CommentCreated') {
    const status = data.content.includes('orange') ? 'rejected' : 'approved';

    await axios.post('http://localhost:4005/events', {
      type: 'CommentModerated',
      data: {
        id: data.id,
        postId: data.postId,
        status,
        content: data.content
      }
    });
  }

  //Save to DB
  saveMongo(type, data).catch(console.error);

  res.send({});
});

app.listen(4003, () => {
  console.log('Listening on 4003');
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
  const result = await client.db("db_moderation").collection("moderation").insertOne(newListing);
  console.log(`New listing created with the following id: ${result.insertedId}`);
}

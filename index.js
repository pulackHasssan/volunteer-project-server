const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();
const MongoClient = require('mongodb').MongoClient;
const admin = require('firebase-admin');
const serviceAccount = require("./volunteer-auth-c15a3-firebase-adminsdk-pdaum-8598e770a7.json");


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.acdra.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cors());


admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://volunteer-auth-c15a3.firebaseio.com"
});


client.connect(err => {
  const serviceCollection = client.db("volunteer-database").collection("Users");
  const userCollection = client.db("volunteer-database").collection("Services");
  app.post('/addService', (req, res)=>{
    const service = req.body;
    serviceCollection.insertMany(service)
    .then(result=>{
        console.log(result.insertedCount);
        res.send(result.insertedCount)
    })
  })
  app.get('/services', (req, res)=>{
      serviceCollection.find({}).limit(20)
      .toArray((err, documents)=>{
          res.send(documents)
      })
  })

  app.post('/addUser', (req, res)=>{
    const user = req.body;
    userCollection.insertOne(user)
    .then(result=>{
        console.log(result.insertedCount);
        res.send(result.insertedCount > 0)
    })
  })

  app.get('/userActivities', (req, res)=>{
    const bearer = req.headers.authorization
    if(bearer && bearer.startsWith('Bearer ')){
      const idToken = bearer.split(' ')[1];
      admin.auth().verifyIdToken(idToken)
      .then(function(decodedToken) {
        let uid = decodedToken.email;
        if(uid == req.query.email){
          userCollection.find({email: req.query.email})
          .toArray((err, documents)=>{
              res.send(documents)
          })
        }
      }).catch(function(error) {
      });
    }
   
   
})

});








app.listen(4000);
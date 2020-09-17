import express from 'express'
import mongoose from 'mongoose'
import Messages from './dbMessages.js'
import Pusher from 'pusher'
import Cors from 'cors'
//app config
const app=express();
const port =process.env.PORT|| 9000



var pusher = new Pusher({
  appId: '1074453',
  key: '69befe5b88dcdc17bb7e',
  secret: '8d6ce3263f92d4d7eb8f',
  cluster: 'eu',
  encrypted: true
});


pusher.trigger('my-channel', 'my-event', {
  'message': 'hello world'
});

const connectionUrl='mongodb://admin:die0CnMrp7KOiw63@cluster0-shard-00-00.aj9kx.mongodb.net:27017,cluster0-shard-00-01.aj9kx.mongodb.net:27017,cluster0-shard-00-02.aj9kx.mongodb.net:27017/whatsappdb?ssl=true&replicaSet=atlas-1l4gi7-shard-0&authSource=admin&retryWrites=true&w=majority'
//middleware
app.use(express.json())
app.use(Cors());
// app.use((req,res,next)=>{
//     res.setHeader("Access-Control-Allow-Origin","*");
//     res.setHeader("Access-Control-Allow-Headers","*");
//     next();

// })
//db setup
mongoose.connect(connectionUrl,{
    useNewUrlParser:true,
    useCreateIndex:true,
    useUnifiedTopology:true
}).then(()=>{
    console.log("Connected to the Database. Yayzow!");
})
.catch(err => {
    console.log(err);
});

const db= mongoose.connection
db.once('open',()=>{
    console.log("DB connected")

    const msgCollection=db.collection("massagecontents");
    const changeStream=msgCollection.watch();
    changeStream.on('change',(change)=>{
        if(change.operationType === 'insert'){
            const messageDetails=change.fullDocument;
            pusher.trigger('messages','inserted',{
                name:messageDetails.name,
                message:messageDetails.message,
                timestamp:messageDetails.timestamp,
                received:messageDetails.received
            });
        }else{
            console,log("error triggering pusher")
        }
    });
    

});
//api routes

app.get('/',(req,res)=> res.status(200).send('Hello world'))

app.get('/messages/sync',(req,res)=>{
  Messages.find((err,data)=>{
    if(err){
        res.status(500).send(err)
    }else{
        res.status(200).send(data)
    }
  })
})

app.post('/message/new',(req,res)=>{
    Messages.create(req.body,(err,data)=>{
        if(err){
            res.status(500).send(err)
        }else{
            res.status(201).send(data)
        }
    })

})


//listen
app.listen(port,()=>console.log(`Listening on  localhost:${port}`));
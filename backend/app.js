var express = require('express');

var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var cors = require('cors');

// import subject schema

const Subject = require('./schemas/subjectSchema');
const Topic = require('./schemas/topicSchema-ClassVer');



var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true}));
app.use(cors());

var loggedIn = false;

var mongoServer = async(mongoAtlasUri,res)=>{
    // connect to mongodb cluster databse with mongoose
    mongoose
        .connect(mongoAtlasUri,{ useNewUrlParser: true, useUnifiedTopology: true, dbName: 'Cardify' })
        .then(()=>{
            res.send({passwordCorrect:true})
            loggedIn = true;
            console.log("Mongoose - Sucess!");
        
            // the following lines make up the CRUD api...
            

            // get data
            app.get('/subjects', async(req,res)=>{
                try{
                    var subjects = await Subject.find().exec();
                    res.send(subjects);
                } catch(err){
                    res.status(500).send(err);
                }
    
            });
    
            //edits to content
            app.put("/subjects/:id", async(req,res)=>{
                try{
                    var subject = await Subject.findByIdAndUpdate({_id:req.params.id},req.body).exec();
                    // subject.set(req.body)            
                    res.send(subject)
                } catch(err) {
                    res.status(500).send(err)
                }
            })
    
            //add a new subject
            app.post("/subjects",async(req,res)=>{
                try{
                    var newSubject = new Subject(req.body)
                    var result = await newSubject.save();
                    res.send(result)
                }
                catch(err){
                    res.status(501).send(err)
                }
            })
    
            //delete a subject
            app.delete("/subjects/:id",async(req,res)=>{
                try{
                    var result = await Subject.deleteOne({_id: req.params.id}).exec();
                    res.send(result);
                } catch(err) {
                    res.status(500).send(err)
                }
            })
    
            //add a subtopic
            app.post("/subtopics/:id", async(req,res)=>{
                try{
                    var topic = new Topic(req.body)
                    var subject = await Subject.findById({_id:req.params.id});            
                    var currentTopics = subject.topics;
                    currentTopics.push(topic);
                    var result = await Subject.findByIdAndUpdate({_id:req.params.id},{topics:currentTopics});
                    res.send(result)
                }catch(err) {
                    res.status(501).send(err)
                }
            })
    
            //delete a subtopic
            app.put("/subtopics/:id",async(req,res)=>{
                try{
                    var subject = await Subject.findById({_id:req.params.id});            
                    var currentTopics = subject.topics;
    
                    currentTopics.splice(req.body.deleteIndex,1);
    
                    var result = await Subject.findByIdAndUpdate({_id:req.params.id},{topics:currentTopics});
                    res.send(result)
                }catch(err) {
                    res.status(501).send(err)
                }
            })
            // start mongo server on port 3001
            //app.listen(3001,()=>console.log('Active on port 3001'));
            return true
    
        })
        .catch(
            e => {
                console.log('mongo failed to connect')
                res.send({passwordCorrect:false})
                return false
            }
        );

        
}

//authentication
app.post('/login', async(req,res)=>{
    try{

        let password = req.body.password;
        let mongoAtlasUri ="mongodb+srv://19lob4:"+ password +"@cardify.onbct.mongodb.net/subjects?retryWrites=true&w=majority";
        //res.send();
        mongoServer(mongoAtlasUri,res);

    } catch(err){
        console.log('mongoDB password was incorrect')
        res.status(502).send(err);
    }
});


app.get('/loggedIn', async(req,res)=>{
    try{
        res.send({login_status:loggedIn});
    }catch(err){
        res.send(502).send(err)
    }
})

app.post('/logout', async(req,res)=>{
    try{
        mongoose.connection.close();
        loggedIn = false;
        res.send({login_status:loggedIn})
    }
    catch(err){
        res.send(502).send(err)
    }
})


// start login server on port 8080
app.listen(8080,()=>console.log('Active on port 8080'));


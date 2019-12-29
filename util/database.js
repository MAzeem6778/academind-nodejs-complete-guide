const mongodb = require('mongodb');

const MongoClient = mongodb.MongoClient;

let _db;

const mongoConnect = (callback) => {

    MongoClient.connect('mongodb://Azeem:root@cluster0-shard-00-00-7i4yw.mongodb.net:27017,cluster0-shard-00-01-7i4yw.mongodb.net:27017,cluster0-shard-00-02-7i4yw.mongodb.net:27017/test?ssl=true&replicaSet=Cluster0-shard-0&authSource=admin&retryWrites=true&w=majority',{ useUnifiedTopology: true })
        .then(client => {
            _db = client.db();
            callback();
            console.log('Connected');
        })
        .catch(err => {console.log('this is error : ',err);
            throw err;}
        );
};

const getDb = ()=>{
    if(_db){
        return _db;
    }
    throw 'No Database Found!'
};


exports.mongoConnect = mongoConnect;
exports.getDb = getDb;

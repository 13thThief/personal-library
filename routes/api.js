'use strict';
require('dotenv').config();
// var expect = require('chai').expect;
var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectId;
const MONGODB_CONNECTION_STRING = process.env.DB;
//Example connection: MongoClient.connect(MONGODB_CONNECTION_STRING, function(err, db) {});

module.exports = function (app) {

  app.route('/api/books')
    //  title, _id, & commentcount
    .get(function (req, res){
      //response will be array of book objects
      //json res format: [{"_id": bookid, "title": book_title, "commentcount": num_of_comments },...]
      MongoClient.connect(MONGODB_CONNECTION_STRING, function(err, db) {
        if (err)
          throw Error(err)
        db
          .collection('books')
          .find()
          .toArray((err, doc)=>{
            if (err)
              throw Error(err);
            res.send(doc)
        });
      });
    })
    
    // post a title to /api/books to add a book and returned will be the object with the title and a unique _id.
    .post(function (req, res){
      var title = req.body.title;
      //response will contain new book object including atleast _id and title
      if (!title)
        return res.send('No title entered')

      MongoClient.connect(MONGODB_CONNECTION_STRING, function(err, db) {
        if (err)
          throw Error(err)
        db
          .collection('books')
          .insertOne({
            title,
            comments: [],
            commentcount: 0
          },
          (err, doc) => {
            if (err)
              throw Error(err)
            const result = {
              title,
              comments: doc.ops[0].comments,
              _id: doc.ops[0]._id
            }
            return res.json(result);
          });
        });
      })
    
    .delete(function(req, res){
      //if successful response will be 'complete delete successful'
      MongoClient.connect(MONGODB_CONNECTION_STRING, function(err, db) {
        if (err)
          throw Error(err);
        db
        .collection('books')
        .deleteMany(
          {},
          (err, doc)=>{
            if (err)
              throw err;
            res.send('complete delete successful')
        });
      });
    });

  app.route('/api/books/:id')
    .get(function (req, res){
      var bookid = req.params.id;
      //json res format: {"_id": bookid, "title": book_title, "comments": [comment,comment,...]}
      MongoClient.connect(MONGODB_CONNECTION_STRING, function(err, db) {
        if (err)
          throw Error(err);
        db
        .collection('books')
        .findOne({
          _id: ObjectId(bookid)
        },(err, doc)=>{
          if (err)
            throw Error(err);
          if (!doc)
            return res.send('invalid book id')
            let result = {
              _id: doc._id,
              title: doc.title,
              comments: doc.comments
            }
            return res.json(result)
        });
      });
    })
       
    .post(function(req, res){
      var bookid = req.params.id;
      var comment = req.body.comment;
      //json res format same as .get

      MongoClient.connect(MONGODB_CONNECTION_STRING, function(err, db) {
        if (err)
          throw Error(err)
        db
        .collection('books')
        .findAndModify({
          _id: ObjectId(bookid)},
          {},
          {
            $push: {comments: comment},
            $inc: {commentcount: 1}
          },
          { new:true },
          (err, doc)=>{
            if (err)
              throw Error(err)
            if (!doc.value)
              return res.send('invalid book id');
              let result = {
                _id:  doc.value._id,
                title: doc.value.title,
                comments: doc.value.comments
              }
              // console.log('Updated book record:', display)
              res.json(result)
        });
      });
    })

    .delete(function(req, res){
      var bookid = req.params.id;
      //if successful response will be 'delete successful'
      MongoClient.connect(MONGODB_CONNECTION_STRING, function(err, db) {
        if (err)
          throw Error(err)
        db
        .collection('books')
        .deleteMany(
          {
            _id: ObjectId(bookid)
          },
          {},
          (err, doc) => {
            if (err)
              throw Error(err)
            if (!doc.value)
              return res.send('invalid book id')
            return res.send('delete successful')
        });
      });
    });

  
};

//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/todolistDB", function(err) {
  if (err) {
    console.log("Connection Failed. " + err);
  } else {
    console.log("Connected to todolistDB");
  }
});
// , {userNewUrlParser: true}

const itemSchema = {
  content: String
};

const listSchema = {
  name: String,
  items: [itemSchema]
};

const Item = mongoose.model("item", itemSchema);
const List = mongoose.model("list", listSchema);

app.get("/", function(req, res) {

  Item.find({}, function(err, found) {
    if (err) {
      console.log("Item render error.");
      console.log(err);
    } 
    
    res.render("list", {listTitle: "Today", newListItems: found}); 
  });

});

app.get("/:listName", function(req, res) {
  const   listName = _.capitalize(req.params.listName);

  List.findOne({name: listName}, function(err, l) {
    if (err) {
      console.log("List finding failure.");
      console.log(err);
    } else {
      if (!l) {
        // No given list existed
        let   newList = new List({
          name: listName,
          items: []
        })

        newList.save();

        res.redirect("/" + _.toLower(listName)); 
      } else {
        // Show the list
    
        res.render("list", {listTitle: l.name, newListItems: l.items});
      }
    }
  });

});

app.post("/", function(req, res) {

  const item = req.body.newItem;
  const listName = req.body.list;

  let newIt = new Item({
    content: item
  });

  if (listName === "Today") {
    newIt.save(function(err) {
      if (err) {
        console.log("New item insertion error.");
        console.log(err);
      } 
    });

    res.redirect("/");
  } else {
    List.findOne({name: listName}, function(err, found) {
      if (err) {
        console.log("List finding failure.");
        console.log(err);
      } else {
        found.items.push(newIt);
        found.save();

        res.redirect("/" + _.toLower(listName));
      }
    });
  }
  
});

app.post("/delete", function(req, res) {
  let   deleteId = req.body.checkbox;
  let   curList = req.body.listName;

  if (curList === "Today") {
    Item.deleteOne({_id: deleteId}, function(err) {
      if (err) {
        console.log("Deletion failed.");
        console.log(err);
      }
    });

    res.redirect("/");
  } else {
    List.findOneAndUpdate({name: curList}, {$pull: {items: {_id: deleteId}}}, function(err, result) {
      if (err) {
        console.log("Deletetion failed.");
        console.log(err);
      } else {
        res.redirect("/" + _.toLower(result.name));
      }
    });
  }


});



app.listen(3000, function() {
  console.log("Server started on port 3000");
});

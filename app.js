const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const _ = require("lodash");

mongoose.connect("mongodb+srv://USERNAME:PASSWORD@cluster0-nx4f1.mongodb.net/DATABASE", {useUnifiedTopology: true, useNewUrlParser: true});
//Edit USERNAME, PASSWORD and DATABASE accordingly.

const app = express();

// let items = [];

const itemSchema = new mongoose.Schema(
{
  name: String
});

const Item = mongoose.model("Item", itemSchema);

const item1 = new Item(
{
  name: "Get food"
});

const item2 = new Item(
{
  name: "Cook food"
});

const item3 = new Item(
{
  name: "Eat food"
});

const defaultItems = [item1, item2, item3];

const listSchema =
{
  name: String,
  items: [itemSchema]
};

const List = mongoose.model("List", listSchema);

app.use(bodyParser.urlencoded({extended: true}));

app.use(express.static("public"));

app.set("view engine", "ejs");

let allLists = [];
List.find({}, function(err, foundLists)
{
  allLists = foundLists;
});


app.get("/", function(req, res)
{
  List.find({}, function(err, foundLists)
  {
    allLists = foundLists;
  });

  Item.find({}, function(err, foundItems)
  {
    if(foundItems.length === 0)
    {
      Item.insertMany(defaultItems, function(err)
      {
        if(err)
        {
          console.log(err);
        }
        else
        {
          console.log("Default items added!");
        }
      });
      res.redirect("/");
    }
    else
    {
      res.render("list", {allLists: allLists, listTitle: "To-Do List", newListItems: foundItems});
    }
  });

//  let day = date.getDate();

});

app.post("/", function(req, res)
{
  const itemName = req.body.newItem;
  const listName = req.body.list;
  const item = new Item(
  {
    name: itemName
  });

  if(listName === "To-Do List")
  {
    item.save();
    res.redirect("/");
  }
  else
  {
    List.findOne({name: listName}, function(err, foundList)
    {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    })
  }
  // item.save();
  // res.redirect("/");

});

app.post("/delete", function(req, res)
{
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if(listName === "To-Do List")
  {
    Item.findByIdAndRemove(checkedItemId, function(err)
    {
      if(err)
      {
        console.log(err);
      }
      else
      {
        console.log("Deleted checked item");
        res.redirect("/");
      }
    });
  }
    else
    {
      List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList)
      {
        if(!err)
        {
          res.redirect("/" + listName);
        }
      })
    }
});

app.get("/:customListName", function(req, res)
{
  const customListName = _.capitalize(req.params.customListName);
  List.findOne({name: customListName}, function(err, foundList)
  {
    if(!err)
    {
      if(!foundList)
      {
        // console.log("Doesnt exist.");
        const list = new List(
          {
            name: customListName,
            items: defaultItems
          });
        list.save();
        List.find({}, function(err, foundLists)
        {
          allLists = foundLists;
        });
        res.redirect("/" + customListName);
      }
      else
      {
        // console.log("Exists.");
        res.render("list", {allLists: allLists, listTitle: foundList.name, newListItems: foundList.items});
      }
    }
});
});

app.get("/about", function(req, res)
{
  res.render("about");
});

app.listen(process.env.PORT, function()
{
  console.log("Server started...");
});

// app.listen(3100, function()
// {
//   console.log("Server started on port 3100...");
// });

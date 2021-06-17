//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose=require("mongoose");
const _=require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/todolistDB",{
useNewUrlParser: true,
useUnifiedTopology: true,
useCreateIndex: true,
useFindAndModify: false
});

const itemsSchema = {
    name:String
};

const Item=mongoose.model("Item",itemsSchema);

const item1=new Item({
   name:"Welcome to your todolist!"
});

const item2=new Item({
  name:"Hit the + button to add a new item."
});

const item3=new Item({
  name:"<-- Hit this checkbox to delete an item."
});

const defaultItems = [item1,item2,item3];

const listSchema = {
  name:String,
  items:[itemsSchema]
};

const List = mongoose.model("List",listSchema);

app.get("/", function(req, res) {

  Item.find({},(err, foundItems)=>{
   
    if(foundItems.length === 0){
        Item.insertMany(defaultItems,(err)=>{
        if(err){
          console.log(err);
        }else{
        console.log("Successfully saved default items to DB");
        }
    });
    res.redirect("/");
    }else{
        res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
  });
 
});

app.get("/:Name", function(req,res){
  const customListName=_.capitalize(req.params.Name);
  
  List.findOne({name:customListName},(err,foundList)=>{
      if(!err){
          if(!foundList){
            const list = new List({
              name:customListName,
              items:defaultItems
            });
            list.save();
            res.redirect("/"+customListName);
          }else{
            res.render("list",{listTitle: foundList.name, newListItems: foundList.items});
          }
      }
  })
  

});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const ListName = req.body.list;

 
  const userItem=new Item({
    name:itemName
  });

  if(ListName=="Today"){
    userItem.save();
    res.redirect("/");
  }else{
      List.findOne({name:ListName},(err,foundList)=>{
        if(!err){
          foundList.items.push(userItem);
        foundList.save();
        res.redirect("/"+ListName);
        }
      })
  }
});

app.post("/delete",(req,res)=>{
  const checkedItemId=req.body.checkbox_item;
  const checkedListName=req.body.checkbox_list;

  if(checkedListName==="Today"){
    Item.findByIdAndRemove(checkedItemId,(err)=>{
      if(err){
        console.log(err);
      }else{
        console.log("Item deleted succesfully");
        res.redirect("/");
      }
    });
  }
  else{
  List.findOneAndUpdate({name:checkedListName},{$pull:{items:{_id:checkedItemId}}},(err)=>{
    if(err){
      console.log(err);
    }else{
      console.log("List deleted succesfully");
      res.redirect("/"+checkedListName);
      }
    })
  }
   

    // Item.deleteOne({_id:checkedItemId},(err)=>{
    //   if(err){
    //     console.log(err);
    //   }else{
    //     console.log("Item deleted succesfully");
    //     res.redirect("/");
    //   }
    // })
});




app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});

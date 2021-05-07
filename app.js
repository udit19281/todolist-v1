const express = require("express");
const app = express();
const _=require("lodash");
const dotenv=require('dotenv')

const result = dotenv.config()

if (result.error) {
  throw result.error
}
const pass=process.env.PASS
app.set("view engine", "ejs");
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

const url="mongodb+srv://admin-udit:"+pass+"@cluster0.zfwyu.mongodb.net/tododb";
const mongoose = require("mongoose");
mongoose.connect(url, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));

const itemSchema = new mongoose.Schema({
  name: {
    type: String,
  },
});
const itemSchemaModel = new mongoose.model("item", itemSchema);
let port=process.env.PORT;
if(port==null || port==""){
    port=3000;
}
app.listen(port);

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemSchema],
});
const listSchemaModel = new mongoose.model("list", listSchema);

app.get("/", function (req, res) {
  var options = {
    month: "long",
    day: "numeric",
    weekday: "long",
    year: "numeric",
  };
  var today = new Date();
  var d = today.toLocaleDateString("en-US", options);
  const itemlist = [];
  itemSchemaModel.find(function (err, i) {
    if (err) return console.error(err);
    else {
      i.forEach((ele) => {
        // //console.log(ele.name);
        itemlist.push(ele);
      });
      // //console.log(itemlist);
      res.render("list", { title: "Todo", whatd: d, addme: itemlist });
    }
  });
});

app.post("/", function (req, res) {
  var itm = req.body.input;
  var listn = req.body.button;
  const newitem = new itemSchemaModel({ name: itm });
  //console.log(listn);
  if (listn === "Todo") {
    newitem.save();
    res.redirect("/");
  } else {
    listSchemaModel.findOne({name:listn}, function (err, result) {
      if (!err) {
        result.items.push(newitem);
        result.save();
        res.redirect("/" + listn);
      }
    });
  }
});

app.post("/delete", function (req, res) {
  var temp = req.body.checkbox;
  var list= req.body.listname;
  //console.log("DELETE"); 
  //console.log(list);
   //console.log(temp);

  if(list==="Todo"){
    itemSchemaModel.deleteOne({ _id: temp }, function (err) {
        if (err) console.log(err);
      });
      res.redirect("/");
  }
  else{
      listSchemaModel.findOneAndUpdate({name:list},{
          $pull:{items:{_id:temp}}
      },function(err,result){
          if(err) console.log("Error in delete");
          res.redirect("/"+list);
      });
  }
});

app.get("/:list", function (req, res) {
  var options = {
    month: "long",
    day: "numeric",
    weekday: "long",
    year: "numeric",
  };
  var today = new Date();
  var d = today.toLocaleDateString("en-US", options);
  const nam = _.capitalize(req.params.list);
  listSchemaModel.find({ name: nam }, function (err, result) {
    if (!err) {
      if (result.length == 0) {
        //console.log("Saved");
        const list = new listSchemaModel({ name: nam, items: [] });
        list.save();
        // res.redirect("/" + nam);
         res.render("list",{whatd:d,title:nam,addme:[]});
      } else {
        //console.log("Already Exists");
        // //console.log(result[0].name);
        res.render("list", {
          whatd: d,
          title: result[0].name,
          addme: result[0].items,
        });
      }
    }
  });
});

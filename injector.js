const {remote, app, BrowserWindow} = require('electron');
const $ = require('jquery');
const path = require('path')
const sqlite3 = require('sqlite3').verbose();

const dbPath = path.resolve(__dirname, 'gtaSQLite.db');
let db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    return console.error(err.message);
  }
  console.log('Connected to the in-memory SQlite database.');
});

//create and execute sql query

var exclusions = "";

function injectScenes() {
  var sql = " SELECT anime_scenes.id, anime_scenes.anime_scene_file_name, anime_series.name FROM anime_scenes INNER JOIN anime_series ON anime_scenes.anime_series_id = anime_series.id " + exclusions + " GROUP BY anime_scenes.anime_series_id ORDER BY RANDOM() LIMIT 9";
  db.all(sql,[], function(err,result){
    if (err) throw err;
    //assemble HTML from query results
    if (exclusions == "") {
      exclusions = "WHERE";
    }
    if (exclusions != "WHERE") {
      exclusions = exclusions + " AND";
    }
    for (var i = 0; i < 9; i++) {
      var thumbSrc = "./img/" + result[i].id + "_thumb_" + result[i].anime_scene_file_name;
      $("#thumbPic" + i).attr("src", thumbSrc);
      var popupLink = "javascript:openScene(" + result[i].id + ", '" + result[i].anime_scene_file_name + "'); replaceScene(" + i + ");";
      $("#thumbLink" + i).attr("href", popupLink);
      $("#title" + i).text(result[i].name);
      $("#title" + i).attr("href", popupLink);
      exclusions = exclusions + " anime_scenes.id != " + result[i].id + " AND";
    }
    if (exclusions.slice(-3) == "AND") {
      exclusions = exclusions.slice(0,-3);
    }
  });
}

function openScene(id,name) {

  var img = new Image();
  var url = "./img/" + id + "_original_" + name;
  img.onload = function(){
    var h = img.height;
    var w = img.width;

    // make a new window
    let popup = new remote.BrowserWindow({width: w + 50, height: h + 100});


    popup.loadFile('popup.html');
    popup.webContents.openDevTools();
    var js = "$('#myCanvas').css('background-image','url(" + url + ")'); var c = document.getElementById('myCanvas'); c.width = " + w + ";c.height = " + h + ";";
    popup.webContents.executeJavaScript(js);
  }
  img.src = url;


  //create and execute sql query
  var sql = " SELECT anime_scenes.episode, anime_series.name FROM anime_scenes INNER JOIN anime_series ON anime_scenes.anime_series_id = anime_series.id WHERE anime_scenes.id = " + id + " ORDER BY RANDOM() LIMIT 1";
  db.all(sql,[],(err, result) => {
    if (err) throw err;

    $("#selectedTitle").text(result[0].name);
    $("#selectedEpisode").text(result[0].episode);

  });

}

function replaceScene(index) {


  //create and execute sql query
  var sql = " SELECT anime_scenes.id, anime_scenes.anime_scene_file_name, anime_series.name FROM anime_scenes INNER JOIN anime_series ON anime_scenes.anime_series_id = anime_series.id ORDER BY RANDOM() LIMIT 1";

  db.all(sql,[],(err, result) => {
    if (err) throw err;
    //assemble HTML from query results

    var thumbSrc = "./img/" + result[0].id + "_thumb_" + result[0].anime_scene_file_name;
    $("#thumbPic" + index).attr("src", thumbSrc);
    var popupLink = "javascript:openScene(" + result[0].id + ", '" + result[0].anime_scene_file_name + "'); replaceScene(" + index + ");";
    $("#thumbLink" + index).attr("href", popupLink);
    $("#title" + index).text(result[0].name);
    $("#title" + index).attr("href", popupLink);
  });

}

const electron = require('electron');
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
var seriesCount = [];

remote.getCurrentWindow().webContents.on('will-navigate',function(event,url) {
  exclusions = "";
  seriesCount = [];
});

function injectScenes() {
  var sql = " SELECT anime_scenes.id, anime_scenes.anime_series_id, anime_scenes.anime_scene_file_name, anime_series.name FROM anime_scenes INNER JOIN anime_series ON anime_scenes.anime_series_id = anime_series.id  " + exclusions + " ORDER BY RANDOM() LIMIT 9";
  db.all(sql,[], function(err,result){
    if (err) throw err;
    if (exclusions == "") {
      exclusions = "WHERE";
    }
    if (exclusions != "WHERE") {
      exclusions = exclusions + " AND";
    }
    for (var i = 0; i < result.length; i++) {
      if (seriesCount[result[i].anime_series_id]) {
        seriesCount[result[i].anime_series_id] += 1;
      } else {
        seriesCount[result[i].anime_series_id] = 1;
      }
      if (seriesCount[result[i].anime_series_id] > 3) {
        replaceScene(i);
      } else {
        var thumbSrc = "./img/" + result[i].id + "_original_" + result[i].anime_scene_file_name;
        $("#thumbPic" + i).attr("src", thumbSrc);
        var popupLink = "javascript:openScene(" + result[i].id + ", '" + result[i].anime_scene_file_name + "'); replaceScene(" + i + ");";
        $("#thumbLink" + i).attr("href", popupLink);
        $("#title" + i).text(result[i].name);
        $("#title" + i).attr("href", popupLink);
        exclusions = exclusions + " anime_scenes.id != " + result[i].id + " AND";
      }



    }
    if (exclusions.slice(-3) == "AND") {
      exclusions = exclusions.slice(0,-3);
    }
  });
}
injectScenes();

function openScene(id,name) {

  var img = new Image();
  var url = "./img/" + id + "_original_" + name;
  img.onload = function(){
    var h = img.height;
    var w = img.width;

    //pick screen to show popup in (the final game setup will use a second screen to show the audience the popup)
    var allScreens = electron.screen.getAllDisplays();
    var popupScreen = allScreens.length == 1 ? allScreens[0] : allScreens[1];

    // make a new window
    let popup = new remote.BrowserWindow({x: popupScreen.bounds.x + 50,
                                          y: popupScreen.bounds.y + 50,
                                          width: popupScreen.bounds.width - 50,
                                          height: popupScreen.bounds.height - 50,
                                          fullscreen: true});


    popup.loadFile('popup.html');
    //popup.webContents.openDevTools();
    console.log(popupScreen);
    //var js = "$('#myCanvas').css('background-image','url(" + url + ")'); $('#container').css('height'," + popupScreen.height + "); var c = document.getElementById('myCanvas'); c.width = " + w + ";c.height = " + h + ";";
    var js = "img.src = '" + url + "'; $('#container').css('height'," + popupScreen.bounds.height + "); var c = document.getElementById('myCanvas'); c.width = " + popupScreen.bounds.width + ";c.height = " + popupScreen.bounds.height + ";";
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
  var sql = " SELECT anime_scenes.id, anime_scenes.anime_series_id, anime_scenes.anime_scene_file_name, anime_series.name FROM anime_scenes INNER JOIN anime_series ON anime_scenes.anime_series_id = anime_series.id " + exclusions + " ORDER BY RANDOM() LIMIT 1";

  db.all(sql,[],(err, result) => {
    if (err) throw err;
    //assemble HTML from query results
    if (exclusions == "") {
      exclusions = "WHERE";
    }
    if (exclusions != "WHERE") {
      exclusions = exclusions + " AND";
    }
    if (seriesCount[result[0].anime_series_id]) {
      seriesCount[result[0].anime_series_id] += 1;
    } else {
      seriesCount[result[0].anime_series_id] = 1;
    }
    if (seriesCount[result[0].anime_series_id] > 3) {
      replaceScene(index);
    } else {
      exclusions = exclusions + " anime_scenes.id != " + result[0].id + " AND";
      var thumbSrc = "./img/" + result[0].id + "_original_" + result[0].anime_scene_file_name;
      $("#thumbPic" + index).attr("src", thumbSrc);
      var popupLink = "javascript:openScene(" + result[0].id + ", '" + result[0].anime_scene_file_name + "'); replaceScene(" + index + ");";
      $("#thumbLink" + index).attr("href", popupLink);
      $("#title" + index).text(result[0].name);
      $("#title" + index).attr("href", popupLink);
    }
    if (exclusions.slice(-3) == "AND") {
      exclusions = exclusions.slice(0,-3);
    }



  });

}

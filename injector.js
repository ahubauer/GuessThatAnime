const electron = require('electron');
const {remote, app, BrowserWindow} = require('electron');
const $ = require('jquery');
const path = require('path')
const sqlite3 = require('sqlite3');

const dbPath = path.resolve(__dirname, './gtaSQLite.db').replace('\app.asar', '');
let db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    return console.error(err.message);
  }
  console.log('Connected to the in-memory SQlite database.');
});

var seriesMax = 3;

function setSeriesMax(value) {
  seriesMax = parseInt(value);
  console.log(seriesMax);
}


var exclusions = "";
var seriesCount = [];
var shownScenes = [];

remote.getCurrentWindow().webContents.on('will-navigate',function(event,url) {
  exclusions = "";
  seriesCount = [];
  shownScenes = [];
});

//create and execute sql query

function injectScenes() {
  exclusions = "WHERE anime_scenes.id NOT IN (";
  for (var i = 0; i < shownScenes.length; i++) {
    exclusions += shownScenes[i] + ",";
  }
  if (exclusions.slice(-1) == ",") {
    exclusions = exclusions.slice(0,-1);
  }
  exclusions += ")"
  var sql = " SELECT anime_scenes.id, anime_scenes.anime_series_id, anime_scenes.anime_scene_file_name, anime_series.name FROM anime_scenes INNER JOIN anime_series ON anime_scenes.anime_series_id = anime_series.id  " + exclusions + " ORDER BY RANDOM() LIMIT 9";
  db.all(sql,[], function(err,result){
    if (err) {
      console.log(sql);
      throw err;
    }
    for (var i = 0; i < result.length; i++) {
      if (seriesCount[result[i].anime_series_id] >= seriesMax) {
        replaceScene(i);
      } else {
        shownScenes.push(result[i].id);
        var thumbSrc = "./img/" + result[i].id + "_original_" + result[i].anime_scene_file_name;
        $("#thumbPic" + i).attr("src", path.resolve(__dirname,thumbSrc).replace('\app.asar', ''));
        var popupLink = "javascript:openScene(" + result[i].id + ", '" + result[i].anime_scene_file_name + "'); replaceScene(" + i + ");";
        $("#thumbLink" + i).attr("href", popupLink);

        $("#title" + i).text(result[i].name);
        $("#title" + i).attr("href", popupLink);
        shownScenes.push(result[i].id);
        exclusions = exclusions + " anime_scenes.id != " + result[i].id + " AND";
      }
      if (seriesCount[result[i].anime_series_id]) {
        seriesCount[result[i].anime_series_id] += 1;
      } else {
        seriesCount[result[i].anime_series_id] = 1;
      }
    }
  });
}
injectScenes();

let popup = null;

function openScene(id,name) {
  var img = new Image();
  var url = "./img/" + id + "_original_" + name;
  url = path.resolve(__dirname, url).replace('\app.asar', '');

  img.onload = function(){
    var h = img.height;
    var w = img.width;

    //pick screen to show popup in (the final game setup will use a second screen to show the audience the popup)
    var allScreens = electron.screen.getAllDisplays();
    var popupScreen = allScreens.length == 1 ? allScreens[0] : allScreens[1];

    // make a new window
    if (popup != null) {
      popup.close();
    }

    popup = new remote.BrowserWindow({x: popupScreen.bounds.x,
                                      y: popupScreen.bounds.y,
                                      width: popupScreen.bounds.width,
                                      height: popupScreen.bounds.height,
                                      fullscreen: true});


    popup.loadFile('popup.html');
    //popup.webContents.openDevTools();
    console.log(popupScreen);

    url = url.replace("\\", "\\\\");
  	var split = url.split("\\");
  	var js = "img.src = '";
  	for (i = 0;i < split.length;i++) {
  		js = js + split[i];
  		if (i < split.length - 1) {
  			js = js + "\\\\"
  		} else {
  			js = js + "';";
  		}
  	}
    js = js + "$('#container').css('height'," + popupScreen.bounds.height + "); var c = document.getElementById('myCanvas'); c.width = " + popupScreen.bounds.width + ";c.height = " + popupScreen.bounds.height + ";";
    //var js = "img.src = '" + url + "'; $('#container').css('height'," + popupScreen.bounds.height + "); var c = document.getElementById('myCanvas'); c.width = " + popupScreen.bounds.width + ";c.height = " + popupScreen.bounds.height + ";";
    popup.webContents.executeJavaScript(js);

    // var scale = popupScreen.bounds.width / w;
    // var zoomjs = "var c = document.getElementById('myCanvas');  var ctx = c.getContext('2d'); ctx.scale(" + scale + "," + scale + "); ctx.translate(-c.width /" + scale + ",-c.height /" + scale + ");";
    // popup.webContents.executeJavaScript(zoomjs);
  }
  img.src = url;


  //create and execute sql query
  var sql = " SELECT anime_scenes.episode, anime_series.name FROM anime_scenes INNER JOIN anime_series ON anime_scenes.anime_series_id = anime_series.id WHERE anime_scenes.id = " + id + " ORDER BY RANDOM() LIMIT 1";
  db.get(sql,[],(err, result) => {
    if (err) throw err;

    $("#selectedTitle").text(result.name);
    $("#selectedEpisode").text(result.episode);

  });

}

function replaceScene(index) {


  //create and execute sql query
  exclusions = "WHERE anime_scenes.id NOT IN (";
  for (var i = 0; i < shownScenes.length; i++) {
    exclusions += shownScenes[i] + ",";
  }
  if (exclusions.slice(-1) == ",") {
    exclusions = exclusions.slice(0,-1);
  }
  exclusions += ")"
  var sql = " SELECT anime_scenes.id, anime_scenes.anime_series_id, anime_scenes.anime_scene_file_name, anime_series.name FROM anime_scenes INNER JOIN anime_series ON anime_scenes.anime_series_id = anime_series.id " + exclusions + " ORDER BY RANDOM() LIMIT 1";

  db.get(sql,[],(err, result) => {
    if (err) {
      console.log(sql);
      throw err;
    }
    //assemble HTML from query results
    if (seriesCount[result.anime_series_id] > seriesMax) {
      replaceScene(index);
    } else {
      shownScenes.push(result.id);
      var thumbSrc = "./img/" + result.id + "_original_" + result.anime_scene_file_name;
      $("#thumbPic" + index).attr("src", path.resolve(__dirname,thumbSrc).replace('\app.asar', ''));
      var popupLink = "javascript:openScene(" + result.id + ", '" + result.anime_scene_file_name + "'); replaceScene(" + index + ");";
      $("#thumbLink" + index).attr("href", popupLink);
      $("#title" + index).text(result.name);
      $("#title" + index).attr("href", popupLink);
    }
    if (seriesCount[result.anime_series_id]) {
      seriesCount[result.anime_series_id] += 1;
    } else {
      seriesCount[result.anime_series_id] = 1;
    }



  });

}

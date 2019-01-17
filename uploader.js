const electron = require('electron');
const {remote, app, BrowserWindow} = require('electron');
const $ = require('jquery');
const path = require('path')
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');


const dbPath = path.resolve(__dirname, 'gtaSQLite.db').replace('\app.asar', '');
let db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    return console.error(err.message);
  }
  console.log('Connected to the in-memory SQlite database.');
});


function validate() {
  var filename = $('#file').val();
  if (!filename) {
    alert('Please select an image.')
    return false;
  }
  var parts = filename.split('.');
  var ext = parts[parts.length - 1];
  switch (ext) {
    case 'jpg':
    case 'gif':
    case 'bmp':
    case 'png':
      break;
    default: {
      alert('Selected file is not an image.');
      return false;
    }
  }
  if (!$('#series').val()) {
    alert('Please enter a series.');
    return false;
  }
  return true;
}

function submit() {
  var seriesCheck = "SELECT * FROM anime_series WHERE name = '" + $('#series').val() + "'";
  db.get(seriesCheck,[],function(err,result){
    if (err) console.log(err);
    var newSeries = "";
    var newID = false;
    if (!result) {
      var newSeries = "INSERT INTO anime_series(name) VALUES ('" + $('#series').val() + "')";
      newID = true;
    }
    db.run(newSeries,[],function(err) {
      if (err) console.log(err);
      var id = newID ? this.lastID : result.id;
      var newScene = "INSERT INTO anime_scenes(anime_series_id, episode) VALUES (" + id + ", '" + $('#episode').val() + "')";
      db.run(newScene,[],function(err) {
        if (err) console.log(err);
        var imgFile = document.getElementById("file").files[0].path
        console.log(imgFile);
        var split = imgFile.split('/');
        if (split.length == 1) {
          split = imgFile.split('\\');
        }
        var fileEnd = split[split.length - 1];
        var newFile = this.lastID + "_original_" + fileEnd;
        fs.copyFile(imgFile,path.resolve(__dirname, "./img/" + newFile).replace('\app.asar', ''),0,function(err){
          if (err) {
            console.log(err);
          } else {
            console.log('upload complete!');
          }
        });
        var updateScene = "UPDATE anime_scenes SET anime_scene_file_name = '" + fileEnd + "' WHERE id = " + this.lastID;
        db.run(updateScene,[],function(err){
          if (err) console.log(err);
        });
      });
    });
  });
}

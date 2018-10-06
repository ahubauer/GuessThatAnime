const electron = require('electron');
const {remote, app, BrowserWindow} = require('electron');
const $ = require('jquery');
const path = require('path')
const sqlite3 = require('sqlite3').verbose();
const qs = require('querystring');

const dbPath = path.resolve(__dirname, 'gtaSQLite.db');
let db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    return console.error(err.message);
  }
  console.log('Connected to the in-memory SQlite database.');
});

var sceneID;

function setupEditor(id) {
  sceneID = id;
  var sql = "SELECT anime_scenes.id, anime_scenes.anime_series_id, anime_scenes.anime_scene_file_name, anime_scenes.episode, anime_series.name FROM anime_scenes INNER JOIN anime_series ON anime_scenes.anime_series_id = anime_series.id WHERE anime_scenes.id = " + id + " ORDER BY RANDOM() LIMIT 1";

  db.get(sql,[],function(err,result){
    if (err) console.log(err);
    $('#image').attr("src","./img/" + result.id + "_original_" + result.anime_scene_file_name);
    $('#image').width("300px");

    $('#series').text(result.name);

    $('#episode').text(result.episode);
  });

}

var seriesText = "";
var episodeText = "";
var isEditing = false;

function startEdit() {
  if (!isEditing) {
    isEditing = true;
    seriesText = $('#series').text();
    episodeText = $('#episode').text();

    $('#series').text("");
    $('#episode').text("");

    $('#series').html("<input id='seriesInput' type='text' >");
    $('#seriesInput').val(seriesText);

    $('#episode').html("<input id='episodeInput' type='text' >");
    $('#episodeInput').val(episodeText);

    $('#editButton').text('Save');
    $('#cancelButton').removeAttr('hidden');
  } else {
    console.log($('#seriesInput').val());
    var seriesCheckSql = "SELECT * FROM anime_series WHERE name = '" + $('#seriesInput').val() + "' LIMIT 1";
    db.get(seriesCheckSql,[],function(err,result){
      if (err) console.log(err);
      if (!result) {
        var newSeriesSql = "INSERT INTO anime_series(name) VALUES ('" + $('#seriesInput').val() + "')";
        db.run(newSeriesSql,[],function(err) {
          if (err) console.log(err);
          var updateSql = "UPDATE anime_scenes SET anime_series_id = " + this.lastID + ", episode = '" + $('#episodeInput').val() + "' WHERE id = " + sceneID;
          db.run(updateSql,[],function(err) {
            if (err) console.log(err);
            var si = $('#seriesInput').val();
            var ei = $('#episodeInput').val();
            $('#series').html('');
            $('#episode').html('');
            $('#series').text(si);
            $('#episode').text(ei);
            $('#editButton').text('Edit');
            $('#cancelButton').attr('hidden',"");
          });
        });
      } else {
        var updateSql = "UPDATE anime_scenes SET anime_series_id = " + result.id + ", episode = '" + $('#episodeInput').val() + "' WHERE id = " + sceneID;
        db.run(updateSql,[],function(err) {
          if (err) console.log(err);
          var si = $('#seriesInput').val();
          var ei = $('#episodeInput').val();
          $('#series').html('');
          $('#episode').html('');
          $('#series').text(si);
          $('#episode').text(ei);
          $('#editButton').text('Edit');
          $('#cancelButton').attr('hidden',"");
        });
      }
      isEditing = false;
    });
  }
}

function cancelEdit() {
  $('#series').html('');
  $('#episode').html('');
  $('#series').text(seriesText);
  $('#episode').text(episodeText);
  $('#editButton').text('Edit');
  $('#cancelButton').attr('hidden',"");
  isEditing = false;
}

function deleteScene() {
  if (confirm('Are you sure you want to delete this scene?')) {
    sql = "DELETE FROM anime_scenes WHERE id = " + sceneID;
    db.run(sql,[],function(err){
      if (err) {
        console.log(err)
      } else {
        remote.getCurrentWindow().close();
      }
    });
  }
}

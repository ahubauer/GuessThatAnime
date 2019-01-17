const electron = require('electron');
const {remote, app, BrowserWindow} = require('electron');
const fs = require('fs');
const $ = require('jquery');
const path = require('path')
const sqlite3 = require('sqlite3').verbose();
const qs = require('querystring');

const dbPath = path.resolve(__dirname, './gtaSQLite.db').replace('\app.asar', '');
let db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    return console.error(err.message);
  }
  console.log('Connected to the in-memory SQlite database.');
});

var sceneID;
var seriesID;

function setupEditor(id) {
  sceneID = id;
  var sql = "SELECT anime_scenes.id, anime_scenes.anime_series_id, anime_scenes.anime_scene_file_name, anime_scenes.episode, anime_series.name FROM anime_scenes INNER JOIN anime_series ON anime_scenes.anime_series_id = anime_series.id WHERE anime_scenes.id = " + id + " ORDER BY RANDOM() LIMIT 1";

  db.get(sql,[],function(err,result){
    if (err) console.log(err);
    seriesID = result.anime_series_id;

    $('#image').attr("src",path.resolve(__dirname, "./img/" + result.id + "_original_" + result.anime_scene_file_name).replace('\app.asar', ''));
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
    $('#checkboxContainer').removeAttr('hidden');
  } else {
    console.log($('#seriesInput').val());
    var seriesCheckSql = "SELECT * FROM anime_series WHERE name = '" + $('#seriesInput').val() + "' LIMIT 1";
    db.get(seriesCheckSql,[],function(err,result){
      if (err) console.log(err);
      var checked = document.getElementById('checkbox').checked;
      if (!result) {
        var newSeriesSql = "INSERT INTO anime_series(name) VALUES ('" + $('#seriesInput').val() + "')";
        db.run(newSeriesSql,[],function(err) {
          var getNew = "SELECT last_insert_rowid() AS id FROM anime_series LIMIT 1";
          db.run(getNew,[],function(err, newResult) {
            if (err) console.log(err);
            var setEpisode = checked ? "" : ", episode = '" + $('#episodeInput').val() + "'";
            var whereSql = checked ? "anime_series_id = " + seriesID: "id = " + sceneID;
            var updateSql = "UPDATE anime_scenes SET anime_series_id = " + newResult.id + setEpisode + " WHERE " + whereSql;
            console.log(updateSql);
            db.run(updateSql,[],function(err) {
              if (err) console.log(err);
              var si = $('#seriesInput').val();
              var ei = checked ? episodeText : $('#episodeInput').val();
              $('#series').html('');
              $('#episode').html('');
              $('#series').text(si);
              $('#episode').text(ei);
              $('#editButton').text('Edit');
              $('#cancelButton').attr('hidden',"");
              $('#checkboxContainer').attr('hidden',"");
            });
          });
        });
      } else {


        var setEpisode = checked ? "" : ", episode = '" + $('#episodeInput').val() + "'";
        var whereSql = checked ? "anime_series_id = " + seriesID: "id = " + sceneID;
        var updateSql = "UPDATE anime_scenes SET anime_series_id = " + result.id + setEpisode + " WHERE " + whereSql;
        console.log(updateSql);
        db.run(updateSql,[],function(err) {
          if (err) console.log(err);
          var si = $('#seriesInput').val();
          var ei = checked ? episodeText : $('#episodeInput').val();
          $('#series').html('');
          $('#series').html('');
          $('#episode').html('');
          $('#series').text(si);
          $('#episode').text(ei);
          $('#editButton').text('Edit');
          $('#cancelButton').attr('hidden',"");
          $('#checkboxContainer').attr('hidden',"");
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
  $('#checkboxContainer').attr('hidden',"");
  isEditing = false;
}

function deleteScene() {
  if (confirm('Are you sure you want to delete this scene?')) {
    imageSrc = $("#image").attr('src');
    fs.unlink(imageSrc,function(err) {
      if (err) {
        console.log(err);
      } else {
        console.log(imageSrc + " deleted");
      }
    });
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

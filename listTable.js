
const electron = require('electron');
const {remote, app, BrowserWindow} = require('electron');
const fs = require('fs');
const $ = require('jquery');
const path = require('path')
const sqlite3 = require('sqlite3').verbose();


const dbPath = path.resolve(__dirname, './gtaSQLite.db').replace('\app.asar', '');
let db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    return console.error(err.message);
  }
  console.log('Connected to the in-memory SQlite database.');
});

var pageIndex = 0;
var pageLimit = 20;
var pageLetter = "";
var pageSearch = "";


function clearTable() {
  var tbody = document.getElementById("tbody");
  while (tbody.firstChild) {
      tbody.removeChild(tbody.firstChild);
  }
}

function createList(page,limit,letter,search) {
  clearTable();



  var countSQL = "SELECT COUNT(*) AS total, anime_series.name AS name FROM anime_scenes INNER JOIN anime_series ON anime_scenes.anime_series_id = anime_series.id WHERE name < upper('" + letter + "') ORDER BY name";

  db.get(countSQL,[],(err, countResult) => {
    if (err) console.log(err);
    console.log("%d",countResult.total);

    if (countResult.total && letter != "") {
      page = countResult.total / limit;
    }

    pageIndex = page;
    pageLimit = limit;
    pageLetter = letter;
    pageSearch = search;

    var sqlLimit = "LIMIT " + (page * limit) + "," + limit;
    //var sqlLetter = letter == "" ? "" : "WHERE anime_series.name LIKE '" + letter + "%'";
    var sqlSearch = search == "" ? "" : "WHERE anime_series.name LIKE '%" + search + "%'";

    var sql = "SELECT anime_scenes.id, anime_scenes.anime_series_id, anime_scenes.anime_scene_file_name, anime_scenes.episode, anime_series.name FROM anime_scenes INNER JOIN anime_series ON anime_scenes.anime_series_id = anime_series.id " + sqlSearch + " ORDER BY anime_series.name ASC " + sqlLimit;

    db.each(sql,[],function(err, result) {
      if (err) console.log(err);
      var tbody = document.getElementById('tbody');

      var tr = document.createElement('tr');
      tbody.appendChild(tr);

      var titleCell = document.createElement('td');
      tr.appendChild(titleCell);

      var titleLink = document.createElement('a');
      titleLink.href = "#"
      titleLink.addEventListener('click',function(e){openEntry(result.id)});
      titleCell.appendChild(titleLink);

      var title = document.createTextNode(result.name);
      titleLink.appendChild(title);

      var imageCell = document.createElement('td');
      tr.appendChild(imageCell);

      var image = document.createElement('img');
      image.src = path.resolve(__dirname, "./img/" + result.id + "_original_" + result.anime_scene_file_name).replace('\app.asar', '');
      image.id = "image_" + result.id;
      image.width = 100;
      imageCell.appendChild(image);

      var episodeCell = document.createElement('td');
      tr.appendChild(episodeCell);

      var episode = document.createTextNode(result.episode);
      episodeCell.appendChild(episode);

      var deleteCell = document.createElement('td');
      deleteCell.setAttribute("style", "text-align: center;");
      tr.appendChild(deleteCell);

      var deleteButton = document.createElement('button');
      deleteButton.innerText = "Delete";
      deleteButton.setAttribute("style", "background-color: red;");
      deleteButton.setAttribute("onclick", "deleteEntry(" + result.id + ")");
      deleteCell.appendChild(deleteButton);


    });
  })




}



function pageBack() {
  var index = pageIndex == 0 ? 0 : pageIndex - 1;
  createList(index,pageLimit,"",pageSearch);
}

function pageForward() {
  createList(pageIndex + 1,pageLimit,"",pageSearch);
}

function letterFilter(letter){
  createList(0,pageLimit,letter,"");
}

function setPageMax(max) {
  createList(0,max,"",pageSearch);
}

function searchList(text) {
  console.log(text);
  createList(0,pageLimit,"",text);
}



function openEntry(id) {
  let popup = new remote.BrowserWindow({width: 700, height: 500});
  popup.loadFile('listEntry.html');
  //popup.webContents.openDevTools();

  var js = "setupEditor(" + id + ")";
  popup.webContents.executeJavaScript(js);

}

function deleteEntry(id) {
  if (confirm('Are you sure you want to delete this scene?')) {
    imageSrc = $("#image_" + id).attr('src');
    fs.unlink(imageSrc,function(err) {
      if (err) {
        console.log(err);
      } else {
        console.log(imageSrc + " deleted");
      }
    });

    sql = "DELETE FROM anime_scenes WHERE id = " + id;
    db.run(sql,[],function(err){
      if (err) {
        console.log(err)
      } else {
        createList(pageIndex,pageLimit,pageLetter,pageSearch);
      }
    });
  }
}

remote.getCurrentWindow().on('focus',function(){
  var noFile = remote.getCurrentWindow().webContents.getURL();
  noFile = noFile.replace("file://","");
  console.log(noFile);
  console.log(path.resolve(__dirname, 'list.html#'));
  if (noFile == path.resolve(__dirname, 'list.html#')) {
    createList(pageIndex,pageLimit,pageLetter,pageSearch);
  }
});

$( document ).ready(function() {
  createList(0,20,"","");
});

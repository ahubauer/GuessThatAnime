
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


  pageIndex = page;
  pageLimit = limit;
  pageLetter = letter;
  pageSearch = search;

  var sqlLimit = "LIMIT " + (page * limit) + "," + limit;
  var sqlLetter = letter == "" ? "" : "WHERE anime_series.name LIKE '" + letter + "%'";
  var sqlSearch = search == "" ? "" : "WHERE anime_series.name LIKE '%" + search + "%'";

  var sql = "SELECT anime_scenes.id, anime_scenes.anime_series_id, anime_scenes.anime_scene_file_name, anime_scenes.episode, anime_series.name FROM anime_scenes INNER JOIN anime_series ON anime_scenes.anime_series_id = anime_series.id " + sqlLetter + sqlSearch + " ORDER BY anime_series.name ASC " + sqlLimit;

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
    image.src = "./img/" + result.id + "_original_" + result.anime_scene_file_name;
    image.width = 100;
    imageCell.appendChild(image);

    var episodeCell = document.createElement('td');
    tr.appendChild(episodeCell);

    var episode = document.createTextNode(result.episode);
    episodeCell.appendChild(episode);
  });
}



function pageBack() {
  var index = pageIndex == 0 ? 0 : pageIndex - 1;
  createList(index,pageLimit,pageLetter,pageSearch);
}

function pageForward() {
  createList(pageIndex + 1,pageLimit,pageLetter,pageSearch);
}

function letterFilter(letter){
  createList(0,pageLimit,letter,"");
}

function setPageMax(max) {
  createList(0,max,pageLetter,pageSearch);
}

function searchList(text) {
  console.log(text);
  createList(0,pageLimit,"",text);
}



function openEntry(id) {
  let popup = new remote.BrowserWindow({width: 500, height: 500});
  popup.loadFile('listEntry.html');
  popup.webContents.openDevTools();

  var js = "setupEditor(" + id + ")";
  popup.webContents.executeJavaScript(js);

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




//autocomplete script

function autocomplete(inp, arr) {
  /*the autocomplete function takes two arguments,
  the text field element and an array of possible autocompleted values:*/
  var currentFocus;
  /*execute a function when someone writes in the text field:*/
  inp.addEventListener("input", function(e) {
      var a, b, i, val = this.value;
      /*close any already open lists of autocompleted values*/
      closeAllLists();
      if (!val) { return false;}
      currentFocus = -1;
      /*create a DIV element that will contain the items (values):*/
      a = document.createElement("DIV");
      a.setAttribute("id", this.id + "autocomplete-list");
      a.setAttribute("class", "autocomplete-items");
      /*append the DIV element as a child of the autocomplete container:*/
      this.parentNode.appendChild(a);
      /*for each item in the array...*/
      for (i = 0; i < arr.length; i++) {
        /*check if the item starts with the same letters as the text field value:*/
        if (arr[i].substr(0, val.length).toUpperCase() == val.toUpperCase()) {
          /*create a DIV element for each matching element:*/
          b = document.createElement("DIV");
          /*make the matching letters bold:*/
          b.innerHTML = "<strong>" + arr[i].substr(0, val.length) + "</strong>";
          b.innerHTML += arr[i].substr(val.length);
          /*insert a input field that will hold the current array item's value:*/
          b.innerHTML += "<input type='hidden' value='" + arr[i] + "'>";
          /*execute a function when someone clicks on the item value (DIV element):*/
              b.addEventListener("click", function(e) {
              /*insert the value for the autocomplete text field:*/
              inp.value = this.getElementsByTagName("input")[0].value;
              /*close the list of autocompleted values,
              (or any other open lists of autocompleted values:*/
              searchList(inp.value);
              closeAllLists();
          });
          a.appendChild(b);
        }
      }
  });
  /*execute a function presses a key on the keyboard:*/
  inp.addEventListener("keydown", function(e) {
      var x = document.getElementById(this.id + "autocomplete-list");
      if (x) x = x.getElementsByTagName("div");
      if (e.keyCode == 40) {
        /*If the arrow DOWN key is pressed,
        increase the currentFocus variable:*/
        currentFocus++;
        /*and and make the current item more visible:*/
        addActive(x);
      } else if (e.keyCode == 38) { //up
        /*If the arrow UP key is pressed,
        decrease the currentFocus variable:*/
        currentFocus--;
        /*and and make the current item more visible:*/
        addActive(x);
      } else if (e.keyCode == 13) {
        /*If the ENTER key is pressed, prevent the form from being submitted,*/
        e.preventDefault();
        searchList(inp.value);
        if (currentFocus > -1) {
          /*and simulate a click on the "active" item:*/
          if (x) x[currentFocus].click();
        }
      }
  });
  function addActive(x) {
    /*a function to classify an item as "active":*/
    if (!x) return false;
    /*start by removing the "active" class on all items:*/
    removeActive(x);
    if (currentFocus >= x.length) currentFocus = 0;
    if (currentFocus < 0) currentFocus = (x.length - 1);
    /*add class "autocomplete-active":*/
    x[currentFocus].classList.add("autocomplete-active");
  }
  function removeActive(x) {
    /*a function to remove the "active" class from all autocomplete items:*/
    for (var i = 0; i < x.length; i++) {
      x[i].classList.remove("autocomplete-active");
    }
  }
  function closeAllLists(elmnt) {
    /*close all autocomplete lists in the document,
    except the one passed as an argument:*/
    var x = document.getElementsByClassName("autocomplete-items");
    for (var i = 0; i < x.length; i++) {
      if (elmnt != x[i] && elmnt != inp) {
      x[i].parentNode.removeChild(x[i]);
    }
  }
}
/*execute a function when someone clicks in the document:*/
document.addEventListener("click", function (e) {
    closeAllLists(e.target);
});
}

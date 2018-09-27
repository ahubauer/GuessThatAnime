const {remote, app, BrowserWindow} = require('electron');
const fs = require('fs');
const request = require('request');
const $ = require('jquery');
const path = require('path')
const sqlite3 = require('sqlite3').verbose();
  // Keep a global reference of the window object, if you don't, the window will
  // be closed automatically when the JavaScript object is garbage collected.
  let win

  const dbPath = path.resolve(__dirname, 'gtaSQLite.db');
  let db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      return console.error(err.message);
    }
  });

  function createWindow () {
    // Create the browser window.
    win = new BrowserWindow({width: 1600, height: 600})

    // and load the index.html of the app.
    win.loadFile('play.html')


    win.webContents.openDevTools()

    // Emitted when the window is closed.
    win.on('closed', () => {
      win = null
    })
  }

  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  app.on('ready', createWindow)

  // Quit when all windows are closed.
  app.on('window-all-closed', () => {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
      app.quit()
    }
  })

  app.on('quit', function() {
  
  });


  app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (win === null) {
      createWindow()
    }
  })

  // In this file you can include the rest of your app's specific main process
  // code. You can also put them in separate files and require them here.



  // function called on click of scene
  // function openScene(id,name) {
  //
  //   var img = new Image();
  //   var url = "./img/" + id + "_original_" + name;
  //   img.onload = function(){
  //     var h = img.height;
  //     var w = img.width;
  //
  //     // make a new window
  //     let popup = new remote.BrowserWindow({width: w + 50, height: h + 100});
  //
  //
  //     popup.loadFile('popup.html');
  //     //popup.webContents.openDevTools();
  //     var js = "$('#myCanvas').css('background-image','url(" + url + ")'); var c = document.getElementById('myCanvas'); c.width = " + w + ";c.height = " + h + ";";
  //     popup.webContents.executeJavaScript(js);
  //   }
  //   img.src = url;
  //
  //
  //   //create and execute sql query
  //   var sql = " SELECT anime_scenes.episode, anime_series.name FROM anime_scenes INNER JOIN anime_series ON anime_scenes.anime_series_id = anime_series.id WHERE anime_scenes.id = " + id + " ORDER BY RANDOM() LIMIT 1";
  //   db.all(sql,[],(err, result) => {
  //     if (err) throw err;
  //
  //     $("#selectedTitle").text(result[0].name);
  //     $("#selectedEpisode").text(result[0].episode);
  //
  //   });
  //
  //   // con.query(sql, function (err, result) {
  //   //   if (err) throw err;
  //   //
  //   //   $("#selectedTitle").text(result[0].name);
  //   //   $("#selectedEpisode").text(result[0].episode);
  //   //
  //   // });
  //
  // }


  // function replaceScene(index) {
  //
  //
  //   //create and execute sql query
  //   var sql = " SELECT anime_scenes.id, anime_scenes.anime_scene_file_name, anime_series.name FROM anime_scenes INNER JOIN anime_series ON anime_scenes.anime_series_id = anime_series.id ORDER BY RANDOM() LIMIT 1";
  //
  //   db.all(sql,[],(err, result) => {
  //     if (err) throw err;
  //     //assemble HTML from query results
  //
  //     var thumbSrc = "./img/" + result[0].id + "_thumb_" + result[0].anime_scene_file_name;
  //     $("#thumbPic" + index).attr("src", thumbSrc);
  //     var popupLink = "javascript:openScene(" + result[0].id + ", '" + result[0].anime_scene_file_name + "'); replaceScene(" + index + ");";
  //     $("#thumbLink" + index).attr("href", popupLink);
  //     $("#title" + index).text(result[0].name);
  //     $("#title" + index).attr("href", popupLink);
  //   });
  //
  //   // con.query(sql, function (err, result) {
  //   //   if (err) throw err;
  //   //   //assemble HTML from query results
  //   //
  //   //   var thumbSrc = "http://genericon.pipian.com/uploads/anime_scenes/" + result[0].id + "/thumb/" + result[0].anime_scene_file_name;
  //   //   $("#thumbPic" + index).attr("src", thumbSrc);
  //   //   var popupLink = "javascript:openScene(" + result[0].id + ", '" + result[0].anime_scene_file_name + "'); replaceScene(" + index + ");";
  //   //   $("#thumbLink" + index).attr("href", popupLink);
  //   //   $("#title" + index).text(result[0].name);
  //   //   $("#title" + index).attr("href", popupLink);
  //   //
  //   // });
  // }

  // function dlImages() {
  //   var sql = "SELECT * FROM anime_scenes";
  //
  //
  //   db.all(sql,[],function(err,result) {
  //     if (err) throw err;
  //     var i = 0;
  //     var download = function(id, size, name) {
  //       var uri = "http://genericon.pipian.com/uploads/anime_scenes/" + id + "/" + size + "/" + name;
  //       request.head(uri, function(err, res, body){
  //         var filename = id + "_" + size + "_" + name;
  //         var callback = function(){};
  //         if (i < result.length) {
  //           callback = function() {
  //             download(result[i].id,"original",result[i].anime_scene_file_name);
  //           };
  //         }
  //         var r = request(uri).pipe(fs.createWriteStream("./img/" + filename)).on('close', callback).on('clientError',function(err,socket){
  //           i--;
  //           callback();
  //         });
  //         var percent = i / result.length * 100;
  //         console.log(percent);
  //         i++;
  //       });
  //     }
  //     download(result[0].id,"original",result[0].anime_scene_file_name);
  //
  //
  //   });
  // }

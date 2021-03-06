const {remote, app, BrowserWindow} = require('electron');
const electron = require('electron');
  // Keep a global reference of the window object, if you don't, the window will
  // be closed automatically when the JavaScript object is garbage collected.
  let win


  function createWindow () {
    // Create the browser window.
    var screen = electron.screen.getAllDisplays()[0];
    win = new BrowserWindow({width: screen.bounds.width, height: screen.bounds.height});

    // and load the index.html of the app.
    win.loadFile('play.html')


    //win.webContents.openDevTools()

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

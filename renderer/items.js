// Modules
const { BrowserWindow, shell } = require('electron').remote
const fs = require('fs')

// DOM nodes
const items = document.getElementById("items")

// get readerJS content
// let readerJS
// fs.readFile(`${__dirname}/reader.js`, (err, data) => {
//     readerJS = data.toString()
// })

// track items in storage
exports.storage = JSON.parse(localStorage.getItem('readit-items')) || []

// list for "done" message from reader window
window.addEventListener('message', e => {
    alert(e)
    console.log(e.data)
})

// Get selected item index
exports.getSelectedItem = () => {

    // Get selected node
    let currentItem = document.getElementsByClassName('read-item selected')[0]
  
    // Get item index
    let itemIndex = 0
    let child = currentItem
    while( (child = child.previousElementSibling) != null ) itemIndex++
  
    // Return selected item and index
    return { node: currentItem, index: itemIndex }
}

// persist storage
exports.save = () => {
    localStorage.setItem('readit-items', JSON.stringify(this.storage))
}

// Delete item
exports.delete = itemIndex => {
    // Remove item from DOM
    items.removeChild( items.childNodes[itemIndex] )

    // Remove item from storage
    this.storage.splice(itemIndex, 1)

    // Persist storage
    this.save()

    // Select previous item or new top item
    if (this.storage.length) {

        // Get new selected item index
        let = newSelectedItemIndex = (itemIndex === 0) ? 0 : itemIndex - 1

        // Select item at new index
        document.getElementsByClassName('read-item')[newSelectedItemIndex].classList.add('selected')
    }
}

// set item as selected
exports.select = e => {
    // remove currently selected item class
    document.getElementsByClassName('read-item selected')[0].classList.remove('selected')

    // add to clicked item
    e.currentTarget.classList.add('selected')
}

// move to newly selected item
exports.changeSelection = direction => {
    // get selected item
    let currentItem = document.getElementsByClassName('read-item selected')[0]

    // handle up/down
    if (direction === 'ArrowUp' && currentItem.previousElementSibling) {
        currentItem.classList.remove('selected')
        currentItem.previousElementSibling.classList.add('selected')
    } else if (direction === 'ArrowDown' && currentItem.nextElementSibling) {
        currentItem.classList.remove('selected')
        currentItem.nextElementSibling.classList.add('selected')
    }
}

// open selected item in native browser
exports.openNative = () => {

    // Only if we have items (in case of menu open)
    if ( !this.storage.length ) return
  
    // Get selected item
    let selectedItem = this.getSelectedItem()
  
    // Get item's url
    let contentURL = selectedItem.node.dataset.url
  
    // Open in user's default system browser
    shell.openExternal(contentURL)
}

// open selected item
exports.open = () => {
    // only if we have items (in case of menu open)
    if (!this.storage.length) return
    
    // get selected item
    let selectedItem = document.getElementsByClassName('read-item selected')[0]

    // get items url
    let contentURL = selectedItem.dataset.url

    // open item in proxy BrowserWindow
    let readerWin = new BrowserWindow({
        width: 1200,
        height: 800,
        maxWidth: 2000,
        maxHeight: 2000,
        backgroundColor: '#DEDEDE',
        webPreferences: { 
            nodeIntegration: false,
            contextIsolation: true,
            enableRemoteModule: true
        }
    })

    readerWin.loadURL(contentURL)

    // lesson code
    // let readerWin = window.open(contentURL, '', `
    //     maxWidth=2000,
    //     maxHeight=2000,
    //     width=1200,
    //     height=800,
    //     backgroundColor=#DEDEDE,
    //     nodeIntegration=1,
    //     contextIsolation=1
    // `)

    // inject JavaScript
    // lesson code
    // readerWin.eval(readerJS)
    readerWin.webContents.once('dom-ready', () => {
        readerWin.webContents.executeJavaScript(`
            // create button in remote content to mark item as "Done"
            let readitClose = document.createElement('div')
            readitClose.innerText = 'Done'
            
            // style button
            readitClose.style.position = 'fixed'
            readitClose.style.bottom = '15px'
            readitClose.style.right = '15px'
            readitClose.style.padding = '5px 10px'
            readitClose.style.fontSize = '20px'
            readitClose.style.fontWeight = 'bold'
            readitClose.style.background = 'dodgerblue'
            readitClose.style.color = 'white'
            readitClose.style.borderRadius = '5px'
            readitClose.style.cursor = 'default'
            readitClose.style.boxShadow = '2px 2px 2px rgba(0,0,0,0.2)'
            readitClose.style.zIndex = '9999'

            // attach click handler
            readitClose.onclick = e => {
                alert(e)
                // message parent (opener) window
                window.opener.postMessage('item-done', '*')
            }
            
            // append button to body
            document.getElementsByTagName('body')[0].append(readitClose)
        `)
    })
}

//Add new item
exports.addItem = (item, isNew = false) => {
    // create a new DOM node
    let itemNode = document.createElement('div')

    // assign "read-item" class
    itemNode.setAttribute('class', 'read-item')

    // set item url as data attribute
    itemNode.setAttribute('data-url', item.url)

    // add inner HTML
    itemNode.innerHTML = `<img src="${item.screenshot}"><h2>${item.title}</h2>`

    // append new node to "items"
    items.appendChild(itemNode)

    // attach click handler to select
    itemNode.addEventListener('click', this.select)

    // attach doubleclick handler to open
    itemNode.addEventListener('dblclick', this.open)

    // if this is the first item, select it
    if (document.getElementsByClassName('read-item').length === 1) {
        itemNode.classList.add('selected')
    }

    // add item to storage and persist
    if (isNew) {
        this.storage.push(item)
        this.save()
    }
}

// add items from storage when app loads
this.storage.forEach(item => {
    this.addItem(item, false)
});
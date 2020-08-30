import '@material/mwc-button/mwc-button.js'
import '@material/mwc-textfield/mwc-textfield.js'
import { ipcRenderer, shell } from 'electron'

const form = document.getElementById('form');
const code = document.getElementById('code');
const auth = document.getElementById('auth-url');

ipcRenderer.on('auth-url', (event, url)=>{
  auth.innerText = url;
  auth.href = url;
})

form.onsubmit = (event)=>{
  event.preventDefault();
  console.log(code.value);
  ipcRenderer.send('submit-code', code.value)
}

document.querySelectorAll('a').forEach((a)=>{
  a.onclick = (e)=>{
    e.preventDefault();
    shell.openExternal(a.href);
  }
})

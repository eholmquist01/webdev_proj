import { useState } from 'react'
import heroImg from './assets/hero.png'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import './App.css'
import Parse from "parse";

Parse.initialize("LG9Z5QPaxemHcp1R5ENzej17Dt4FVFmnZaGhdJy5", "LF6yM7u7jES772l9wLgpRacpjng5H1WuvQIpcDEs");
Parse.serverURL = "https://parseapi.back4app.com/";

function App() {

  console.log("Parse:", )

  const [count, setCount] = useState(0)

  return (
    <div><h1>Modern Web Dev</h1></div>
  )
}

export default App

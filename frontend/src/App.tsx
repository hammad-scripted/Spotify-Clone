import './App.css'
import { Show, SignInButton, SignUpButton, UserButton } from '@clerk/react'
import {Button} from './components/ui/button'
function App() {
  return (
    <>
      <header>
        <Show when="signed-out">
         <Button><SignInButton /></Button> 
          <SignUpButton />
        </Show>
        <Show when="signed-in">
          <UserButton />
        </Show>
      </header>
    </>
  )
}

export default App
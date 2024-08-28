import { currentGamedata } from "../../Player";
import KenoBaseGame from "./KenoBaseGame/BaseGame";


export default class KenoGame  {
    public currentGame : any;
   
     constructor(public currentGameData: currentGamedata) {
       console.log(currentGameData.gameSettings.id);
       
       if(!currentGameData.gameSettings.isSpecial)
       {
         this.currentGame = new KenoBaseGame(currentGameData);
       }
       else{
         console.log("Special Game KNEOOOO ");
         
       }
     }
   
   }
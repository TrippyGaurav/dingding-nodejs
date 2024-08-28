import { currentGamedata } from "../../../Player";


export default class KenoBaseGame  {
    
     constructor(public currentGameData: currentGamedata) {
       console.log(currentGameData.gameSettings.id);
       
       if(!currentGameData.gameSettings.isSpecial)
       {
        console.log(" Not KENO Special Game ");
         
       }
       else{ 
          console.log("  KENO Special Game ");
         
         
       }
     }
   
   }
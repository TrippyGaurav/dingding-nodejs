import { currentGamedata } from "../Player";
import KenoGameManager from "./KenoGames/KenoGames";
import SlotGameManager from "./slotGames/slotGame";


export default class GameManager  {
    public currentGame : any;
    public SlotGameManager : SlotGameManager;
    public KenoGameManager : KenoGameManager;
   
     constructor(public currentGameData: currentGamedata) {
        const currentGameType = currentGameData.gameSettings.id.substring(0, 2);
        console.log("Current Game Type : ",currentGameType);
        if(currentGameType == "SL")
        this.SlotGameManager = new SlotGameManager(currentGameData);
        if(currentGameType == "KN")
        this.KenoGameManager = new KenoGameManager(currentGameData);
      
     }
   
   }
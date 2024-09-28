import { currentGamedata } from "../../Player";
import BaseSlotGame from "./BaseSlotGame/BaseSlotGame";
import { SLCM } from "./SL-CM/cashMachineBase";
import { SLCRZ } from "./SL-CRZ/crazy777Base";
import { SLWOF } from "./SL-WOF/wheelOfFortuneBase";
import { SLPM } from "./SL-PM(MOOLAH)/planetMoolahBase"
import { SLONE } from "./SL-ONE/OneOfAKindBase";
export default class SlotGameManager {
  public currentGame: any;

  gameClassMapping: { [key: string]: any } = {
    "SL-CM": SLCM, "SL-CRZ": SLCRZ, "SL-WOF": SLWOF, "SL-PM": SLPM, "SL-ONE": SLONE
  };

  constructor(public currentGameData: currentGamedata) {

    // console.log("Requesting Game : ",currentGameData.gameSettings.id);

    const slotGameClass = this.gameClassMapping[currentGameData.gameSettings.id];

    if (slotGameClass) {
      this.currentGame = new slotGameClass(currentGameData);
    } else {
      this.currentGame = new BaseSlotGame(currentGameData);
      // throw new Error(`No game class found for id: ${currentGameData.gameSettings.id}`);
    }
  }
}




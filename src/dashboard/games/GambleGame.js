"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.gambleCardGame = exports.GAMBLETYPE = void 0;
var GAMBLETYPE;
(function (GAMBLETYPE) {
    GAMBLETYPE["BlACKRED"] = "BlACKRED";
    GAMBLETYPE["HIGHCARD"] = "HIGHCARD";
})(GAMBLETYPE || (exports.GAMBLETYPE = GAMBLETYPE = {}));
class gambleCardGame {
    constructor(sltGame) {
        this.sltGame = sltGame;
        this.suits = ['Hearts', 'Diamonds', 'Clubs', 'Spades'];
        this.values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
        this.suitRanks = { 'Hearts': 1, 'Diamonds': 2, 'Clubs': 3, 'Spades': 4 };
        this.initialUpdate = false;
        this.resetGamble();
    }
    createDeck() {
        const deck = [];
        for (const suit of this.suits) {
            for (const value of this.values) {
                deck.push({ suit, value });
            }
        }
        return deck;
    }
    getRandomCard() {
        let randomIndex;
        let randomCard;
        do {
            randomIndex = Math.floor(Math.random() * this.deck.length);
            randomCard = this.deck[randomIndex];
        } while (this.chosenCards.has(`${randomCard.value}-${randomCard.suit}`));
        this.chosenCards.add(`${randomCard.value}-${randomCard.suit}`);
        return randomCard;
    }
    isCardRed(card) {
        return card.suit === 'Hearts' || card.suit === 'Diamonds';
    }
    isCardBlack(card) {
        return card.suit === 'Clubs' || card.suit === 'Spades';
    }
    getCardValue(card) {
        return this.values.indexOf(card.value);
    }
    getCardSuitRank(card) {
        return this.suitRanks[card.suit];
    }
    compareCards(card1, card2) {
        const valueComparison = this.getCardValue(card1) - this.getCardValue(card2);
        if (valueComparison !== 0) {
            return valueComparison;
        }
        else {
            return this.getCardSuitRank(card1) - this.getCardSuitRank(card2);
        }
    }
    sendInitGambleData(gameType) {
        let gambleData;
        if (gameType == GAMBLETYPE.BlACKRED)
            return gambleData = { card: this.getRandomCard() };
        if (gameType == GAMBLETYPE.HIGHCARD)
            return gambleData = { playerCard: this.getRandomCard(), dealerCard: this.getRandomCard() };
    }
    getResult(data) {
        const gambleData = data.GambleData;
        let resultData = {
            playerWon: false,
            winningAmount: 0
        };
        let result;
        if (gambleData.gameType == GAMBLETYPE.BlACKRED) {
            result = this.checkForRedBlack(gambleData.chosenCard.pl, gambleData.isCardBlack);
            if (result) {
                resultData.winningAmount = this.sltGame.settings._winData.totalWinningAmount * 2;
                resultData.playerWon = true;
                this.sltGame.sendMessage("GambleResult", resultData);
                if (!this.initialUpdate) {
                    this.initialUpdate = true;
                    this.sltGame.updatePlayerBalance(this.sltGame.settings._winData.totalWinningAmount);
                    return;
                }
                this.sltGame.updatePlayerBalance(this.sltGame.settings._winData.totalWinningAmount * 2);
                return;
            }
            else {
                this.sltGame.deductPlayerBalance(this.sltGame.settings._winData.totalWinningAmount);
                resultData.winningAmount = 0;
                resultData.playerWon = false;
                this.sltGame.sendMessage("GambleResult", resultData);
                return;
            }
            //RESULT == TRUE MEANS PLAYER WON MAKE IT FOR IF PLAYER HAS NOT WON
            //UPDATE AMOUNT IF WONNN ELSE MAKE IT ZERO
        }
        if (gambleData.gameType == GAMBLETYPE.HIGHCARD) {
            result = this.playHighCard(gambleData.gameTypechosenCard.pl, gambleData.gameType.chosenCard.pl);
        }
        if (result) {
            resultData.winningAmount = this.sltGame.settings._winData.totalWinningAmount * 2;
            resultData.playerWon = true;
            this.sltGame.sendMessage("GambleResult", resultData);
            if (!this.initialUpdate) {
                this.initialUpdate = true;
                this.sltGame.updatePlayerBalance(this.sltGame.settings._winData.totalWinningAmount);
                return;
            }
            this.sltGame.updatePlayerBalance(this.sltGame.settings._winData.totalWinningAmount * 2);
            return;
        }
        else {
            this.sltGame.deductPlayerBalance(this.sltGame.settings._winData.totalWinningAmount);
            resultData.winningAmount = 0;
            resultData.playerWon = false;
            this.sltGame.sendMessage("GambleResult", resultData);
            return;
        }
    }
    checkForRedBlack(plCard, isCardBlack) {
        if (isCardBlack) {
            return this.isCardBlack(plCard);
        }
        else
            return this.isCardRed(plCard);
    }
    playHighCard(plCard, dlCard) {
        console.log(`Player's card: ${plCard.value} of ${plCard.suit}`);
        console.log(`Dealer's card: ${dlCard.value} of ${dlCard.suit}`);
        const comparisonResult = this.compareCards(plCard, dlCard);
        if (comparisonResult > 0) {
            return true;
        }
        else {
            return false;
        }
    }
    resetGamble() {
        this.deck = this.createDeck();
        this.chosenCards = new Set();
        this.initialUpdate = false;
    }
}
exports.gambleCardGame = gambleCardGame;
// cardGame.playHighCard();
// cardGame.playRedOrBlack();

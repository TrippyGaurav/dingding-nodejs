class CardGame {
    constructor() {
        this.suits = ['Hearts', 'Diamonds', 'Clubs', 'Spades'];
        this.values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
        this.suitRanks = { 'Hearts': 1, 'Diamonds': 2, 'Clubs': 3, 'Spades': 4 };
        this.deck = this.createDeck();
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
        const randomIndex = Math.floor(Math.random() * this.deck.length);
        return this.deck[randomIndex];
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
    playRedOrBlack() {
        const playerCard = this.getRandomCard();
        const isBlack = this.isCardBlack(playerCard);
        console.log(`Player's card is ${isBlack ? 'black' : 'red'}.`);
    }
    playHighCard() {
        const playerCard = this.getRandomCard();
        const dealerCard = this.getRandomCard();
        console.log(`Player's card: ${playerCard.value} of ${playerCard.suit}`);
        console.log(`Dealer's card: ${dealerCard.value} of ${dealerCard.suit}`);
        const comparisonResult = this.compareCards(playerCard, dealerCard);
        if (comparisonResult > 0) {
            console.log('Player has the bigger card.');
        }
        else if (comparisonResult < 0) {
            console.log('Dealer has the bigger card.');
        }
        else {
            console.log("It's a tie.");
        }
    }
}
const cardGame = new CardGame();
// cardGame.playHighCard();
// cardGame.playRedOrBlack();

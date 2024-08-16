"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ComboCounter {
    constructor(maxCounterValues) {
        this.maxCounterValues = maxCounterValues;
        this.combo = [];
        this.maxCounterValues.forEach((p) => {
            this.combo.push(0);
        });
        this.firstCombo = true;
    }
    nextCombo() {
        if (this.firstCombo) {
            this.firstCombo = false;
            return true;
        }
        for (let i = this.maxCounterValues.length - 1; i >= 0; i--) {
            if (this.combo[i] < this.maxCounterValues[i]) {
                this.combo[i]++;
                if (i != this.maxCounterValues.length - 1) {
                    // reset low "bits"
                    for (var j = i + 1; j < this.maxCounterValues.length; j++) {
                        this.combo[j] = 0;
                    }
                }
                return true;
            }
        }
        return false;
    }
    sum() {
        let s = 0;
        this.combo.forEach((ci) => {
            s += ci;
        });
        return s;
    }
    getComboCounts() {
        let counts = 1;
        this.maxCounterValues.forEach((p) => {
            if (p != 0)
                counts *= p;
        });
    }
}
exports.default = ComboCounter;

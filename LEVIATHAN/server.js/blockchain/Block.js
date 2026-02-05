const crypto = require('crypto');

class Block {
    constructor(index, timestamp, data, previousHash = '', skipHashCalculation = false) {
        this.index = index;
        this.timestamp = timestamp;
        this.data = data; // Transaction data
        this.previousHash = previousHash;
        this.nonce = 0;
        if (!skipHashCalculation) {
            this.hash = this.calculateHash();
        }
    }

    calculateHash() {
        // Use timestamp as milliseconds for consistency
        const timestampMs = typeof this.timestamp === 'object' 
            ? this.timestamp.getTime() 
            : this.timestamp;
            
        return crypto
            .createHash('sha256')
            .update(
                this.index +
                this.previousHash +
                timestampMs +
                JSON.stringify(this.data) +
                this.nonce
            )
            .digest('hex');
    }

    mineBlock(difficulty) {
        const target = Array(difficulty + 1).join('0');
        
        while (this.hash.substring(0, difficulty) !== target) {
            this.nonce++;
            this.hash = this.calculateHash();
        }

        console.log(`Block mined: ${this.hash} (nonce: ${this.nonce})`);
    }
}

module.exports = Block;

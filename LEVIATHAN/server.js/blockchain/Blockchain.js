const Block = require('./Block');
const pool = require('../config.db/db');

class Blockchain {
    constructor() {
        this.chain = [];
        this.difficulty = 2; // Low difficulty as requested
        this.pendingTransactions = [];
        this.miningReward = 100; // Constant mining reward
    }

    async initialize() {
        // Load blockchain from database or create genesis block
        const [blocks] = await pool.promise().query(
            'SELECT * FROM blockchain ORDER BY block_index ASC'
        );

        if (blocks.length === 0) {
            // Create genesis block
            const genesisBlock = this.createGenesisBlock();
            this.chain.push(genesisBlock);
            await this.saveBlockToDatabase(genesisBlock);
        } else {
            // Load existing blockchain
            this.chain = blocks.map(b => {
                const block = new Block(
                    b.block_index,
                    new Date(b.timestamp),
                    JSON.parse(b.data),
                    b.previous_hash,
                    true // Skip hash calculation when loading from DB
                );
                block.hash = b.hash;
                block.nonce = b.nonce;
                return block;
            });
        }
    }

    createGenesisBlock() {
        const genesisBlock = new Block(0, new Date(), {
            type: 'GENESIS',
            message: 'Genesis Block - Delivery Partner System'
        }, '0');
        genesisBlock.mineBlock(this.difficulty);
        return genesisBlock;
    }

    getLatestBlock() {
        return this.chain[this.chain.length - 1];
    }

    async addBlock(transactionData) {
        const newBlock = new Block(
            this.chain.length,
            new Date(),
            transactionData,
            this.getLatestBlock().hash
        );

        // Mine the block
        console.log(`Mining block ${newBlock.index}...`);
        const miningStartTime = Date.now();
        newBlock.mineBlock(this.difficulty);
        const miningTime = Date.now() - miningStartTime;
        console.log(`Block mined in ${miningTime}ms`);

        // Validate before adding
        if (this.isValidNewBlock(newBlock, this.getLatestBlock())) {
            this.chain.push(newBlock);
            await this.saveBlockToDatabase(newBlock);
            return { success: true, block: newBlock, miningTime };
        } else {
            return { success: false, error: 'Invalid block' };
        }
    }

    isValidNewBlock(newBlock, previousBlock) {
        if (previousBlock.index + 1 !== newBlock.index) {
            console.log('Invalid index');
            return false;
        }
        if (previousBlock.hash !== newBlock.previousHash) {
            console.log('Invalid previous hash');
            return false;
        }
        if (newBlock.calculateHash() !== newBlock.hash) {
            console.log('Invalid hash');
            return false;
        }
        // Check proof of work
        const target = Array(this.difficulty + 1).join('0');
        if (newBlock.hash.substring(0, this.difficulty) !== target) {
            console.log('Invalid proof of work');
            return false;
        }
        return true;
    }

    isChainValid() {
        for (let i = 1; i < this.chain.length; i++) {
            const currentBlock = this.chain[i];
            const previousBlock = this.chain[i - 1];

            if (!this.isValidNewBlock(currentBlock, previousBlock)) {
                return false;
            }
        }
        return true;
    }

    getChainValidationDetails() {
        const invalidBlocks = [];
        let isValid = true;
        
        for (let i = 1; i < this.chain.length; i++) {
            const currentBlock = this.chain[i];
            const previousBlock = this.chain[i - 1];
            
            if (!this.isValidNewBlock(currentBlock, previousBlock)) {
                isValid = false;
                invalidBlocks.push({
                    index: currentBlock.index,
                    reason: this.getInvalidReason(currentBlock, previousBlock)
                });
            }
        }
        
        return { isValid, invalidBlocks };
    }

    getInvalidReason(currentBlock, previousBlock) {
        if (previousBlock.index + 1 !== currentBlock.index) {
            return 'Invalid block index';
        }
        if (previousBlock.hash !== currentBlock.previousHash) {
            return 'Previous hash mismatch';
        }
        if (currentBlock.calculateHash() !== currentBlock.hash) {
            return 'Block hash tampered';
        }
        const target = Array(this.difficulty + 1).join('0');
        if (currentBlock.hash.substring(0, this.difficulty) !== target) {
            return 'Invalid proof of work';
        }
        return 'Unknown error';
    }

    async saveBlockToDatabase(block) {
        await pool.promise().query(
            `INSERT INTO blockchain (block_index, timestamp, data, previous_hash, hash, nonce) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
                block.index,
                block.timestamp,
                JSON.stringify(block.data),
                block.previousHash,
                block.hash,
                block.nonce
            ]
        );
    }

    getChain() {
        return this.chain;
    }
}

module.exports = Blockchain;

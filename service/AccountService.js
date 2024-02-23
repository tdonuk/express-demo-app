const BaseService = require("./baseService");
const db = require("../db");


class AccountService extends BaseService {
    table() {
        return "ACCOUNTS";
    }

    async findByCustomSQL(sql) {
        const queryString = `SELECT * FROM ${this.table()} ${sql}`;

        return await db.findByCustomSQL(queryString);
    }
} 

module.exports = new AccountService();
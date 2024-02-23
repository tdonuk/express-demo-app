const BaseService = require("./baseService");

const db = require("../db");

class UserService extends BaseService {
    table() {
        return "USERS";
    }

    async findByEmail(email) {
        return await db.findByExample(this.table(), {sortField: "cdate", sortOrder: "DESC", fields: {email: email}});
    }
}


module.exports = new UserService();
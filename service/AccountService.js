const BaseService = require("./baseService");


class AccountService extends BaseService {
    fieldPath(initialPath) {
        return initialPath ? initialPath + "/accounts" : "accounts";
    }
} 

module.exports = new AccountService();
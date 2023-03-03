const BaseService = require("./baseService");

const bcrypt = require("bcrypt");

const firestore = require("firebase-admin").firestore();

class UserService extends BaseService {
    fieldPath(initialPath) {
        return initialPath ? initialPath + "/users" : "users";
    }

    async findByEmail(email) {
        let user;

        await firestore.collection(this.fieldPath()).where("email", "==", email).get().then((value) => {
            console.log(`found ${value.size} users with email '${email}'`);
    
            if(value.size > 1){
                throw new Error("email conflict");
            }
            else if(value.size === 0) {
                return undefined;
            }
    
            user = value.docs.pop().data();
        });

        return user;
    }
}


module.exports = new UserService();
const firestore = require("firebase-admin").firestore();

class BaseService {
    constructor() {
        if(this.constructor === BaseService) {
            throw new Error("illegal initialization of BaseService");
        }
    }

    fieldPath(initialPath) {
        throw new Error("not implemented");
    }

    async getByField(field, value) {
        let data = [];
        await firestore.collection(this.fieldPath(ownerPath && ownerPath)).where(field, "==", value).get().then((value) => {
            console.log(`found ${value.size} ${this.fieldPath(ownerPath && ownerPath)} where ${field}= '${value}'`);
    
            data = value.docs.map(doc => doc.data());
        });
        return data;
    }

    async find(pager = {filter: [], first: 0, pageSize: null, orderBy: "cdate", order: "desc"}, ownerPath) {
        const filter = pager.filter || [];
        const first = pager.first || 0;
        const pageSize = pager.pageSize;

        console.log("fetching " + this.fieldPath(ownerPath && ownerPath) + " with pager= " + JSON.stringify(pager));

        let query = firestore.collection(this.fieldPath(ownerPath && ownerPath)).offset(first);
        let queryFilter;
        for(let f of filter) {
            queryFilter = f.split(" ");

            console.log("FILTER: " + queryFilter);

            if(queryFilter.length !== 3) throw new Error("invalid filter");

            query = query.where(queryFilter[0], queryFilter[1], queryFilter[2]);
        }

        if(pageSize) query = query.limit(pageSize).orderBy(pager.orderBy, pager.order);

        return (await query.get()).docs.map(doc => doc.data());
    }

    async count(filter=[], ownerPath) {
        console.log("counting " + this.fieldPath(ownerPath && ownerPath) + " with filter= " + JSON.stringify(filter));

        let query = firestore.collection(this.fieldPath(ownerPath && ownerPath)).where("email", "!=", null);
        let queryFilter;
        for(let f of filter) {
            queryFilter = f.pop().split(" ");

            if(queryFilter.length !== 3) throw new Error("invalid filter");

            query = query.where(query[0], query[1], query[2]);
        }

        return (await query.count().get()).data().count;
    }

    async save(data, ownerPath) {
        console.log("saving at " + this.fieldPath(ownerPath && ownerPath) + " with data= " + JSON.stringify(data));

        const collection = firestore.collection(this.fieldPath(ownerPath && ownerPath));

        if(data.id) {
            console.log("UPDATE: " + JSON.stringify(data));
            data.udate = Date.now();
            (await collection.doc(data.id).set(data, {merge: true}));  // firestore doesn't support serialization of custom objects that is initialized by 'new' operator
        }
        else {
            data.cdate = Date.now();
            const docReference = collection.doc();

            data.id = docReference.id;

            console.log("CREATE: " + JSON.stringify(data));
            
            await  docReference.create(data);
        }

        return data;
    }

    async delete(id, ownerPath) {
        console.log("deleting at " + this.fieldPath(ownerPath && ownerPath) + " for id: " + id);

        try {
            await firestore.collection(this.fieldPath(ownerPath && ownerPath)).doc(id).delete({exists: true});

            return true;
        } catch(err) {
            return false;
        }
    }

    async deleteAll(ownerPath) {
        console.log("deleting at " + this.fieldPath(ownerPath && ownerPath));

        try {
            await firestore.collection(this.fieldPath(ownerPath && ownerPath)).get().then(querySnapshot => {
                querySnapshot.docs.forEach(doc => doc.ref.delete({exists: true}));
            });

            return true;
        } catch(err) {
            return false;
        }
    }

    async exists(id, ownerPath) {
        return (await firestore.collection(this.fieldPath(ownerPath && ownerPath)).doc(id).get()).exists;
    }
}

module.exports = BaseService;

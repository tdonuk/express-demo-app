const db = require("../db");

class BaseService {
    constructor() {
        if (this.constructor === BaseService) {
            throw new Error("illegal initialization of BaseService");
        }
    }

    table() {
        throw new Error("not implemented");
    }

    async getByField(filter) {
        let data = [];

        //TODO: SQL Select

        return data;
    }

    async find(pager = {fields: {}, first: 0, pageSize: null, orderBy: "cdate", order: "DESC"}) {
        const fields = pager.fields || null;
        const first = pager.first || 0;
        const pageSize = pager.pageSize;

        //TODO: implement pagination

        console.log("fetching " + this.table() + " with pager= " + JSON.stringify(pager));

        return await db.findByExample(this.table(), {
            sortField: pager.orderBy || "cdate",
            sortOrder: pager.order?.toUpperCase() || "DESC",
            fields: fields
        });
    }

    async count(filterFields = null) {
        console.log("counting " + this.table() + " with filter= " + JSON.stringify(filterFields));

        const result = await this.find({fields: filterFields});

        return result ? result.length : 0;
    }

    async save(data) {
        console.log("saving at " + this.table() + " with data= " + JSON.stringify(data));

        if (data.id) {
            console.log("UPDATE: " + JSON.stringify(data));

            db.update(this.table(), data);
        } else {
            console.log("CREATE: " + JSON.stringify(data));

            await db.insert(this.table(), data);
        }

        return data;
    }

    async delete(id) {
        console.log("deleting at " + this.table() + " for id: " + id);

        try {
            //TODO: SQL Delete

            return true;
        } catch (err) {
            return false;
        }
    }

    async deleteAll() {
        console.log("deleting at " + this.table());

        try {
            //TODO: SQL Delete

            return true;
        } catch (err) {
            return false;
        }
    }
}

module.exports = BaseService;

const { Pool } = require('pg');
const env = require("./env.json");

const pool = new Pool({
    user: env.db_username,
    host: env.db_host,
    database: env.db_name,
    password: env.db_password,
    schemaName: env.db_schema,
    port: env.db_port
});


module.exports = {
    insert: async (table, obj) => {
        obj.id = await pool.query(`select nextval('${table.toLowerCase()}_id_seq'::regclass)`).then(data => data.rows[0].nextval);

        const columns = Object.keys(obj);
        const values = Object.values(obj);

        const placeHolders = values.map((_, index) => `$${index + 1}`).join(', ');

        const queryText = `INSERT INTO "${table}" (${columns}) VALUES (${placeHolders}) RETURNING *`;

        console.log(queryText + " (values: " + values.join(", ")+")");

        pool.connect().then(client => client.query(queryText, values).then(() => client.release()));
    },
    update: (table, obj) => {
        if(!obj.id) throw new Error("id cannot be empty");

        let params = [];
        const values = [];
        let i = 1;
        for(const key in obj) {
            if(["id", "cdate", "udate"].includes(key)) continue;

            params.push(`${key}=$${i}`);
            values.push(obj[key]);
            i++;
        }

        const queryText = `UPDATE "${table}" SET ${params.join(", ")} WHERE id=${obj.id}`;

        console.log(queryText + " (values: " + values + ")");

        pool.connect().then(client => client.query(queryText, values).then(() => client.release()));
    },
    findByExample: async (table, filter) => {
        let params = [];
        let values = [];
        if(filter.fields) {
            let i = 1;
            for(const key in filter.fields) {
                console.log("selecting: " + key + " = " + filter.fields[key]);
                params.push(`${key}=$${i}`);
                values.push(filter.fields[key]);
                i++;
            }
        }

        const where = `${params.length > 0 ? "WHERE " + params.join(" AND ") : ""}`;
        const orderBy = `${filter.sortField ? ("ORDER BY "+ filter.sortField + " " + filter.sortOrder || " DESC") : ""}`;

        const queryText = `SELECT * FROM "${table}" ${where} ${orderBy}`;

        console.log(queryText + " (values: " + values + ")");

        return pool.connect().then(client => client.query(queryText, values).then(data => data.rows));
    },
    findByCustomSQL: async (sql) => {
        return pool.connect().then(client => client.query(sql).then(data => data.rows));
    }
};
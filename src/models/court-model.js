module.exports = {

  ensureTable() {
    console.log("BEACH COURTS TABLE");
    return global.client.query(`
        CREATE TABLE IF NOT EXISTS courts
        (
            id          SERIAL PRIMARY KEY,
            courts_name VARCHAR(250),
            address     VARCHAR(250),
            telephone   VARCHAR(250),
            time        VARCHAR(250),
            price       DECIMAL
        )
    `)
  },

  dropTable() {
    return global.client.query(`
        DROP TABLE IF EXISTS courts;
    `)
  },

  getAllCourts() {
    console.log("GETTING ALL COURTS");
    return global.client.query(`
        SELECT *
        FROM courts
    `)
      .then(res => {
        console.log("COURTS RESPONSE", res)
        return res.rows;
      })
  },

  findCourtPriceByProviderName(courtProviderName) {
    console.log("COURT PRICE Query")
    return global.client.query(`
        SELECT price
        FROM courts
        WHERE courts_name = $1
    `, [courtProviderName])
      .then(res => {
        console.log("COURTS RESPONSE", res)
        return res.rows[0];
      })
  },

  findCourtProviderByName(courtProviderName) {
    console.log("COURT PROVIDER Query")
    return global.client.query(`
        SELECT *
        FROM courts
        WHERE courts_name = $1
    `, [courtProviderName])
      .then(res => {
        console.log("COURTS RESPONSE", res)
        return res.rows[0];
      })
  }
};

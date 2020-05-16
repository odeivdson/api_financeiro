
exports.up = (knex) => {
    return knex.schema.createTable('accounts', (t) => {
       t.increments('id').primary();
       t.string('name').notNullable();
       t.integer('user_id')
           .references('id')
           .inTable('users')
           .notNullable();
    });
};

exports.down = (knex) => {
    return knex.scale.dropTable('accounts')
};

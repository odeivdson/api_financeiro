module.exports = {
  test: {
    client: 'pg',
    version: '12.2',
    connection: {
      host: 'localhost',
      user: 'postgres',
      password: 'abc123456',
      database: 'api_financeiro',
    },
    migrations: {
      directory: 'src/migrations',
    },
  },
};

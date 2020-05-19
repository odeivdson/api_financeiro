const request = require('supertest');
const jwt = require('jwt-simple');

const app = require('../../src/app');

const MAIN_ROUTE = '/v1/users';
const email = `${Date.now()}@mail.com`;
let user;

beforeAll(async () => {
  const res = await app.services.user.save({ name: 'User Account', email: `${Date.now()}@mail.com`, password: '123456' });
  user = { ...res[0] };
  user.token = jwt.encode(user, 'Segredo');
});

test('Deve listar todos os usuários', () => request(app).get(MAIN_ROUTE)
  .set('authorization', `bearer ${user.token}`)
  .then((res) => {
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
  }));

test('Deve inserir usuário com sucesso', () => request(app).post(MAIN_ROUTE)
  .set('authorization', `bearer ${user.token}`)
  .send({ name: 'Walter Mitty', email, password: '123456' })
  .then((res) => {
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Walter Mitty');
    expect(res.body).not.toHaveProperty('password');
  }));

test('Deve armazenar a senha criptografada', async () => {
  const res = await request(app).post(MAIN_ROUTE)
    .set('authorization', `bearer ${user.token}`)
    .send({ name: 'Walter Mitty', email: `${Date.now()}@mail.com`, password: '123456' });
  expect(res.status).toBe(201);

  const { id } = res.body;
  const userDB = await app.services.user.findOne({ id });

  expect(userDB.password).not.toBe('123456');
});

// Estratégia 1
test('Não deve inserir usuário sem nome', () => request(app).post(MAIN_ROUTE)
  .set('authorization', `bearer ${user.token}`)
  .send({ mail: 'walter@mail.com', password: '123456' })
  .then((res) => {
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Nome é um atributo obrigatório');
  }));

// Estratégia 2 (com async/await)
test('Não deve inserir usuário sem email', async () => {
  const result = await request(app).post(MAIN_ROUTE)
    .set('authorization', `bearer ${user.token}`)
    .send({ name: 'Walter Mitty', password: '123456' });
  expect(result.status).toBe(400);
  expect(result.body.error).toBe('Email é um atributo obrigatório');
});

// Estratégia 3 (com tratativa manual de erros)
test('Não deve inserir um usuário sem senha', (done) => {
  request(app).post(MAIN_ROUTE)
    .set('authorization', `bearer ${user.token}`)
    .send({ name: 'Walter Mitty', email: 'walter@mail.com' })
    .then((res) => {
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Senha é um atributo obrigatório');
      done();
    })
    .catch((err) => done.fail(err));
});

test('Não deve inserir usuário com email já existente', () => request(app).post(MAIN_ROUTE)
  .set('authorization', `bearer ${user.token}`)
  .send({ name: 'Walter Mitty', email, password: '123456' })
  .then((res) => {
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Já existe um usuário com esse email');
  }));

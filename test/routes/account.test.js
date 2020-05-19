const request = require('supertest');
const jwt = require('jwt-simple');

const app = require('../../src/app');

const MAIN_ROUTE = '/v1/accounts';
let user;

beforeAll(async () => {
  const res = await app.services.user.save({ name: 'User Account', email: `${Date.now()}@mail.com`, password: '123456' });
  user = { ...res[0] };
  user.token = jwt.encode(user, 'Segredo');
});

test('Deve inserir uma conta com sucesso', () => request(app).post(MAIN_ROUTE)
  .set('authorization', `bearer ${user.token}`)
  .send({ name: 'ACC #1', user_id: user.id })
  .then((result) => {
    expect(result.status).toBe(201);
    expect(result.body.name).toBe('ACC #1');
  }));

test('Não deve inserir uma conta sem nome', () => request(app).post(MAIN_ROUTE)
  .set('authorization', `bearer ${user.token}`)
  .send({ user_id: user.id })
  .then((result) => {
    expect(result.status).toBe(400);
    expect(result.body.error).toBe('Nome é um atributo obrigatório');
  }));

test.skip('Não deve inserir uma conta de nome duplicado', () => { });

test('Deve listar todas as contas', () => app.db('accounts')
  .insert({ name: 'ACC list', user_id: user.id })
  .then(() => request(app).get(MAIN_ROUTE)
    .set('authorization', `bearer ${user.token}`))
  .then((res) => {
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
  }));

test.skip('Deve listar apenas as contas do usuário', () => {});


test('Deve retornar uma conta por Id', () => app.db('accounts')
  .insert({ name: 'ACC by Id', user_id: user.id }, ['id'])
  .then((acc) => request(app).get(`${MAIN_ROUTE}/${acc[0].id}`)
    .set('authorization', `bearer ${user.token}`))
  .then((res) => {
    expect(res.status).toBe(200);
    expect(res.body.user_id).toBe(user.id);
  }));

test.skip('Não deve retornar uma conta de outro usuário', () => {});


test('Deve alterar uma conta', () => app.db('accounts')
  .insert({ name: 'ACC To Upate', user_id: user.id }, ['id'])
  .then((acc) => request(app).put(`${MAIN_ROUTE}/${acc[0].id}`)
    .set('authorization', `bearer ${user.token}`)
    .send({ name: 'Acc Updated' }))
  .then((res) => {
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Acc Updated');
  }));

test.skip('Não deve alterar conta de outro usuário', () => {});

test('Deve remover uma conta', () => app.db('accounts')
  .insert({ name: 'ACC To Remove', user_id: user.id }, ['id'])
  .then((acc) => request(app).delete(`${MAIN_ROUTE}/${acc[0].id}`)
    .set('authorization', `bearer ${user.token}`))
  .then((res) => {
    expect(res.status).toBe(204);
  }));

test.skip('Não deve remover uma conta de outro usuário', () => {});

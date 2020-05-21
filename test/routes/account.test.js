const request = require('supertest');
const jwt = require('jwt-simple');

const app = require('../../src/app');

const MAIN_ROUTE = '/v1/accounts';
let user;
let user2;

beforeEach(async () => {
  const res = await app.services.user.save({ name: 'User Account', email: `${Date.now()}@mail.com`, password: '123456' });
  user = { ...res[0] };
  user.token = jwt.encode(user, 'Segredo');

  const res2 = await app.services.user.save({ name: 'User Account #2', email: `${Date.now()}@mail.com`, password: '123456' });
  user2 = { ...res2[0] };
});

test('Deve inserir uma conta com sucesso', () => request(app).post(MAIN_ROUTE)
  .set('authorization', `bearer ${user.token}`)
  .send({ name: 'ACC #1' })
  .then((result) => {
    expect(result.status).toBe(201);
    expect(result.body.name).toBe('ACC #1');
  }));

test('Não deve inserir uma conta sem nome', () => request(app).post(MAIN_ROUTE)
  .set('authorization', `bearer ${user.token}`)
  .send({ })
  .then((result) => {
    expect(result.status).toBe(400);
    expect(result.body.error).toBe('Nome é um atributo obrigatório');
  }));

test('Não deve inserir uma conta de nome duplicado, para o mesmo usuário', () => app.db('accounts')
  .insert({ name: 'Acc duplicado', user_id: user.id })
  .then(() => request(app).post(MAIN_ROUTE)
    .set('authorization', `bearer ${user.token}`)
    .send({ name: 'Acc duplicado' }))
  .then((res) => {
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Já existe uma conta com esse nome.');
  }));

// test('Deve listar todas as contas', () => app.db('accounts')
//   .insert({ name: 'ACC list', user_id: user.id })
//   .then(() => request(app).get(MAIN_ROUTE)
//     .set('authorization', `bearer ${user.token}`))
//   .then((res) => {
//     expect(res.status).toBe(200);
//     expect(res.body.length).toBeGreaterThan(0);
//   }));

test('Deve listar apenas as contas do usuário', () => app.db('accounts')
  .insert([
    { name: 'Acc User #1', user_id: user.id },
    { name: 'Acc User #2', user_id: user2.id },
  ]).then(() => request(app).get(MAIN_ROUTE)
    .set('authorization', `bearer ${user.token}`)
    .then((res) => {
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].name).toBe('Acc User #1');
    })));


test('Deve retornar uma conta por Id', () => app.db('accounts')
  .insert({ name: 'ACC by Id', user_id: user.id }, ['id'])
  .then((acc) => request(app).get(`${MAIN_ROUTE}/${acc[0].id}`)
    .set('authorization', `bearer ${user.token}`))
  .then((res) => {
    expect(res.status).toBe(200);
    expect(res.body.user_id).toBe(user.id);
  }));

test('Não deve retornar uma conta de outro usuário', () => app.db('accounts')
  .insert({ name: 'ACC User #2', user_id: user2.id }, ['id'])
  .then((acc) => request(app).get(`${MAIN_ROUTE}/${acc[0].id}`)
    .set('authorization', `bearer ${user.token}`))
  .then((res) => {
    expect(res.status).toBe(403);
    expect(res.body.error).toBe('Este recurso não pertence ao usuário.');
  }));


test('Deve alterar uma conta', () => app.db('accounts')
  .insert({ name: 'ACC To Upate', user_id: user.id }, ['id'])
  .then((acc) => request(app).put(`${MAIN_ROUTE}/${acc[0].id}`)
    .set('authorization', `bearer ${user.token}`)
    .send({ name: 'Acc Updated' }))
  .then((res) => {
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Acc Updated');
  }));

test('Não deve alterar conta de outro usuário', () => app.db('accounts')
  .insert({ name: 'ACC User #2', user_id: user2.id }, ['id'])
  .then((acc) => request(app).put(`${MAIN_ROUTE}/${acc[0].id}`)
    .set('authorization', `bearer ${user.token}`)
    .send({ name: 'Acc Updated' }))
  .then((res) => {
    expect(res.status).toBe(403);
    expect(res.body.error).toBe('Este recurso não pertence ao usuário.');
  }));

test('Deve remover uma conta', () => app.db('accounts')
  .insert({ name: 'ACC To Remove', user_id: user.id }, ['id'])
  .then((acc) => request(app).delete(`${MAIN_ROUTE}/${acc[0].id}`)
    .set('authorization', `bearer ${user.token}`))
  .then((res) => {
    expect(res.status).toBe(204);
  }));

test('Não deve remover uma conta de outro usuário', () => app.db('accounts')
  .insert({ name: 'ACC User #2', user_id: user2.id }, ['id'])
  .then((acc) => request(app).delete(`${MAIN_ROUTE}/${acc[0].id}`)
    .set('authorization', `bearer ${user.token}`))
  .then((res) => {
    expect(res.status).toBe(403);
    expect(res.body.error).toBe('Este recurso não pertence ao usuário.');
  }));

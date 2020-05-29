const request = require('supertest');
const jwt = require('jwt-simple');
const app = require('../../src/app');

const MAIN_ROUTE = '/v1/transactions';
let user;
let user2;
let accUser;
let accUser2;

beforeAll(async () => {
  await app.db('transactions').del();
  await app.db('accounts').del();
  await app.db('users').del();
  const users = await app.db('users').insert([
    { name: 'User #1', email: 'user@mail.com', password: '$2b$10$ti2/UBGbfnLMqsyb/y6mnuirTDRODD92V9UJwQZ0ZCnnt50jVQRgG' },
    { name: 'User #2', email: 'user2@mail.com', password: '$2b$10$ti2/UBGbfnLMqsyb/y6mnuirTDRODD92V9UJwQZ0ZCnnt50jVQRgG' },
  ], '*');
  [user, user2] = users;
  delete user.password;
  user.token = jwt.encode(user, 'Segredo');

  const accs = await app.db('accounts').insert([
    { name: 'Acc #1', user_id: user.id },
    { name: 'Acc #2', user_id: user2.id },
  ], '*');
  [accUser, accUser2] = accs;
});

test('Deve listar apenas as transações do usuário', () => app.db('transactions')
  .insert([
    {
      description: 'T1', date: new Date(), ammount: 100, type: 'I', acc_id: accUser.id,
    },
    {
      description: 'T2', date: new Date(), ammount: 300, type: 'O', acc_id: accUser2.id,
    },
  ])
  .then(() => request(app).get(MAIN_ROUTE)
    .set('authorization', `bearer ${user.token}`)
    .then((res) => {
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].description).toBe('T1');
    })));

test('Deve inserir uma transação com sucesso', () => request(app).post(MAIN_ROUTE)
  .set('authorization', `bearer ${user.token}`)
  .send({
    description: 'New T', date: new Date(), ammount: 100, type: 'I', acc_id: accUser.id,
  })
  .then((res) => {
    expect(res.status).toBe(201);
    expect(res.body.acc_id).toBe(accUser.id);
    expect(res.body.ammount).toBe('100.00');
  }));

test('Transações de entrada devem ser positivas', () => request(app).post(MAIN_ROUTE)
  .set('authorization', `bearer ${user.token}`)
  .send({
    description: 'New T', date: new Date(), ammount: -100, type: 'I', acc_id: accUser.id,
  })
  .then((res) => {
    expect(res.status).toBe(201);
    expect(res.body.acc_id).toBe(accUser.id);
    expect(res.body.ammount).toBe('100.00');
  }));

test('Transações de saída devem ser negativas', () => request(app).post(MAIN_ROUTE)
  .set('authorization', `bearer ${user.token}`)
  .send({
    description: 'New T', date: new Date(), ammount: 100, type: 'O', acc_id: accUser.id,
  })
  .then((res) => {
    expect(res.status).toBe(201);
    expect(res.body.acc_id).toBe(accUser.id);
    expect(res.body.ammount).toBe('-100.00');
  }));

describe('Ao tentar inserir uma transação inválida', () => {
  let validTransaction;
  beforeAll(() => {
    validTransaction = {
      description: 'New T', date: new Date(), ammount: 100, type: 'I', acc_id: accUser.id,
    };
  });

  const testTemplate = (newData, errorMessage) => request(app).post(MAIN_ROUTE)
    .set('authorization', `bearer ${user.token}`)
    .send({ ...validTransaction, ...newData })
    .then((res) => {
      expect(res.status).toBe(400);
      expect(res.body.error).toBe(errorMessage);
    });

  test('Não deve inserir sem descrição', () => testTemplate({ description: null }, 'Descrição é um atributo obrigatório'));
  test('Não deve inserir sem valor', () => testTemplate({ ammount: null }, 'Valor é um atributo obrigatório'));
  test('Não deve inserir sem data', () => testTemplate({ date: null }, 'Data é um atributo obrigatório'));
  test('Não deve inserir sem conta', () => testTemplate({ acc_id: null }, 'Conta é um atributo obrigatório'));
  test('Não deve inserir sem tipo', () => testTemplate({ type: null }, 'Tipo é um atributo obrigatório'));
  test('Não deve inserir com tipo inválido', () => testTemplate({ type: 'E' }, 'Tipo inválido'));
});


test('Deve retornar uma transação por ID', () => app.db('transactions')
  .insert(
    {
      description: 'T ID', date: new Date(), ammount: 100, type: 'I', acc_id: accUser.id,
    }, ['id'],
  ).then((trans) => request(app).get(`${MAIN_ROUTE}/${trans[0].id}`)
    .set('authorization', `bearer ${user.token}`)
    .then((res) => {
      expect(res.status).toBe(200);
      expect(res.body.id).toBe(trans[0].id);
      expect(res.body.description).toBe('T ID');
    })));

test('Deve alterar uma transação', () => app.db('transactions')
  .insert(
    {
      description: 'to update', date: new Date(), ammount: 100, type: 'I', acc_id: accUser.id,
    }, ['id'],
  ).then((trans) => request(app).put(`${MAIN_ROUTE}/${trans[0].id}`)
    .set('authorization', `bearer ${user.token}`)
    .send({ description: 'Updated' })
    .then((res) => {
      expect(res.status).toBe(200);
      expect(res.body.description).toBe('Updated');
    })));

test('Deve remover uma transação', () => app.db('transactions')
  .insert(
    {
      description: 'to delete', date: new Date(), ammount: 100, type: 'I', acc_id: accUser.id,
    }, ['id'],
  ).then((trans) => request(app).delete(`${MAIN_ROUTE}/${trans[0].id}`)
    .set('authorization', `bearer ${user.token}`)
    .then((res) => {
      expect(res.status).toBe(204);
    })));


test('Não deve remover transação de outro usuário', () => app.db('transactions')
  .insert(
    {
      description: 'To delete', date: new Date(), ammount: 100, type: 'I', acc_id: accUser2.id,
    }, ['id'],
  ).then((trans) => request(app).delete(`${MAIN_ROUTE}/${trans[0].id}`)
    .set('authorization', `bearer ${user.token}`)
    .then((res) => {
      expect(res.status).toBe(403);
      expect(res.body.error).toBe('Este recurso não pertence ao usuário.');
    })));

test('Não deve remover conta com transação', () => app.db('transactions')
  .insert(
    {
      description: 'To delete', date: new Date(), ammount: 100, type: 'I', acc_id: accUser.id,
    }, ['id'],
  ).then(() => request(app).delete(`/v1/accounts/${accUser.id}`)
    .set('authorization', `bearer ${user.token}`)
    .then((res) => {
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Essa conta possui transações associadas');
    })));

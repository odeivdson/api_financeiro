const request = require('supertest');
const app = require('../../src/app');

test('Deve criar usuário via signup', () => {
  const email = `${Date.now()}@mail.com`;
  return request(app).post('/auth/signup')
    .send({ name: 'Walter', email, password: '123456' })
    .then((res) => {
      expect(res.status).toBe(201);
      expect(res.body.name).toBe('Walter');
      expect(res.body).toHaveProperty('email');
      expect(res.body).not.toHaveProperty('password');
    });
});

test('Deve receber token ao logar', () => {
  const email = `${Date.now()}@mail.com`;
  return app.services.user.save({ name: 'Walter', email, password: '123456' })
    .then(() => request(app).post('/auth/signin')
      .send({ email, password: '123456' }))
    .then((res) => {
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
    });
});

test('Não deve autenticar usuário com senha incorreta', () => {
  const email = `${Date.now()}@mail.com`;
  return app.services.user.save({ name: 'Walter', email, password: '123456' })
    .then(() => request(app).post('/auth/signin')
      .send({ email, password: '654321' }))
    .then((res) => {
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Usuário ou senha inválidos.');
    });
});

test('Não deve autenticar usuário com senha incorreta', () => request(app).post('/auth/signin')
  .send({ email: 'naoexiste@mail.com', password: '654321' })
  .then((res) => {
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Usuário ou senha inválidos.');
  }));

test('Não deve acessar uma rota protegida sem token', () => request(app).get('/v1/users')
  .then((res) => {
    expect(res.status).toBe(401);
  }));

# API - Sistema Financeiro

API base para sistema financeiro

## Getting Started


Essas instruções fornecerão uma cópia do projeto em execução na máquina local para fins de desenvolvimento e teste.
### Pré-requisito


O que você precisa para instalar o sistema em seu ambiente:

```
nodejs, postgreSQL
```

### Instalar

Certifique-se de que tenha uma versão do nodejs instalado em seu ambiente (recomendo a v13.x);
```
$ node -v
v13.14.0

$ pg_config --version
PostgreSQL 12.2 (Ubuntu 12.2-4)
```

Configure o acesso a seu banco de dados PostgreSQL (edite o arquivo knexfile.js que está na raiz do projeto)

```
$ vi knexfile.js
...
connection: {
      host: 'localhost',
      user: 'postgres',
      password: 'abc123456',
      database: 'api_financeiro',
    },
...
```

Execute o comando abaixo para instalar as dependências do projeto

```
npm install
```

Após finalizar a instalação das dependências prossiga para os testes.

## Execute os testes

As funcionalidades do sistema foram feitas com base em testes, então execute o comando abaixo para validar se está tudo certo em seu ambiente local

```
$ npm run secure-mode
```

### O comando deve apresentar algo parecido com:

```
Test Suites: 6 passed, 6 total
Tests:       40 passed, 40 total
Snapshots:   0 total
Time:        4.11 s
Ran all test suites.

```


## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details

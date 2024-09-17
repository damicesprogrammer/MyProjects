const inquirer = require("inquirer");
const chalk = require("chalk");

const fs = require("fs");
const { verify } = require("crypto");

operation();

function operation() {
  inquirer
    .prompt([
      {
        type: "list",
        name: "action",
        message: "O que você deseja fazer?",
        choices: [
          "Criar conta",
          "Consultar saldo",
          "Depositar",
          "Sacar",
          "Transferir",
          "Sair",
        ],
      },
    ])
    .then((answer) => {
      const action = answer["action"];

      if (action === "Criar conta") {
        createAccount();
      } else if (action === "Consultar saldo") {
        getAccountBalance();
      } else if (action === "Depositar") {
        deposit();
      } else if (action === "Sacar") {
        withDraw();
      } else if (action === "Transferir") {
        nameAccount();
      } else if (action === "Sair") {
        console.log(chalk.bgBlue.black("Obrigado por usar o Account"));
        process.exit();
      }
    })
    .catch((err) => console.log(err));
}

//create account

function createAccount() {
  console.log(chalk.bgGreen.black("Parabéns por escolher o nosso banco!"));
  console.log(chalk.green("Defina as opções da sua conta a seguir"));
  buildAccount();
}

function buildAccount() {
  inquirer
    .prompt([
      {
        name: "accountName",
        message: "Digite um nome para a sua conta",
      },
    ])
    .then((answer) => {
      const accountName = answer["accountName"];
      console.info(accountName);

      if (!fs.existsSync("accounts")) {
        fs.mkdirSync("accounts");
      }
      if (fs.existsSync(`accounts/${accountName}.json`)) {
        console.log(chalk.bgRed.black("Esta conta já existe"));
        buildAccount();
        return;
      }
      fs.writeFileSync(
        `accounts/${accountName}.json`,
        '{"balance": 0}',
        function (err) {
          console.log(err);
        }
      );

      console.log(chalk.green("Parabéns a sua conta foi criada"));
      operation();
    })
    .catch((err) => console.log(err));
}

//add an amout to user account

function deposit() {
  inquirer
    .prompt([
      {
        name: "accountName",
        message: "Qual o nome da sua conta?",
      },
    ])
    .then((answer) => {
      const accountName = answer["accountName"];

      //verify if account exists
      if (!verifyAccount(accountName)) {
        return deposit();
      }

      inquirer
        .prompt([
          {
            name: "amount",
            message: "Qual a quantia que você deseja depositar?",
          },
        ])
        .then((answer) => {
          const amount = answer["amount"];
          // add an amount
          addAmount(accountName, amount);
        })
        .catch((err) => {
          console.log(err);
        });
    })
    .catch((err) => console.log(err));
}

function verifyAccount(accountName) {
  if (!fs.existsSync(`accounts/${accountName}.json`)) {
    console.log(chalk.bgRed.black("Está conta não existe"));
    return false;
  }
  return true;
}

function addAmount(accountName, amount) {
  const account = getAccount(accountName);

  if (!amount) {
    console.log("Ocorreu um erro.");
    return deposit();
  }

  account.balance = parseFloat(amount) + parseFloat(account.balance);

  fs.writeFileSync(
    `accounts/${accountName}.json`,
    JSON.stringify(account),
    function (err) {
      console.log(err);
    }
  );

  console.log(chalk.green(`Foi depositado o valor de R$${amount}`));
}

function getAccount(accountName) {
  const accountJSON = fs.readFileSync(`accounts/${accountName}.json`, {
    enconding: "utf-8",
    flag: "r",
  });

  return JSON.parse(accountJSON);
}

// show account balance

function getAccountBalance() {
  inquirer
    .prompt([
      {
        name: "accountName",
        message: "Qual o nome da sua conta?",
      },
    ])
    .then((answer) => {
      const accountName = answer["accountName"];

      if (!verifyAccount(accountName)) {
        return getAccountBalance();
      }
      const accountData = getAccount(accountName);

      console.log(
        chalk.bgBlue.black(`O seu saldo atual é de: R$${accountData.balance}`)
      );
      operation();
    })
    .catch((err) => {
      console.log(err);
    });
}

//withDraw an amout from user
function withDraw() {
  inquirer
    .prompt([
      {
        name: "accountName",
        message: "Qual o nome da sua conta?",
      },
    ])
    .then((answer) => {
      const accountName = answer["accountName"];

      if (!verifyAccount(accountName)) {
        return withDraw();
      }
      inquirer
        .prompt([
          {
            name: "amount",
            message: "Qual o valor que você deseja sacar?",
          },
        ])
        .then((answer) => {
          const amount = answer["amount"];
          return subAmount(accountName, amount);
        });
    })
    .catch((err) => {});
}
function subAmount(accountName, amount) {
  const account = getAccount(accountName);

  if (!amount) {
    console.log(
      chalk.bgRed.black("Ocorreu um erro, tente novamente mais tarde.")
    );
    return withDraw();
  }
  if (parseFloat(account.balance) >= parseFloat(amount)) {
    account.balance = parseFloat(account.balance) - parseFloat(amount);
    fs.writeFileSync(
      `accounts/${accountName}.json`,
      JSON.stringify(account),
      function (err) {
        console.log(err);
      }
    );

    console.log(
      chalk.bgGreen.whiteBright(
        `Foi sacado o valor de R$${amount} da sua conta`
      )
    );
    return operation();
  } else {
    console.log(
      chalk.bgYellow.white("Saque valores que você tenha disponível")
    );
    return withDraw();
  }
}

//Transfer amount

function nameAccount() {
  inquirer
    .prompt([
      {
        name: "accountName",
        message: "Qual o nome da sua conta?",
      },
    ])
    .then((answer) => {
      const accountName = answer["accountName"];
      if (!verifyAccount(accountName)) {
        return nameAccount();
      }
      verifyOtherAccount(accountName);
    })
    .catch((err) => {
      console.log(err);
    });
}
function verifyOtherAccount(accountName, otherAccount) {
  inquirer
    .prompt([
      {
        name: "otherAccount",
        message: "Para qual conta você deseja tranferir?",
      },
    ])
    .then((answer) => {
      const otherAccount = answer["otherAccount"];
      if (!verifyAccount(otherAccount)) {
        return verifyOtherAccount(accountName);
      }
      whichAmountTransfer(accountName, otherAccount);
    });
}
function whichAmountTransfer(accountName, otherAccount) {
  inquirer
    .prompt([
      {
        name: "amountTransfer",
        message: "Qual o valor que você deseja transferir?",
      },
    ])
    .then((answer) => {
      const amountTransfer = answer["amountTransfer"];
      const account = getAccount(accountName);

      if (!amountTransfer) {
        console.log(chalk.bgRed.black("Digite um valor"));
        return whichAmountTransfer;
      }
      if (parseFloat(account.balance) < parseFloat(amountTransfer)) {
        console.log(chalk.bgRed.black("Valor indisponível"));
        return whichAmountTransfer();
      }
      transferAmount(accountName, otherAccount, amountTransfer);
    });
}

function transferAmount(accountName, otherAccount, amountTransfer) {
  const myAccount = getAccount(accountName);
  const account = getAccount(otherAccount);

  account.balance = parseFloat(amountTransfer) + parseFloat(account.balance);
  myAccount.balance =
    parseFloat(myAccount.balance) - parseFloat(amountTransfer);

  fs.writeFileSync(
    `accounts/${accountName}.json`,
    JSON.stringify(myAccount),
    function (err) {
      console.log(err);
    }
  );
  fs.writeFileSync(
    `accounts/${otherAccount}.json`,
    JSON.stringify(account),
    function (err) {
      console.log(err);
    }
  );

  console.log(chalk.bgGreen.white("Valor transferido com sucesso!"));
  operation();
}

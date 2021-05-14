require("express-async-errors");
const express = require("express");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");
const morgan = require("morgan");

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

const users = [];

/**
 * Funão de busca de Todo por ID
 */
const findExistingTodoById = (todos, id) =>
  todos.find((element) => element.id === id);

/**
 * Função de verificação de existência de usuário na "base"
 */
const verifyIfUserAlreadyExists = (username) =>
  users.find((element) => element.username === username);

/**
 * Middleware de autenticação
 */
const checksExistsUserAccount = (request, response, next) => {
  const { username } = request.headers;

  const userExists = verifyIfUserAlreadyExists(username);

  if (!userExists) {
    return response.status(404).json({ error: "Acesso não autorizado!" });
  }

  request.user = userExists;

  return next();
};

/**
 * Rota de criação de usuários no sitema
 */
app.post("/users", (request, response) => {
  const { name, username } = request.body;

  const userExists = users.some((element) => element.username === username);

  if (userExists) {
    return response
      .status(400)
      .json({ error: "Este usuário já está cadastrao" });
  }

  const user = {
    id: uuidv4(),
    name,
    username,
    todos: [],
    created_at: new Date(),
  };

  users.push(user);

  return response.status(201).json(user);
});

/**
 * Rota de listagem de todoas as tarefas do usuário
 */
app.get("/todos", checksExistsUserAccount, (request, response) =>
  response.status(200).json(request.user.todos)
);

app.post("/todos", checksExistsUserAccount, (request, response) => {
  const { title, deadline } = request.body;

  const todo = {
    id: uuidv4(),
    title,
    done: false,
    deadline: new Date(deadline),
    created_at: new Date(),
  };

  request.user.todos.push(todo);

  return response.status(201).json(todo);
});

app.put("/todos/:id", checksExistsUserAccount, (request, response) => {
  const { id } = request.params;
  const { title, deadline } = request.body;
  const todoExists = findExistingTodoById(request.user.todos, id);

  if (!todoExists) {
    return response.status(404).json({ error: "Tarefa não encontrada!" });
  }

  request.user.todos = request.user.todos.filter((element) => {
    if (element === todoExists) {
      element.title = title;
      element.deadline = new Date(deadline);
    }

    return element;
  });

  return response.status(200).json(todoExists);
});

app.patch("/todos/:id/done", checksExistsUserAccount, (request, response) => {
  const { id } = request.params;
  const todoExists = findExistingTodoById(request.user.todos, id);

  if (!todoExists) {
    return response.status(404).json({ error: "Tarefa não encontrada!" });
  }

  request.user.todos = request.user.todos.filter((element) => {
    if (element === todoExists) {
      element.done = true;
    }

    return element;
  });

  return response.status(200).json(todoExists);
});

app.delete("/todos/:id", checksExistsUserAccount, (request, response) => {
  const { id } = request.params;
  const todoExists = findExistingTodoById(request.user.todos, id);

  if (!todoExists) {
    return response.status(404).json({ error: "Tarefa não encontrada!" });
  }

  request.user.todos.splice(todoExists, 1);

  return response.status(204).json(todoExists);
});

module.exports = app;

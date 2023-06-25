const express = require("express");
const path = require("path");
const fns = require("date-fns");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
const bodyParser = require("body-parser");

app.use(express.json());

//const bcrypt = require("bcrypt");
const dbPath = path.join(__dirname, "todoApplication.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3001, () => {
      console.log("Server Running at http://localhost:3001/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const logger = (request, response, next) => {
  //console.log(request.query);
  const requestQuery = request.query;
  switch (true) {
    case requestQuery.status !== undefined:
      const statusValues = ["TO DO", "IN PROGRESS", "DONE"];
      if (statusValues.includes(requestQuery.status)) {
        next();
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;
    case requestQuery.priority !== undefined:
      const priorityValues = ["HIGH", "MEDIUM", "LOW"];
      if (priorityValues.includes(requestQuery.priority)) {
        next();
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    case requestQuery.category !== undefined:
      const categoryValues = ["WORK", "HOME", "LEARNING"];
      if (categoryValues.includes(requestQuery.category)) {
        next();
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
  }
};

////////////////////////////////////////////////////

const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const hasCategoryAndStatus = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  );
};

const hasCategoryAndPriority = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  );
};

const hasSearchProperty = (requestQuery) => {
  return requestQuery.search_q !== undefined;
};

const hasCategoryProperty = (requestQuery) => {
  return requestQuery.category !== undefined;
};

///////////////////////////////////////////////////////

//API  1 pending
app.get("/todos/", logger, async (request, response) => {
  //console.log(request.query);
  const { search_q = "", priority, status, category } = request.query;
  const requestQuery = request.query;
  let getListOfTodosQuery = "";
  switch (true) {
    case hasPriorityProperty(requestQuery):
      getListOfTodosQuery = `SELECT * FROM todo WHERE priority = '${priority}';`;
      break;
    case hasStatusProperty(requestQuery):
      getListOfTodosQuery = `SELECT * FROM todo WHERE status = '${status}';`;
      break;
    case hasPriorityAndStatusProperties(requestQuery):
      getListOfTodosQuery = `SELECT * FROM todo WHERE status = '${status}' 
      AND priority = '${priority}';`;
      break;
    case hasCategoryAndStatus(requestQuery):
      getListOfTodosQuery = `SELECT * FROM todo WHERE status = '${status}'
      AND category = '${category}' ;`;
      break;
    case hasCategoryAndPriority(requestQuery):
      getListOfTodosQuery = `SELECT * FROM todo WHERE priority = '${priority}'
      AND category = '${category}' ;`;
      break;
    case hasSearchProperty(requestQuery):
      getListOfTodosQuery = `SELECT * FROM todo WHERE todo LIKE  '%${search_q}%' ;`;
      break;
    case hasCategoryProperty(requestQuery):
      getListOfTodosQuery = `SELECT * FROM todo WHERE  category = '${category}' ;`;
      break;
  }

  const outPutResult = (dbObject) => {
    return {
      id: dbObject.id,
      todo: dbObject.todo,
      priority: dbObject.priority,
      category: dbObject.category,
      status: dbObject.status,
      dueDate: dbObject.due_date,
    };
  };

  const data = await db.all(getListOfTodosQuery);

  response.send(data.map((eachItem) => outPutResult(eachItem)));
});

// API 2
app.get("/todos/:todoId/", async (request, response) => {
  //console.log(request.query);
  const { todoId } = request.params;
  const getListOfTodos = `
  SELECT 
  id, todo, priority, status, category, due_date AS dueDate
  FROM todo WHERE id = '${todoId}';
  `;
  const data = await db.get(getListOfTodos);
  response.send(data);
});

// API 3

app.get("/agenda/", async (request, response) => {
  //console.log(request.query);
  const parameters = request.query;
  const { date } = parameters;

  const formattedDate = fns.format(new Date(date), "yyyy-MM-dd");
  const getListOfTodos = `
  SELECT 
  id, todo, priority, status, category, due_date AS dueDate
  FROM todo WHERE due_date = '${formattedDate}';
  `;
  const data = await db.all(getListOfTodos);
  response.send(data);
});

// API 4
app.post("/todos/", async (request, response) => {
  const todoDetails = request.body;
  const { id, todo, priority, status, category, dueDate } = todoDetails;
  //console.log(todoDetails);

  const addTodoQuery = `INSERT INTO todo
     (id, todo, priority, status, category, due_date)
     VALUES (
         '${id}',
         '${todo}',
         '${priority}',
         '${status}',
         '${category}',
         '${dueDate}'

     ) ;`;
  await db.run(addTodoQuery);
  response.send("Todo Successfully Added");
});

//API 5 pending
app.put("/todos/:todoId/", async (request, response) => {
  const requestBody = request.body;
  const { todoId } = request.params;
  console.log(requestBody);
  let updateColumn = "";
  let updateQuery = "";
  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = "Status";
      updateQuery = `UPDATE todo SET status = '${requestBody.status}'
          WHERE id = ${todoId};`;
      break;
    case requestBody.priority !== undefined:
      updateColumn = "Priority";
      updateQuery = `UPDATE todo SET priority = '${requestBody.priority}'
          WHERE id = ${todoId};`;
      break;
    case requestBody.todo !== undefined:
      updateColumn = "Todo";
      updateQuery = `UPDATE todo SET todo = '${requestBody.todo}'
          WHERE id = ${todoId};`;
      break;
    case requestBody.category !== undefined:
      updateColumn = "Category";
      updateQuery = `UPDATE todo SET category = '${requestBody.category}'
          WHERE id = ${todoId};`;
      break;
    case requestBody.dueDate !== undefined:
      updateColumn = "Due Date";
      const formattedDate = fns.format(
        new Date(requestBody.dueDate),
        "yyyy-MM-dd"
      );

      updateQuery = `UPDATE todo SET due_date = '${formattedDate}'
          WHERE id = ${todoId};`;
      break;
  }
  await db.run(updateQuery);
  response.send(`${updateColumn} Updated`);
});

//API 6
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `DELETE FROM todo
     WHERE id = '${todoId}'; `;
  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;

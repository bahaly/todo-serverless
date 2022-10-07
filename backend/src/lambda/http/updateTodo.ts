import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'

import * as middy from 'middy'
import { cors } from 'middy/middlewares'

import { UpdateTodoRequest } from '../../requests/UpdateTodoRequest'
import { AuthHelper } from '../../helpers/authHelper'
import { TodosAccess } from '../../dataLayer/todosAccess'
import { createLogger } from '../../utils/logger'

const logger = createLogger('todos')
const todosAccess = new TodosAccess()
const authHelper = new AuthHelper()

export const handler = middy(async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const todoId = event.pathParameters.todoId
  const updatedTodo: UpdateTodoRequest = JSON.parse(event.body)
  // TODO: Update a TODO item with the provided id using values in the "updatedTodo" object

  const userId = authHelper.getUserId(event)

  const item = await todosAccess.getTodoById(todoId)

  if (item.Count == 0) {
    return {
      statusCode: 404,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true
      },
      body: JSON.stringify({
        error: 'No TODO with the provided id is found'
      })
    }
  }

  if (item.Items[0].userId !== userId) {
    return {
      statusCode: 403,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true
      },
      body: JSON.stringify({
        error: 'You can not perform this action, this TODO does not belong to your account!'
      })
    }
  }

  logger.info(`User ${userId} updating Todo ${todoId} to be ${updatedTodo}`)
  await new TodosAccess().updateTodo(updatedTodo, todoId)
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true
    },
    body: JSON.stringify({
      message: 'The request has succeeded.'
    })
  }
})

handler.use(
  cors({
    credentials: true
  })
)

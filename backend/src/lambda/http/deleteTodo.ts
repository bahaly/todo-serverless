import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as middy from 'middy'
import { cors } from 'middy/middlewares'
import { AuthHelper } from '../../helpers/authHelper'
import { TodosAccess } from '../../dataLayer/todosAccess'
import { createLogger } from '../../utils/logger'

const authHelper = new AuthHelper();
const logger = createLogger('todos')
const todosAccess = new TodosAccess()

export const handler = middy(async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  // Write your code here
  const todoId = event.pathParameters.todoId
  if (!todoId) {
    logger.error('Invalid delete without Todo id')
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: 'invalid parameters'
      })
    }
  }

  const userId = authHelper.getUserId(event)
  const item = await todosAccess.getTodoById(todoId)
  if (item.Count == 0) {
    logger.error(`User ${userId} attemp to delete non existing Todo with id ${todoId}`)
    return {
      statusCode: 404,
      body: JSON.stringify({
        error: 'No TODO with the provided id is found'
      })
    }
  }

  if (item.Items[0].userId !== userId) {
    logger.error(`User ${userId} attemp to delete Todo that does not belong to his account with id ${todoId}`)
    return {
      statusCode: 403,
      body: JSON.stringify({
        error: 'You can not perform this action, this TODO does not belong to your account!'
      })
    }
  }

  logger.info(`User ${userId} deleting todo ${todoId}`)
  await todosAccess.deleteTodoById(todoId)
  return {
    statusCode: 200,
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
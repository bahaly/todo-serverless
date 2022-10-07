import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as middy from 'middy'
import { cors } from 'middy/middlewares'

import { TodosAccess } from '../../dataLayer/todosAccess'
import { AuthHelper } from '../../helpers/authHelper'
import { S3Helper } from '../../helpers/s3Helper'
import { createLogger } from '../../utils/logger'

const s3Helper = new S3Helper()
const authHelper = new AuthHelper();
const logger = createLogger('todos')

export const handler = middy(async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  // Write your code here
  const userId = authHelper.getUserId(event)
  logger.info(`Get Todos for user ${userId}`)
  const todos = await new TodosAccess().getUserTodos(userId)

  for (const todo of todos) {
    todo.attachmentUrl = await s3Helper.getTodoAttachmentUrl(todo.todoId)
  }

  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true
    },
    body: JSON.stringify({
      items: todos
    })
  }
})


handler.use(
  cors({
    credentials: true
  })
)

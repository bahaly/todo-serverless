import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as middy from 'middy'
import { cors } from 'middy/middlewares'

import { TodosAccess } from '../../dataLayer/todosAccess'
import { AuthHelper } from '../../helpers/authHelper'
import { S3Helper } from '../../helpers/s3Helper';
import { createLogger } from '../../utils/logger'

const todosAccess = new TodosAccess()
const authHelper = new AuthHelper()
const s3Helper = new S3Helper()
const logger = createLogger('todos')

export const handler = middy(async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const todoId = event.pathParameters.todoId
  // TODO: Return a presigned URL to upload a file for a TODO item with the provided id
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
        error: 'No TODO with the provided id is found!'
      })
    }
  }

  if (item.Items[0].userId !== userId) {
    logger.error(`User ${userId} requesting put url Todo does not belong to his account with id ${todoId}`)
    return {
      statusCode: 403,
      body: JSON.stringify({
        error: 'You can not perform this action, this TODO does not belong to your account!'
      })
    }
  }

  const uploadUrl = s3Helper.getPresignedUrl(todoId)
  return {
    statusCode: 200,
    body: JSON.stringify({
      uploadUrl: uploadUrl
    })
  }
})

handler.use(
  cors({
    credentials: true
  })
)

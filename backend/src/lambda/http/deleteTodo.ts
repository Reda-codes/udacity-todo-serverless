import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as middy from 'middy'
import { cors, httpErrorHandler } from 'middy/middlewares'

import { userPerm, deleteTodo } from '../../helpers/todos'
import { getUserId } from '../utils'
import { createLogger } from '../../utils/logger'

const logger = createLogger('deleteTodo')

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const todoId = event.pathParameters.todoId
    // TODO: Remove a TODO item by id

    logger.info('Processing delete todo event', {
      event
    })

    const userId = getUserId(event)
    const havePerm = await userPerm(todoId, userId)

    if (!havePerm.status) {
      const statusCode = havePerm.reason === 'NOT_FOUND' ? 404 : 403
      const error =
        havePerm.reason === 'NOT_FOUND'
          ? 'Todo Does not exist'
          : 'You are not allowed to delete this todo'

      logger.error('Delete todo failed', {
        statusCode,
        error
      })

      return {
        statusCode,
        body: JSON.stringify({
          error
        })
      }
    }

    await deleteTodo(todoId, userId)

    return {
      statusCode: 200,
      body: ''
    }
  }
)

handler.use(httpErrorHandler()).use(
  cors({
    credentials: true
  })
)

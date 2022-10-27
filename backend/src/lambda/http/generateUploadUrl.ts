import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as middy from 'middy'
import { cors, httpErrorHandler } from 'middy/middlewares'

import { userPerm, createAttachmentPresignedUrl } from '../../businessLogic/todos'
import { getUserId } from '../utils'
import { createLogger } from '../../utils/logger'

const logger = createLogger('generateUploadUrl')

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const todoId = event.pathParameters.todoId
    // TODO: Return a presigned URL to upload a file for a TODO item with the provided id

    const userId = getUserId(event)

    logger.info('Processing Generate updload url event', {
      event
    })

    const havePerm = await userPerm(todoId, userId)

    if (!havePerm.status) {
      const statusCode = havePerm.reason === 'NOT_FOUND' ? 404 : 403
      const error =
        havePerm.reason === 'NOT_FOUND'
          ? 'Todo Does not exist'
          : 'You are not allowed to delete this todo'

      logger.error('generate updaload url for todo failed', {
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

    const uploadUrl = createAttachmentPresignedUrl(todoId)

    return {
      statusCode: 201,
      body: JSON.stringify(
        {
          uploadUrl
        },
        null,
        2
      )
    }
  }
)

handler.use(httpErrorHandler()).use(
  cors({
    credentials: true
  })
)

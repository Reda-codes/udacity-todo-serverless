import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as middy from 'middy'
import { cors, httpErrorHandler } from 'middy/middlewares'

import { userPerm, updateTodo } from "../../helpers/todos";
import { UpdateTodoRequest } from '../../requests/UpdateTodoRequest'
import { getUserId } from '../utils'
import { createLogger } from '../../utils/logger'

const logger = createLogger("updateTodo");

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const todoId = event.pathParameters.todoId
    const todoRequestBody: UpdateTodoRequest = JSON.parse(event.body)
    // TODO: Update a TODO item with the provided id using values in the "updatedTodo" object

    logger.info("Processing update todo event", {
      event,
    })

    const userId = getUserId(event)
    const havePerm = await userPerm(todoId, userId)
    if (!havePerm.status) {
      const statusCode = havePerm.reason === 'NOT_FOUND' ? 404 : 403
      const error =
        havePerm.reason === 'NOT_FOUND'
          ? 'Todo Does not exist'
          : 'You are not allowed to update this todo'

      logger.error("Update todo failed", {
        statusCode,
        error,
      })

      return {
        statusCode,
        body: JSON.stringify({
          error
        })
      }
    }

    await updateTodo(todoId, userId, todoRequestBody)

    return {
      statusCode: 200,
      body: ''
    }
  }
)

handler
  .use(httpErrorHandler())
  .use(
    cors({
      credentials: true
    })
  )
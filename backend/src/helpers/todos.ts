import { TodosAccess } from './todosAcess'
import { getUploadUrl } from './attachmentUtils';
import { TodoItem } from '../models/TodoItem'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'
import { createLogger } from '../utils/logger';
import * as uuid from 'uuid'

import { APIGatewayProxyEvent } from 'aws-lambda'
import { getUserId } from '../lambda/utils'
import { UserPermission } from './prmTyp'

const todoItemAccess = new TodosAccess()
const bucketName = process.env.ATTACHMENT_S3_BUCKET
const urlExpiration = process.env.SIGNED_URL_EXPIRATION

const logger = createLogger("TodosLogic");

// Get all todos for one user.
export async function getTodosForUser(
    event: APIGatewayProxyEvent
): Promise<TodoItem[]> {
    const userId = getUserId(event)

    logger.info("Get all todo for user", {
        userId,
    });

    return todoItemAccess.getUserTodos(userId)
}


//Create a new todo.
export async function createTodo(
    createTodoRequest: CreateTodoRequest,
    event: APIGatewayProxyEvent
): Promise<TodoItem> {
    const todoId = uuid.v4() as string
    const userId = getUserId(event)

    logger.info("Create todo", {
        userId,
        todoId
    })

    return await todoItemAccess.createTodo({
        todoId,
        userId,
        createdAt: new Date().toISOString(),
        done: false,
        ...createTodoRequest,
        attachmentUrl: `https://${bucketName}.s3.amazonaws.com/${todoId}`
    })
}

//Create url for attachement updload.
export function createAttachmentPresignedUrl(todoId: string): string {
    logger.info("createAttachmentPresignedUrl", {
        todoId
    })

    return getUploadUrl(todoId, bucketName, parseInt(urlExpiration))
}


//Update a todo.
export async function updateTodo(
    todoId: string,
    userId: string,
    updateTodoRequest: UpdateTodoRequest
): Promise<void> {

    logger.info("Update todo", {
        todoId,
        updateTodoRequest
    })

    await todoItemAccess.updateTodo(todoId, userId, updateTodoRequest)
}


//Get a todo by id.
export async function getTodo(todoId: string): Promise<TodoItem | null> {
    logger.info("get one todo by id", {
        todoId
    })

    return await todoItemAccess.getTodo(todoId)
}


// Check if a user has permission to (edit, delete) a todo.
export async function userPerm(
    todoId: string,
    userId: string
): Promise<UserPermission> {
    const todo = await getTodo(todoId)

    if (todo == null) {
        return {
            status: false,
            reason: 'NOT_FOUND'
        }
    }

    if (todo.userId != userId) {
        return {
            status: false,
            reason: 'UNAUTHORIZED'
        }
    }

    return {
        status: true
    }
}

//Delete a todo
export async function deleteTodo(todoId: string, userId: string): Promise<void> {
    logger.info("deletng one todo", {
        todoId
    })

    await todoItemAccess.deleteTodo(todoId, userId);
}
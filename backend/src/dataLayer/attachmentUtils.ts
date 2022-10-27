import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'

const XAWS = AWSXRay.captureAWS(AWS)
// TODO: Implement the fileStogare logic

const s3 = new XAWS.S3({
    signatureVersion: 'v4'
})

export function getUploadUrl(
    key: string,
    bucketName: string,
    expiration: number
): string {
    return s3.getSignedUrl('putObject', {
        Bucket: bucketName,
        Key: key,
        Expires: expiration
    })
}